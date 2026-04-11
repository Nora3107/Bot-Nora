const { getQueue } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const { truncate } = require('../utils/formatters');
const config = require('../config');

module.exports = {
    name: 'remove',
    aliases: ['rm', 'delete'],
    description: 'Xóa bài hát khỏi hàng đợi theo số thứ tự',
    usage: 'n!remove <số thứ tự>',

    async execute(message, args) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.isPlaying) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        if (!args[0]) {
            return message.reply({ embeds: [errorEmbed('Vui lòng nhập số thứ tự bài hát cần xóa!\nVD: `n!remove 3`')] });
        }

        const index = parseInt(args[0]) - 1; // Convert sang 0-based index

        if (isNaN(index) || index < 0 || index >= queue.tracks.length) {
            return message.reply({
                embeds: [errorEmbed(`Số thứ tự không hợp lệ! Hàng đợi có **${queue.tracks.length}** bài (1-${queue.tracks.length}).`)],
            });
        }

        const removedTrack = queue.tracks.splice(index, 1)[0];

        return message.reply({
            embeds: [successEmbed(`Đã xóa: **${truncate(removedTrack.title, 50)}** khỏi hàng đợi ${config.emojis.success}`)],
        });
    },
};
