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

        channel.send({ embeds: [errorEmbed(`Lỗi phát nhạc: ${error.message}`)] }).catch(() => {});
    });

    // Xử lý lỗi player (playerError)
    player.events.on('playerError', (queue, error) => {
        console.error(`Player error (track):`, error);
        const channel = queue.metadata?.channel;
        if (!channel) return;

        channel.send({ embeds: [errorEmbed(`Không thể phát bài này. Đang thử bài tiếp theo...`)] }).catch(() => {});
    });

    // ⚠️ QUAN TRỌNG: Phải lắng nghe error trên cả player (không chỉ player.events)
    // Nếu thiếu, bot sẽ crash với "No event listener found for event error"
    player.on('error', (error) => {
        console.error('[Player Error]:', error.message || error);
    });

    player.events.on('debug', (queue, message) => {
        // Chỉ log debug trong dev
    });

    console.log('✅ Player events registered');
}

module.exports = { setupPlayerEvents };
