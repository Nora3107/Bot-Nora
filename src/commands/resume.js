const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'resume',
    aliases: ['r', 'unpause'],
    description: 'Tiếp tục phát bài hát đã tạm dừng',
    usage: 'n!resume',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào trong hàng đợi!')] });
        }

        if (!queue.node.isPaused()) {
            return message.reply({ embeds: [errorEmbed('Bài hát không đang tạm dừng!')] });
        }

        queue.node.resume();
        return message.reply({ embeds: [successEmbed(`Đã tiếp tục phát nhạc ${config.emojis.play}`)] });
    },
};
