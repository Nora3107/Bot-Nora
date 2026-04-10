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
const token = (config.token || '').trim();

if (!token || token === 'your_discord_bot_token_here') {
    console.error('❌ Thiếu DISCORD_TOKEN!');
    process.exit(1);
}

console.log(`🔑 Token info: length=${token.length}, starts="${token.substring(0, 5)}...", ends="...${token.substring(token.length - 5)}"`);

// Test kết nối tới Discord API trước khi login
const https = require('https');
console.log('🌐 Đang test kết nối tới Discord API...');

const testReq = https.get('https://discord.com/api/v10/gateway', { timeout: 15000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log(`✅ Discord API reachable! Status: ${res.statusCode}, Gateway: ${data}`);
        console.log('🔑 Đang kết nối Discord...');
        doLogin();
    });
});

testReq.on('error', (err) => {
    console.error(`❌ KHÔNG THỂ kết nối Discord API: ${err.message}`);
    console.error('   Render có thể đang chặn kết nối. Thử login anyway...');
    doLogin();
});

testReq.on('timeout', () => {
    console.error('⏰ Discord API test TIMEOUT (15s)! Network có vấn đề.');
    testReq.destroy();
    doLogin();
});

function doLogin() {
    // Lắng nghe các sự kiện để debug
    client.on('error', (err) => {
        console.error('❌ Client error:', err.message);
    });
    client.on('warn', (msg) => {
        console.warn('⚠️ Client warning:', msg);
    });

    const loginTimeout = setTimeout(() => {
        console.error('⏰ CẢNH BÁO: Đã 30 giây mà bot vẫn chưa kết nối Discord!');
    }, 30000);

    client.login(token)
        .then(() => {
            clearTimeout(loginTimeout);
            console.log('✅ Login thành công!');
        })
        .catch((err) => {
            clearTimeout(loginTimeout);
            console.error('❌ Login thất bại:', err.message);
        });
}
