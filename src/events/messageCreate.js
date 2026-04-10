const config = require('../config');

/**
 * Xử lý prefix commands từ messages
 */
function setupMessageHandler(client) {
    client.on('messageCreate', async (message) => {
        // Bỏ qua bot messages
        if (message.author.bot) return;

        // Kiểm tra prefix
        if (!message.content.startsWith(config.prefix)) return;

        // Parse command và arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Tìm command matching (bao gồm aliases)
        const command = client.commands.find(
            (cmd) => cmd.name === commandName || (cmd.aliases && cmd.aliases.includes(commandName))
        );

        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            const { errorEmbed } = require('../utils/embed');
            message.reply({ embeds: [errorEmbed('Đã xảy ra lỗi khi thực hiện lệnh này!')] }).catch(() => {});
        }
    });
}

module.exports = { setupMessageHandler };
