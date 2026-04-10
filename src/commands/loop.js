const { useMainPlayer, QueueRepeatMode } = require('discord-player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'loop',
    aliases: ['repeat', 'lp'],
    description: 'Chuyển đổi chế độ lặp: Off → Track → Queue → Autoplay',
    usage: 'n!loop [off/track/queue/autoplay]',

    async execute(message, args) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const modes = {
            'off': { mode: QueueRepeatMode.OFF, label: 'Tắt lặp', emoji: '▶️' },
            '0': { mode: QueueRepeatMode.OFF, label: 'Tắt lặp', emoji: '▶️' },
            'track': { mode: QueueRepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            'one': { mode: QueueRepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            '1': { mode: QueueRepeatMode.TRACK, label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            'queue': { mode: QueueRepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            'all': { mode: QueueRepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            '2': { mode: QueueRepeatMode.QUEUE, label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            'autoplay': { mode: QueueRepeatMode.AUTOPLAY, label: 'Autoplay', emoji: '♾️' },
            'auto': { mode: QueueRepeatMode.AUTOPLAY, label: 'Autoplay', emoji: '♾️' },
            '3': { mode: QueueRepeatMode.AUTOPLAY, label: 'Autoplay', emoji: '♾️' },
        };

        // Nếu có argument → chuyển sang mode đó
        if (args[0]) {
            const key = args[0].toLowerCase();
            const target = modes[key];

            if (!target) {
                return message.reply({
                    embeds: [errorEmbed(
                        'Chế độ lặp không hợp lệ!\n' +
                        'Các chế độ: `off` | `track` | `queue` | `autoplay`'
                    )],
                });
            }

            queue.setRepeatMode(target.mode);
            return message.reply({ embeds: [successEmbed(`${target.emoji} ${target.label}`)] });
        }

        // Không có argument → cycle qua các mode
        const currentMode = queue.repeatMode;
        const cycleOrder = [
            QueueRepeatMode.OFF,
            QueueRepeatMode.TRACK,
            QueueRepeatMode.QUEUE,
            QueueRepeatMode.AUTOPLAY,
        ];

        const currentIndex = cycleOrder.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % cycleOrder.length;
        const nextMode = cycleOrder[nextIndex];

        const modeLabels = {
            [QueueRepeatMode.OFF]: { label: 'Tắt lặp', emoji: '▶️' },
            [QueueRepeatMode.TRACK]: { label: 'Lặp bài hiện tại', emoji: config.emojis.loopOne },
            [QueueRepeatMode.QUEUE]: { label: 'Lặp hàng đợi', emoji: config.emojis.loop },
            [QueueRepeatMode.AUTOPLAY]: { label: 'Autoplay', emoji: '♾️' },
        };

        queue.setRepeatMode(nextMode);
        const target = modeLabels[nextMode];
        return message.reply({ embeds: [successEmbed(`${target.emoji} ${target.label}`)] });
    },
};
