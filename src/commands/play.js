const { StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { createEmbed, errorEmbed, loadingEmbed, trackAddedEmbed } = require('../utils/embed');
const { truncate, isURL } = require('../utils/formatters');
const { searchTracks, addTrack, getQueue } = require('../player');
const config = require('../config');

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Phát nhạc từ YouTube, SoundCloud, hoặc tìm kiếm bằng từ khóa',
    usage: 'n!play <link hoặc từ khóa> | n!play sc <từ khóa> | n!play yt <từ khóa>',

    async execute(message, args) {
        // Kiểm tra user có trong voice channel không
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel) {
            return message.reply({ embeds: [errorEmbed('Bạn cần vào một kênh thoại trước!')] });
        }

        // Kiểm tra bot có quyền không
        const permissions = voiceChannel.permissionsFor(message.guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return message.reply({ embeds: [errorEmbed('Tôi không có quyền kết nối hoặc phát âm thanh trong kênh thoại này!')] });
        }

        let query = args.join(' ');
        if (!query) {
            return message.reply({ embeds: [errorEmbed(
                'Vui lòng nhập tên bài hát hoặc link!\n' +
                'VD:\n' +
                '`n!play hachimi mambo` — Tìm trên YouTube\n' +
                '`n!play sc hachimi` — Tìm trên SoundCloud\n' +
                '`n!play <URL>` — Phát link trực tiếp'
            )] });
        }

        // Kiểm tra tiền tố để chọn nền tảng tìm kiếm
        let platform = 'youtube'; // Mặc định YouTube (thư viện nhạc lớn nhất)
        let platformName = 'YouTube';

        if (query.toLowerCase().startsWith('sc ')) {
            platform = 'soundcloud';
            platformName = 'SoundCloud';
            query = query.slice(3).trim();
        } else if (query.toLowerCase().startsWith('yt ')) {
            platform = 'youtube';
            platformName = 'YouTube';
            query = query.slice(3).trim();
        }

        // ═══════════════════════════════════════════
        //  Nếu là URL → phát trực tiếp
        // ═══════════════════════════════════════════
        if (isURL(query)) {
            const loadingMsg = await message.reply({ embeds: [loadingEmbed('Đang tải bài hát...')] });

            try {
                const tracks = await searchTracks(query, 'auto');

                if (!tracks || tracks.length === 0) {
                    return loadingMsg.edit({ embeds: [errorEmbed('Không tìm thấy bài hát từ link này!')] });
                }

                const track = tracks[0];
                track.requestedBy = message.author;

                const result = await addTrack(message.guild, voiceChannel, message.channel, track);

                await loadingMsg.edit({
                    embeds: [trackAddedEmbed(track, result.position || 1)],
                });

            } catch (error) {
                console.error('Play error:', error);
                return loadingMsg.edit({ embeds: [errorEmbed('Không thể phát bài hát này. Vui lòng thử lại!')] });
            }
            return;
        }

        // ═══════════════════════════════════════════
        //  Nếu là từ khóa → Tìm kiếm và hiển thị danh sách chọn
        // ═══════════════════════════════════════════
        const loadingMsg = await message.reply({ embeds: [loadingEmbed(`Đang tìm trên **${platformName}**: **${truncate(query, 70)}**...`)] });

        try {
            const tracks = await searchTracks(query, platform);

            if (!tracks || tracks.length === 0) {
                return loadingMsg.edit({ embeds: [errorEmbed(`Không tìm thấy kết quả trên ${platformName} cho: **${truncate(query, 50)}**`)] });
            }

            const displayTracks = tracks.slice(0, config.search.maxResults);

            // Tạo danh sách kết quả tìm kiếm
            const trackList = displayTracks.map((t, i) => {
                return `\`${i + 1}.\` **${truncate(t.title, 55)}** — ${t.author} \`[${t.duration}]\``;
            }).join('\n');

            // Tạo Select Menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`search_${message.id}`)
                .setPlaceholder('🎵 Chọn bài hát bạn muốn phát...')
                .addOptions(
                    displayTracks.map((track, index) => ({
                        label: truncate(track.title, 95),
                        description: truncate(`${track.author} • ${track.duration}`, 95),
                        value: index.toString(),
                        emoji: getNumberEmoji(index + 1),
                    }))
                );

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const searchEmbed = createEmbed({
                title: `${config.emojis.search} Kết quả tìm kiếm (${platformName})`,
                description: `Tìm thấy **${displayTracks.length}** kết quả cho: **${truncate(query, 40)}**\n\n${trackList}\n\n*Chọn bài hát từ menu bên dưới ⬇️*`,
                color: config.colors.primary,
            });

            await loadingMsg.edit({
                embeds: [searchEmbed],
                components: [row],
            });

            // Chờ user chọn
            try {
                const interaction = await loadingMsg.awaitMessageComponent({
                    componentType: ComponentType.StringSelect,
                    time: config.search.selectionTimeout,
                    filter: (i) => i.user.id === message.author.id,
                });

                const trackIndex = parseInt(interaction.values[0]);
                const selectedTrack = displayTracks[trackIndex];
                selectedTrack.requestedBy = message.author;

                await interaction.update({
                    embeds: [loadingEmbed(`Đang tải: **${truncate(selectedTrack.title, 50)}**...`)],
                    components: [],
                });

                const result = await addTrack(message.guild, voiceChannel, message.channel, selectedTrack);

                await loadingMsg.edit({
                    embeds: [trackAddedEmbed(selectedTrack, result.position || 1)],
                    components: [],
                });

            } catch (err) {
                // Timeout - user không chọn
                await loadingMsg.edit({
                    embeds: [createEmbed({
                        description: `${config.emojis.clock} Đã hết thời gian chọn bài. Dùng \`n!play\` để tìm lại.`,
                        color: config.colors.warning
                    })],
                    components: [],
                }).catch(() => {});
            }

        } catch (error) {
            console.error('Search error:', error);
            return loadingMsg.edit({ embeds: [errorEmbed('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại!')] });
        }
    },
};

/**
 * Trả về emoji số cho select menu
 */
function getNumberEmoji(num) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojis[num - 1] || '🎵';
}
