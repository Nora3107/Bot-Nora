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

    // Khởi tạo Player — wrap trong try-catch để bot không crash
    try {
        const player = await initPlayer(client);
        setupPlayerEvents(player);
        console.log('✅ Bot đã sẵn sàng hoàn toàn!');
    } catch (err) {
        console.error('❌ Lỗi khởi tạo Player (bot vẫn online nhưng chưa phát nhạc được):', err.message);
    }
});

// Đăng ký message handler cho prefix commands
setupMessageHandler(client);

// Xử lý lỗi không bắt được — ĐẶT TRƯỚC login
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

console.log('🔑 Đang kết nối Discord...');
client.login(config.token).catch((err) => {
    console.error('❌ Không thể đăng nhập Discord:', err.message);
    console.error('   Kiểm tra lại DISCORD_TOKEN trong Environment Variables!');
});

