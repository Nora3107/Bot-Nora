const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    description: 'Bỏ qua bài hát hiện tại',
    usage: 'n!skip',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const currentTrack = queue.currentTrack;
        const success = queue.node.skip();

        if (success) {
            return message.reply({
                embeds: [successEmbed(`Đã bỏ qua: **${currentTrack.title}** ${config.emojis.skip}`)],
            });
        }

        return message.reply({ embeds: [errorEmbed('Không thể bỏ qua bài hát này!')] });
    },
};
