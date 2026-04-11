const { getQueue } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'shuffle',
    aliases: ['mix'],
    description: 'Xáo trộn thứ tự bài hát trong hàng đợi',
    usage: 'n!shuffle',

    async execute(message) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.isPlaying) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        if (queue.tracks.length < 2) {
            return message.reply({ embeds: [errorEmbed('Cần ít nhất 2 bài trong hàng đợi để xáo trộn!')] });
        }

        // Fisher-Yates shuffle
        for (let i = queue.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
        }

        return message.reply({
            embeds: [successEmbed(`Đã xáo trộn **${queue.tracks.length}** bài hát trong hàng đợi ${config.emojis.shuffle}`)],
        });
    },
};
