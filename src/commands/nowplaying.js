const { useMainPlayer } = require('discord-player');
const { nowPlayingEmbed, errorEmbed } = require('../utils/embed');

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'now', 'playing'],
    description: 'Hiển thị bài hát đang phát với progress bar',
    usage: 'n!np',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.currentTrack) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const embed = nowPlayingEmbed(queue.currentTrack, queue);
        return message.reply({ embeds: [embed] });
    },
};
