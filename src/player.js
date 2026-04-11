const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState, StreamType } = require('@discordjs/voice');
const { spawn, execFile } = require('child_process');
const path = require('path');
const config = require('./config');
const { formatDuration } = require('./utils/formatters');

// ═══════════════════════════════════════════
//  🎵 Nora Custom Music Engine
//  Tự viết từ đầu — không dùng discord-player
//  Dùng yt-dlp (execFile) để lấy audio stream
// ═══════════════════════════════════════════

// Lưu queue cho từng server (guild)
const queues = new Map();

// Repeat modes
const RepeatMode = {
    OFF: 0,
    TRACK: 1,
    QUEUE: 2,
};

/**
 * Lấy đường dẫn tới binary yt-dlp
 */
function getYtDlpPath() {
    // Lấy từ constants của youtube-dl-exec
    try {
        const constants = require('youtube-dl-exec/src/constants');
        if (constants.YOUTUBE_DL_PATH) return constants.YOUTUBE_DL_PATH;
    } catch (e) {}

    // Fallback: tìm binary trong node_modules
    const binName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const possiblePaths = [
        path.join(__dirname, '..', 'node_modules', 'youtube-dl-exec', 'bin', binName),
    ];
    
    for (const p of possiblePaths) {
        try {
            require('fs').accessSync(p);
            return p;
        } catch (e) {}
    }
    
    return binName;
}

const YT_DLP_PATH = getYtDlpPath();
console.log(`🔧 yt-dlp path: ${YT_DLP_PATH}`);

/**
 * Chạy yt-dlp bằng execFile (KHÔNG dùng shell) để tránh lỗi tách arguments
 * @param {string[]} args - Danh sách arguments
 * @returns {Promise<object>} JSON output
 */
function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        execFile(YT_DLP_PATH, args, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || error.message));
                return;
            }
            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                reject(new Error('Failed to parse yt-dlp output'));
            }
        });
    });
}

/**
 * Tìm kiếm bài hát bằng yt-dlp
 * @param {string} query - Từ khóa hoặc URL
 * @param {string} platform - 'youtube', 'soundcloud', 'auto'
 * @returns {Promise<Array>} Danh sách kết quả
 */
async function searchTracks(query, platform = 'auto') {
    let searchQuery = query;
    
    // Nếu không phải URL, thêm prefix tìm kiếm theo platform
    if (!query.startsWith('http://') && !query.startsWith('https://')) {
        switch (platform) {
            case 'youtube':
                searchQuery = `ytsearch10:${query}`;
                break;
            case 'soundcloud':
                searchQuery = `scsearch10:${query}`;
                break;
            default:
                searchQuery = `ytsearch10:${query}`;
                break;
        }
    }

    try {
        const result = await runYtDlp([
            searchQuery,
            '--dump-single-json',
            '--no-check-certificates',
            '--no-warnings',
            '--flat-playlist',
            '--skip-download',
        ]);

        // Nếu là playlist/search results
        if (result.entries) {
            return result.entries.map(entry => ({
                title: entry.title || 'Unknown',
                author: entry.uploader || entry.channel || entry.artist || 'Unknown',
                duration: formatDuration(entry.duration || 0),
                durationSec: entry.duration || 0,
                url: entry.webpage_url || entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
                thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || null,
                source: entry.extractor || 'unknown',
            }));
        }

        // Nếu là single track
        return [{
            title: result.title || 'Unknown',
            author: result.uploader || result.channel || result.artist || 'Unknown',
            duration: formatDuration(result.duration || 0),
            durationSec: result.duration || 0,
            url: result.webpage_url || result.url,
            thumbnail: result.thumbnail || result.thumbnails?.[0]?.url || null,
            source: result.extractor || 'unknown',
        }];
    } catch (error) {
        console.error('Search error:', error.message);
        return [];
    }
}
/**
 * Lấy URL audio trực tiếp từ yt-dlp
 * @param {string} url - URL bài hát
 * @returns {Promise<string>} Direct audio URL
 */
