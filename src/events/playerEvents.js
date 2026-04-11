const { nowPlayingEmbed, createEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

/**
 * Đăng ký tất cả player events
 */
function setupPlayerEvents(player) {

    // Khi bắt đầu phát bài
    player.events.on('playerStart', (queue, track) => {
        const channel = queue.metadata?.channel;
        if (!channel) return;

        const embed = nowPlayingEmbed(track, queue);
        channel.send({ embeds: [embed] }).catch(() => {});
    });

    // Khi thêm bài vào queue (không phải bài đầu tiên)
    player.events.on('audioTrackAdd', (queue, track) => {
        // Không gửi message nếu đây là bài đầu tiên (sẽ có playerStart)
        if (queue.tracks.size === 0 && queue.isPlaying()) return;
    });

    // Khi thêm playlist vào queue
    player.events.on('audioTracksAdd', (queue, tracks) => {
        const channel = queue.metadata?.channel;
        if (!channel) return;

        const embed = createEmbed({
            title: `${config.emojis.success} Đã thêm Playlist`,
            description: `Đã thêm **${tracks.length}** bài vào hàng đợi`,
            color: config.colors.success,
        });

        channel.send({ embeds: [embed] }).catch(() => {});
    });

    // Khi queue kết thúc
    player.events.on('emptyQueue', (queue) => {
        const channel = queue.metadata?.channel;
        if (!channel) return;

        const embed = createEmbed({
            title: `${config.emojis.music} Hết bài hát`,
            description: 'Hàng đợi đã trống. Dùng `n!play` để thêm bài mới!',
            color: config.colors.info,
        });

        channel.send({ embeds: [embed] }).catch(() => {});
    });

    // Khi voice channel trống (mọi người rời đi)
    player.events.on('emptyChannel', (queue) => {
        const channel = queue.metadata?.channel;
        if (!channel) return;

        const embed = createEmbed({
            description: `${config.emojis.warning} Đã rời kênh thoại vì không còn ai trong kênh.`,
            color: config.colors.warning,
        });

        channel.send({ embeds: [embed] }).catch(() => {});
    });

    // Xử lý lỗi player
    player.events.on('error', (queue, error) => {
        console.error(`Player error:`, error);
        const channel = queue.metadata?.channel;
        if (!channel) return;

        // Phân loại lỗi YouTube
        let errorMsg = `Lỗi phát nhạc: ${error.message}`;
        if (error.message?.includes('403') || error.message?.includes('Sign in')) {
            errorMsg = `YouTube đã chặn request. Thử:\n• Cập nhật cookie trong .env\n• Dùng link SoundCloud/Spotify thay thế`;
        } else if (error.message?.includes('410') || error.message?.includes('Gone')) {
            errorMsg = `Video không khả dụng hoặc đã bị xóa.`;
        }

        channel.send({ embeds: [errorEmbed(errorMsg)] }).catch(() => {});
    });

    // Xử lý lỗi player (playerError) — lỗi khi đang stream track
    player.events.on('playerError', (queue, error, track) => {
        console.error(`Player error (track):`, error.message);
        console.error(`  → Track: ${track?.title || 'unknown'}`);
        console.error(`  → URL: ${track?.url || 'unknown'}`);
        const channel = queue.metadata?.channel;
        if (!channel) return;

        let errorMsg = `Không thể phát bài **${track?.title || 'này'}**. Đang thử bài tiếp theo...`;

        // Gợi ý nguyên nhân cụ thể
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            errorMsg += `\n\n💡 *Nguyên nhân: YouTube chặn IP/bot. Thử thêm cookie vào .env hoặc dùng link SoundCloud.*`;
        } else if (error.message?.includes('ECONNRESET') || error.message?.includes('ETIMEDOUT')) {
            errorMsg += `\n\n💡 *Nguyên nhân: Kết nối mạng bị gián đoạn.*`;
        }

        channel.send({ embeds: [errorEmbed(errorMsg)] }).catch(() => {});
    });

    // Debug logging
    player.events.on('debug', (queue, message) => {
        if (process.env.NODE_ENV !== 'production') {
            // console.log(`[Player Debug] ${message}`);
        }
    });

    console.log('✅ Player events registered');
}

module.exports = { setupPlayerEvents };
