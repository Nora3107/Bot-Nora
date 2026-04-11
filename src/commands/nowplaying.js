const { getQueue } = require('../player');
const { createEmbed, errorEmbed } = require('../utils/embed');
const { truncate, formatDuration } = require('../utils/formatters');
const config = require('../config');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'now', 'playing'],
    description: 'Hiển thị bài hát đang phát',
    usage: 'n!np',

    async execute(message) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.currentTrack) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const track = queue.currentTrack;
        const repeatLabels = ['Off', 'Track 🔂', 'Queue 🔁'];

        // Tính thời gian đã phát
        let elapsedSec = 0;
        if (queue.startedAt) {
            let pauseOffset = queue.totalPausedMs;
            if (queue.isPaused && queue.pausedAt) {
                pauseOffset += (Date.now() - queue.pausedAt);
            }
            elapsedSec = Math.floor((Date.now() - queue.startedAt - pauseOffset) / 1000);
        }

        // Progress bar
        const totalSec = track.durationSec || 0;
        const progress = totalSec > 0 ? Math.min(elapsedSec / totalSec, 1) : 0;
        const barLength = 20;
        const filledLength = Math.round(progress * barLength);
        const progressBar = '▬'.repeat(filledLength) + '🔘' + '▬'.repeat(barLength - filledLength);

        const description = [
            `### ${config.emojis.music} ${track.title}`,
            ``,
            `${progressBar}`,
            `\`${formatDuration(elapsedSec)}\` ━━━━━━━━━━━ \`${track.duration}\``,
            ``,
            `${config.emojis.user} **Tác giả:** ${track.author}`,
            `${config.emojis.disk} **Nguồn:** ${track.source || 'Unknown'}`,
            `${config.emojis.volume} **Âm lượng:** ${queue.volume}%`,
            `${config.emojis.loop} **Lặp:** ${repeatLabels[queue.repeatMode] || 'Off'}`,
        ].join('\n');

        const embed = createEmbed({
            title: `${config.emojis.play} Now Playing`,
            description: description,
            color: config.colors.nowPlaying,
            thumbnail: track.thumbnail,
        });

        if (track.requestedBy) {
            embed.setFooter({ text: `${config.emojis.heart} Requested by ${track.requestedBy.displayName || track.requestedBy.username}` });
        }

        return message.reply({ embeds: [embed] });
    },
};