function getAudioUrl(url, title = '') {
    return new Promise((resolve, reject) => {
        execFile(YT_DLP_PATH, [
            url,
            '--no-check-certificates',
            '--no-warnings',
            '--format', 'bestaudio/best',
            '--get-url',
            // Thêm bypass params cho YouTube
            '--extractor-args', 'youtube:player_client=android,web',
            '--force-ipv4',
        ], { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) {
                // Tự động thử fallback qua SoundCloud cho TẤT CẢ các lỗi fetch link từ yt-dlp
                if (title) {
                    console.log(`[Stream] Direct stream fetch failed, falling back to SoundCloud for: ${title}`);
                    const scQuery = `scsearch1:${title}`;
                    return execFile(YT_DLP_PATH, [
                        scQuery,
                        '--no-check-certificates',
                        '--no-warnings',
                        '--format', 'bestaudio/best',
                        '--get-url',
                    ], { maxBuffer: 1024 * 1024 }, (err2, stdout2) => {
                        if (err2) {
                            console.error(`[Stream Fallback Error]`, err2.message);
                            return reject(new Error('Audio stream and SoundCloud fallback both failed. ' + error.message));
                        }
                        const audioUrl = stdout2.trim().split('\n')[0];
                        if (!audioUrl) return reject(new Error('No audio URL from SoundCloud fallback'));
                        resolve(audioUrl);
                    });
                }
                reject(new Error(stderr || error.message));
                return;
            }
            const audioUrl = stdout.trim().split('\n')[0];
            if (!audioUrl) {
                reject(new Error('No audio URL returned'));
                return;
            }
            resolve(audioUrl);
        });
    });
}

/**
 * Tạo audio stream từ URL bằng 2 bước:
 * 1. yt-dlp --get-url → lấy direct audio URL
 * 2. ffmpeg đọc trực tiếp URL đó → output PCM 48kHz stereo
 */
async function createStream(track) {
    const ffmpegPath = require('ffmpeg-static');
    
    let audioUrl;
    // SOUNDCLOUD BRIDGE: Tránh lỗi 403 Forbidden của YouTube khi ffmpeg tải file trên máy chủ Render.
    // Nếu track lấy từ youtube, ta bỏ qua YouTube và nối thẳng sang SoundCloud bằng tên bài hát.
    if (track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
        const searchTitle = `${track.title} ${track.author}`.replace(/[^\w\s\u00C0-\u1EF9]/gi, ''); // Xóa kí tự đặc biệt để search cho chuẩn
        console.log(`[Stream] 🌉 SoundCloud Bridge activated for: ${searchTitle}`);
        audioUrl = await getAudioUrl(`scsearch1:${searchTitle}`);
    } else {
        // Các nền tảng khác thì lấy direct url bình thường
        audioUrl = await getAudioUrl(track.url);
    }

    console.log(`[Stream] Final Audio URL ready!`);

    // Bước 2: FFmpeg đọc URL trực tiếp → output PCM s16le (tốt cho inlineVolume của Discord)
    const ffmpegProcess = spawn(ffmpegPath, [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-i', audioUrl,           // Input từ direct URL
        '-analyzeduration', '0',
        '-loglevel', '0',
        '-f', 's16le',            // Chuyển sang raw PCM 16-bit little-endian
        '-ar', '48000',           // 48kHz
        '-ac', '2',               // Stereo
        'pipe:1',                 // Output tới stdout

    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    ffmpegProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.error('[ffmpeg]', msg);
    });

    return {
        stream: ffmpegProcess.stdout,
        cleanup: () => {
            try { ffmpegProcess.kill('SIGTERM'); } catch (e) {}
        },
    };
}

/**
 * Lấy hoặc tạo queue cho một guild
 */
function getQueue(guildId) {
    return queues.get(guildId) || null;
}

/**
 * Tạo queue mới cho guild
 */
