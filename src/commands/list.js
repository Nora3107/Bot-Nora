const { useMainPlayer } = require('discord-player');
const { createEmbed, errorEmbed } = require('../utils/embed');
const { truncate, formatQueueDuration } = require('../utils/formatters');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'list',
    aliases: ['l', 'queue', 'q'],
    description: 'Xem danh sách hàng đợi bài hát',
    usage: 'n!list',

    async execute(message) {
        const queue = useMainPlayer().queues.get(message.guild.id);

        if (!queue || !queue.currentTrack) {
            return message.reply({ embeds: [errorEmbed('Hàng đợi trống! Dùng `n!play` để thêm bài.')] });
        }

        const tracks = queue.tracks.toArray();
        const currentTrack = queue.currentTrack;
        const totalPages = Math.max(1, Math.ceil(tracks.length / config.queue.tracksPerPage));
        let currentPage = 0;

        function buildQueueEmbed(page) {
            const start = page * config.queue.tracksPerPage;
            const end = start + config.queue.tracksPerPage;
            const pageTracks = tracks.slice(start, end);

            const loopModes = ['Off', 'Track 🔂', 'Queue 🔁', 'Autoplay ♾️'];
            const loopMode = loopModes[queue.repeatMode] || 'Off';

            let description = [
                `### ${config.emojis.play} Đang phát`,
                `**${truncate(currentTrack.title, 60)}** — ${currentTrack.author} \`[${currentTrack.duration}]\``,
                `Requested by ${currentTrack.requestedBy || 'Unknown'}`,
                ``,
            ].join('\n');

            if (tracks.length > 0) {
                description += `### ${config.emojis.queue} Hàng đợi\n`;
                description += pageTracks.map((track, i) => {
                    const index = start + i + 1;
                    const requester = track.requestedBy ? ` | ${track.requestedBy}` : '';
                    return `\`${index}.\` **${truncate(track.title, 45)}** — \`${track.duration}\`${requester}`;
                }).join('\n');
            } else {
                description += `\n*Không có bài nào trong hàng đợi. Dùng \`n!play\` để thêm!*`;
            }

            description += `\n\n━━━━━━━━━━━━━━━━━━━━━━`;
            description += `\n${config.emojis.music} **${tracks.length}** bài trong hàng đợi`;
            description += ` | ${config.emojis.clock} Tổng: **${formatQueueDuration([currentTrack, ...tracks])}**`;
            description += ` | ${config.emojis.loop} **${loopMode}**`;
            description += ` | ${config.emojis.volume} **${queue.node.volume}%**`;

            return createEmbed({
                title: `${config.emojis.music} Hàng đợi nhạc`,
                description: description,
                color: config.colors.primary,
                footer: `Trang ${page + 1}/${totalPages} • ${config.emojis.heart} Nora Music Bot`,
                thumbnail: currentTrack.thumbnail,
            });
        }

        // Nếu chỉ có 1 trang → không cần buttons
        if (totalPages <= 1) {
            return message.reply({ embeds: [buildQueueEmbed(0)] });
        }

        // Tạo buttons phân trang
        function buildButtons(page) {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('queue_first')
                    .setEmoji('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('queue_prev')
                    .setEmoji('◀️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('queue_page')
                    .setLabel(`${page + 1} / ${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('queue_next')
                    .setEmoji('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page >= totalPages - 1),
                new ButtonBuilder()
                    .setCustomId('queue_last')
                    .setEmoji('⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page >= totalPages - 1),
            );
        }

        const msg = await message.reply({
            embeds: [buildQueueEmbed(currentPage)],
            components: [buildButtons(currentPage)],
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000, // 2 phút
            filter: (i) => i.user.id === message.author.id,
        });

        collector.on('collect', async (interaction) => {
            switch (interaction.customId) {
                case 'queue_first':
                    currentPage = 0;
                    break;
                case 'queue_prev':
                    currentPage = Math.max(0, currentPage - 1);
                    break;
                case 'queue_next':
                    currentPage = Math.min(totalPages - 1, currentPage + 1);
                    break;
                case 'queue_last':
                    currentPage = totalPages - 1;
                    break;
            }

            await interaction.update({
                embeds: [buildQueueEmbed(currentPage)],
                components: [buildButtons(currentPage)],
            });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    },
};
