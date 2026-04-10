const { createEmbed } = require('../utils/embed');
const config = require('../config');

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Hiển thị danh sách tất cả lệnh của Nora',
    usage: 'n!help',

    async execute(message, args, client) {
        const commands = client.commands;

        const embed = createEmbed({
            title: `${config.emojis.music} Nora Music Bot — Trợ giúp`,
            description: [
                `Xin chào! Tôi là **Nora** — bot phát nhạc của bạn! ${config.emojis.heart}`,
                `Prefix: \`${config.prefix}\``,
                ``,
                `━━━━━━━━━━━━━━━━━━━━━━`,
            ].join('\n'),
            color: config.colors.primary,
        });

        // Nhóm commands
        const groups = {
            '🎵 Phát nhạc': ['play', 'skip', 'stop', 'pause', 'resume', 'seek'],
            '📋 Hàng đợi': ['list', 'nowplaying', 'remove', 'shuffle'],
            '🔧 Cài đặt': ['volume', 'loop'],
            'ℹ️ Khác': ['help'],
        };

        for (const [groupName, cmdNames] of Object.entries(groups)) {
            const fieldValue = cmdNames
                .map((name) => {
                    const cmd = commands.find((c) => c.name === name);
                    if (!cmd) return null;
                    const aliases = cmd.aliases?.length
                        ? ` (\`${cmd.aliases.map((a) => config.prefix + a).join('`, `')}\`)`
                        : '';
                    return `**\`${config.prefix}${cmd.name}\`**${aliases}\n┗ ${cmd.description}`;
                })
                .filter(Boolean)
                .join('\n\n');

            if (fieldValue) {
                embed.addFields({ name: groupName, value: fieldValue });
            }
        }

        embed.addFields({
            name: '━━━━━━━━━━━━━━━━━━━━━━',
            value: [
                `${config.emojis.star} **Nguồn hỗ trợ:** YouTube, Spotify, SoundCloud, Apple Music`,
                `${config.emojis.link} Có thể dùng link hoặc từ khóa để tìm bài`,
                `${config.emojis.search} Tìm bằng từ khóa sẽ hiện danh sách để bạn chọn`,
            ].join('\n'),
        });

        return message.reply({ embeds: [embed] });
    },
};
