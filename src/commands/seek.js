const { getQueue } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const { parseTime, formatDuration } = require('../utils/formatters');
const config = require('../config');

module.exports = {
    name: 'seek',
    aliases: [],
    description: 'Tua đến vị trí cụ thể trong bài hát (chưa hỗ trợ trong bản custom engine)',
    usage: 'n!seek <thời gian (VD: 1:30, 90)>',

    async execute(message, args) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.isPlaying) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        return message.reply({ embeds: [errorEmbed(
            '⚠️ Tính năng **Seek** tạm thời chưa hỗ trợ trong engine mới.\n' +
            'Bạn có thể dùng `n!skip` để chuyển bài.'
        )] });
    },
};
