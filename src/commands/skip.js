const { getQueue, playTrack } = require('../player');
const { successEmbed, errorEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'skip',
    aliases: ['s'],
    description: 'Bỏ qua bài hát hiện tại',
    usage: 'n!skip',

    async execute(message) {
        const queue = getQueue(message.guild.id);

        if (!queue || !queue.isPlaying) {
            return message.reply({ embeds: [errorEmbed('Hiện không có bài hát nào đang phát!')] });
        }

        const currentTrack = queue.currentTrack;
        
        // Dừng bài hiện tại → AudioPlayer sẽ emit 'idle' → tự phát bài tiếp
        queue.player.stop();

        return message.reply({
            embeds: [successEmbed(`Đã bỏ qua: **${currentTrack?.title || 'bài hát'}** ${config.emojis.skip}`)],
        });
    },
};
