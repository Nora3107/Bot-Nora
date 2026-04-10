const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'shuffle',
    aliases: ['mix'],
    description: 'Xáo trộn thứ tự bài hát trong hàng đợi',
    usage: 'n!shuffle',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        if (queue.tracks.size < 2) {
            return message.reply({ embeds: [errorEmbed('Cần ít nhất 2 bài trong hàng đợi để xáo trộn!')] });
        }

        queue.tracks.shuffle();
        return message.reply({
            embeds: [successEmbed(`Đã xáo trộn **${queue.tracks.size}** bài hát trong hàng đợi ${config.emojis.shuffle}`)],
        });
    },
};
