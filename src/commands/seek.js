const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const { parseTime, formatDuration } = require('../utils/formatters');
const config = require('../config');

module.exports = {
    name: 'seek',
    aliases: [],
    description: 'Tua đến vị trí cụ thể trong bài hát',
    usage: 'n!seek <thời gian (VD: 1:30, 90)>',

    async execute(message, args) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        if (!args[0]) {
            return message.reply({
                embeds: [errorEmbed('Vui lòng nhập thời gian cần tua!\nVD: `n!seek 1:30` hoặc `n!seek 90` (giây)')],
            });
        }

        const seconds = parseTime(args[0]);

        if (seconds === null) {
            return message.reply({
                embeds: [errorEmbed('Định dạng thời gian không hợp lệ!\nVD: `1:30`, `01:30:00`, `90`')],
            });
        }

        const durationMs = queue.currentTrack.durationMS;
        const seekMs = seconds * 1000;

        if (seekMs > durationMs) {
            return message.reply({
                embeds: [errorEmbed(`Thời gian vượt quá độ dài bài hát! (${queue.currentTrack.duration})`)],
            });
        }

        await queue.node.seek(seekMs);
        return message.reply({
            embeds: [successEmbed(`Đã tua đến **${formatDuration(seconds)}** ${config.emojis.clock}`)],
        });
    },
};
