const { getQueue } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'resume',
    aliases: ['r', 'unpause'],
    description: 'Tiếp tục phát bài hát đã tạm dừng',
    usage: 'n!resume',

    async execute(message) {
        const queue = getQueue(message.guild.id);

        if (!queue) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào trong hàng đợi!')] });
        }

        if (!queue.isPaused) {
            return message.reply({ embeds: [errorEmbed('Bài hát không đang tạm dừng!')] });
        }

        queue.player.unpause();
        queue.isPaused = false;
        if (queue.pausedAt) {
            queue.totalPausedMs += (Date.now() - queue.pausedAt);
            queue.pausedAt = null;
        }

        return message.reply({ embeds: [successEmbed(`Đã tiếp tục phát nhạc ${config.emojis.play}`)] });
    },
};