async function createQueue(guild, voiceChannel, textChannel) {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: config.player.selfDeaf,
    });

    connection.on('stateChange', (oldState, newState) => {
        console.log(`[Voice Connection] State changed: ${oldState.status} → ${newState.status}`);
    });
    
    connection.on('debug', message => {
        console.log(`[Voice Debug] ${message}`);
    });

    connection.on('error', error => {
        console.error(`[Voice Error]`, error);
    });

    // Chờ connection Ready trước khi làm gì tiếp
    console.log(`[Voice] Joining channel... Initial State: ${connection.state.status}`);
    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 15000);
        console.log(`[Voice] Connected successfully!`);
    } catch (e) {
        console.error(`[Voice] Failed to connect within 15s, state: ${connection.state.status}`);
        // Vẫn tiếp tục, có thể connection ready sau
    }

    const audioPlayer = createAudioPlayer();
    connection.subscribe(audioPlayer);
    console.log(`[Voice] Player subscribed to connection`);

    const queue = {
        guild: guild,
        voiceChannel: voiceChannel,
        textChannel: textChannel,
        connection: connection,
        player: audioPlayer,
        tracks: [],                   // Hàng đợi bài hát
        currentTrack: null,           // Bài đang phát
        currentResource: null,        // Audio resource hiện tại
        currentCleanup: null,         // Cleanup function cho stream hiện tại
        volume: config.player.defaultVolume,
        repeatMode: RepeatMode.OFF,
        isPlaying: false,
        isPaused: false,
        startedAt: null,              // Thời điểm bắt đầu phát bài hiện tại
        pausedAt: null,               // Thời điểm tạm dừng
        totalPausedMs: 0,             // Tổng thời gian đã tạm dừng
    };

    // Xử lý khi bài hát kết thúc
    audioPlayer.on(AudioPlayerStatus.Idle, () => {
        if (!queue.isPlaying) return;
        
        // Cleanup stream cũ
        if (queue.currentCleanup) {
            queue.currentCleanup();
            queue.currentCleanup = null;
        }

        // Xử lý repeat mode
        if (queue.repeatMode === RepeatMode.TRACK && queue.currentTrack) {
            // Lặp lại bài hiện tại
            playTrack(queue, queue.currentTrack);
            return;
        }

        if (queue.repeatMode === RepeatMode.QUEUE && queue.currentTrack) {
            // Đẩy bài vừa phát về cuối queue
            queue.tracks.push(queue.currentTrack);
        }

        // Phát bài tiếp theo
        if (queue.tracks.length > 0) {
            const nextTrack = queue.tracks.shift();
            playTrack(queue, nextTrack);
        } else {
            // Hết bài
            queue.isPlaying = false;
            queue.currentTrack = null;
            
            queue.textChannel.send({
                embeds: [{
                    color: config.colors.info,
                    description: `${config.emojis.music} Hết bài hát. Dùng \`n!play\` để thêm bài mới!`,
                    footer: { text: `${config.emojis.heart} Nora Music Bot` },
                    timestamp: new Date().toISOString(),
                }],
            }).catch(() => {});

            // Tự rời sau một khoảng thời gian
            if (config.player.leaveOnEnd) {
                setTimeout(() => {
                    const currentQueue = getQueue(guild.id);
                    if (currentQueue && !currentQueue.isPlaying) {
                        destroyQueue(guild.id);
                    }
                }, config.player.leaveOnEndCooldown);
            }
        }
    });

    // Xử lý lỗi player
    audioPlayer.on('error', (error) => {
        console.error('[AudioPlayer Error]', error.message);
        
        queue.textChannel.send({
            embeds: [{
                color: config.colors.error,
                description: `${config.emojis.error} Lỗi phát nhạc: ${error.message}. Đang thử bài tiếp theo...`,
                footer: { text: `${config.emojis.heart} Nora Music Bot` },
                timestamp: new Date().toISOString(),
            }],
        }).catch(() => {});

        // Thử bài tiếp
        if (queue.tracks.length > 0) {
            const nextTrack = queue.tracks.shift();
            playTrack(queue, nextTrack);
        } else {
            queue.isPlaying = false;
            queue.currentTrack = null;
        }
    });

    // Xử lý mất kết nối
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            // Thử reconnect
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5000),
            ]);
        } catch (e) {
            // Không reconnect được → destroy
            destroyQueue(guild.id);
        }
    });

    queues.set(guild.id, queue);
    return queue;
}

/**
 * Phát một track trong queue
 */
