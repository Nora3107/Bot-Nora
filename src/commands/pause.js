const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'pause',
    aliases: [],
    description: 'Tạm dừng bài hát đang phát',
    usage: 'n!pause',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        if (queue.node.isPaused()) {
            return message.reply({ embeds: [errorEmbed('Bài hát đã đang tạm dừng rồi! Dùng `n!resume` để tiếp tục.')] });
        }

        queue.node.pause();
        return message.reply({ embeds: [successEmbed(`Đã tạm dừng bài hát ${config.emojis.pause}`)] });
    },
};
