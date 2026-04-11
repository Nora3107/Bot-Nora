const { getQueue, RepeatMode } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'loop',
    aliases: ['repeat', 'lp'],
    description: 'Chuyển đổi chế độ lặp: Off → Track → Queue',
    usage: 'n!loop [off/track/queue]',

    async execute(message, args) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.isPlaying) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const modes = {
            'off': { mode: RepeatMode.OFF, label: 'Tắt lặp', emoji: '▶️' },
            '0': { mode: RepeatMode.OFF, label: 'Tắt lặp', emoji: '▶️' },
            'track': { mode: RepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            'one': { mode: RepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            '1': { mode: RepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            'queue': { mode: RepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            'all': { mode: RepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            '2': { mode: RepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
        };

        // Nếu có argument → chuyển sang mode đó
        if (args[0]) {
            const key = args[0].toLowerCase();
            const target = modes[key];

            if (!target) {
                return message.reply({
                    embeds: [errorEmbed(
                        'Chế độ lặp không hợp lệ!\n' +
                        'Các chế độ: `off` | `track` | `queue`'
                    )],
                });
            }

            queue.repeatMode = target.mode;
            return message.reply({ embeds: [successEmbed(`${target.emoji} ${target.label}`)] });
        }

        // Không có argument → cycle qua các mode
        const cycleOrder = [RepeatMode.OFF, RepeatMode.TRACK, RepeatMode.QUEUE];
        const currentIndex = cycleOrder.indexOf(queue.repeatMode);
        const nextIndex = (currentIndex + 1) % cycleOrder.length;
        const nextMode = cycleOrder[nextIndex];

        const modeLabels = {
            [RepeatMode.OFF]: { label: 'Tắt lặp', emoji: '▶️' },
            [RepeatMode.TRACK]: { label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            [RepeatMode.QUEUE]: { label: 'Lặp hàng đợi', emoji: config.emojis.loop },
        };

        queue.repeatMode = nextMode;
        const target = modeLabels[nextMode];
        return message.reply({ embeds: [successEmbed(`${target.emoji} ${target.label}`)] });
    },
};
