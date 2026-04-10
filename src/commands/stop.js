const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'stop',
    aliases: ['disconnect', 'dc', 'leave'],
    description: 'Dừng phát nhạc và rời kênh thoại',
    usage: 'n!stop',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        queue.delete();

        return message.reply({
            embeds: [successEmbed(`Đã dừng phát nhạc và rời kênh thoại ${config.emojis.stop}`)],
        });
    },
};