async function playTrack(queue, track) {
    try {
        queue.currentTrack = track;
        queue.isPlaying = true;
        queue.isPaused = false;
        queue.startedAt = Date.now();
        queue.totalPausedMs = 0;
        queue.pausedAt = null;

        console.log(`[PlayTrack] Starting: ${track.title}`);
        console.log(`[PlayTrack] Connection state: ${queue.connection.state.status}`);

        // Đảm bảo connection đã Ready trước khi phát
        if (queue.connection.state.status !== VoiceConnectionStatus.Ready) {
            console.log(`[PlayTrack] Waiting for connection to be ready...`);
            try {
                await entersState(queue.connection, VoiceConnectionStatus.Ready, 10000);
            } catch (e) {
                console.error(`[PlayTrack] Connection failed to reach Ready state`);
            }
            console.log(`[PlayTrack] Connection state now: ${queue.connection.state.status}`);
        }

        // Tạo stream từ yt-dlp + ffmpeg
        const { stream, cleanup } = await createStream(track);
        queue.currentCleanup = cleanup;

        // Debug: theo dõi data flowing
        let totalBytes = 0;
        stream.on('data', (chunk) => {
            totalBytes += chunk.length;
            if (totalBytes === chunk.length) {
                console.log(`[Stream] First data chunk: ${chunk.length} bytes`);
            }
        });
        stream.on('end', () => console.log(`[Stream] Ended. Total: ${totalBytes} bytes`));
        stream.on('error', (e) => console.error(`[Stream] Error:`, e.message));

        // Tạo audio resource
        const resource = createAudioResource(stream, {
            inputType: StreamType.Raw,
            inlineVolume: true,
        });

        // Set volume
        if (resource.volume) {
            resource.volume.setVolume(queue.volume / 100);
        }

        queue.currentResource = resource;

        // Debug: theo dõi player state changes
        queue.player.on('stateChange', (oldState, newState) => {
            console.log(`[AudioPlayer] ${oldState.status} → ${newState.status}`);
        });

        queue.player.play(resource);
        console.log(`[PlayTrack] player.play() called`);

        // Gửi thông báo "Now Playing"
        const embed = {
            color: config.colors.nowPlaying,
            title: `${config.emojis.play} Now Playing`,
            description: [
                `### ${config.emojis.music} ${track.title}`,
                ``,
                `${config.emojis.user} **Tác giả:** ${track.author}`,
                `${config.emojis.clock} **Thời lượng:** ${track.duration}`,
                `${config.emojis.disk} **Nguồn:** ${track.source || 'Unknown'}`,
                `${config.emojis.volume} **Âm lượng:** ${queue.volume}%`,
            ].join('\n'),
            thumbnail: track.thumbnail ? { url: track.thumbnail } : undefined,
            footer: track.requestedBy 
                ? { text: `${config.emojis.heart} Requested by ${track.requestedBy.displayName || track.requestedBy.username}` }
                : { text: `${config.emojis.heart} Nora Music Bot` },
            timestamp: new Date().toISOString(),
        };

        queue.textChannel.send({ embeds: [embed] }).catch(() => {});

    } catch (error) {
        console.error('[PlayTrack Error]', error.message);
        
        queue.textChannel.send({
            embeds: [{
                color: config.colors.error,
                description: `${config.emojis.error} Không thể phát **${track.title}**.\nChi tiết: \`${error.message}\`\nĐang thử bài tiếp...`,
                footer: { text: `${config.emojis.heart} Nora Music Bot` },
                timestamp: new Date().toISOString(),
            }],
        }).catch(() => {});

        // Thử bài tiếp
        if (queue.tracks.length > 0) {
            const nextTrack = queue.tracks.shift();
            playTrack(queue, nextTrack);
        } else {
            queue.isPlaying = false;
            queue.currentTrack = null;
        }
    }
}

/**
 * Destroy queue và ngắt kết nối voice
 */
function destroyQueue(guildId) {
    const queue = queues.get(guildId);
    if (!queue) return;

    // Cleanup stream
    if (queue.currentCleanup) {
        queue.currentCleanup();
    }

    // Dừng player
    queue.player.stop(true);

    // Ngắt voice connection
    try {
        queue.connection.destroy();
    } catch (e) {}

    queues.delete(guildId);
}

/**
 * Thêm bài vào queue và phát nếu chưa phát
 * @returns {{ track, position }} Track đã thêm và vị trí trong queue
 */
async function addTrack(guild, voiceChannel, textChannel, track) {
    let queue = getQueue(guild.id);
    
    if (!queue) {
        queue = await createQueue(guild, voiceChannel, textChannel);
    }

    // Gán requestedBy vào track
    // (đã được gán từ command)

    if (!queue.isPlaying) {
        // Nếu chưa phát → phát ngay
        await playTrack(queue, track);
        return { track, position: 0 };
    } else {
        // Đang phát → thêm vào hàng đợi
        queue.tracks.push(track);
        return { track, position: queue.tracks.length };
    }
}

module.exports = {
    searchTracks,
    getQueue,
    createQueue,
    destroyQueue,
    addTrack,
    playTrack,
    RepeatMode,
    queues,
};
