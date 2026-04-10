const { useMainPlayer } = require('discord-player');
const { successEmbed, errorEmbed, infoEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'volume',
    aliases: ['vol', 'v'],
    description: 'Chỉnh âm lượng (0-100%)',
    usage: 'n!vol [0-100]',

    async execute(message, args) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.isPlaying()) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        // Không có argument → hiển thị volume hiện tại
        if (!args[0]) {
            const vol = queue.node.volume;
            const bar = createVolumeBar(vol);
            return message.reply({
                embeds: [infoEmbed(`${config.emojis.volume} Âm lượng hiện tại: **${vol}%**\n${bar}`)],
            });
        }

        const volume = parseInt(args[0]);

        if (isNaN(volume) || volume < 0 || volume > config.player.maxVolume) {
            return message.reply({
                embeds: [errorEmbed(`Vui lòng nhập âm lượng từ 0 đến ${config.player.maxVolume}!`)],
            });
        }

        queue.node.setVolume(volume);

        const volumeIcon = volume === 0 ? config.emojis.volumeMute : config.emojis.volume;
        const bar = createVolumeBar(volume);
        return message.reply({
            embeds: [successEmbed(`${volumeIcon} Âm lượng đã chỉnh thành **${volume}%**\n${bar}`)],
        });
    },
};

function createVolumeBar(volume) {
    const filled = Math.round(volume / 5);
    const empty = 20 - filled;
    return `\`${'█'.repeat(filled)}${'░'.repeat(empty)}\``;
}
