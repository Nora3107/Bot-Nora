require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { initPlayer } = require('./player');
const { setupMessageHandler } = require('./events/messageCreate');
const { setupPlayerEvents } = require('./events/playerEvents');
const { startServer } = require('../server');
const config = require('./config');

// ═══════════════════════════════════════════
//  🎵 NORA — Discord Music Bot
// ═══════════════════════════════════════════

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Collection lưu commands
client.commands = new Collection();

// Load tất cả commands từ thư mục commands/
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
    console.log(`📂 Loaded command: ${config.prefix}${command.name}`);
}

// ═══════════════════════════════════════════
//  Khởi động Bot
// ═══════════════════════════════════════════

client.once('ready', async () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`  🎵 ${client.user.tag} đã sẵn sàng!`);
    console.log(`  📡 Đang phục vụ ${client.guilds.cache.size} server(s)`);
    console.log(`  🎮 Prefix: ${config.prefix}`);
    console.log('═══════════════════════════════════════════');
    console.log('');

    // Set bot status
    client.user.setActivity(`${config.prefix}help | 🎵 Music`, { type: 2 }); // Type 2 = Listening

    // Khởi tạo Player
    const player = await initPlayer(client);

    // Đăng ký player events
    setupPlayerEvents(player);
});

// Đăng ký message handler cho prefix commands
setupMessageHandler(client);

// Xử lý lỗi không bắt được
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

// Khởi động health check server (cho Render)
startServer();

// Login
if (!config.token || config.token === 'your_discord_bot_token_here') {
    console.error('❌ Thiếu DISCORD_TOKEN! Vui lòng thêm token vào file .env');
    console.error('   Xem hướng dẫn trong README.md');
    process.exit(1);
}

client.login(config.token);
