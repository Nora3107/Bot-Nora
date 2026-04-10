const { Player } = require('discord-player');
const config = require('./config');

/**
 * Khởi tạo và cấu hình discord-player
 * @param {import('discord.js').Client} client
 * @returns {Player}
 */
async function initPlayer(client) {
    const player = new Player(client, {
        skipFFmpeg: false,
    });

    // Load tất cả extractors mặc định (Spotify, SoundCloud, Apple Music, YouTube, etc.)
    await player.extractors.loadDefault();
    console.log(`✅ Loaded ${player.extractors.size} default extractors`);

    // Load YoutubeiExtractor cho YouTube ổn định hơn (nếu có)
    try {
        const { YoutubeiExtractor } = require('discord-player-youtubei');
        await player.extractors.register(YoutubeiExtractor, {});
        console.log('✅ YoutubeiExtractor loaded successfully');
    } catch (err) {
        console.log('⚠️ YoutubeiExtractor not available, using default YouTube extractor');
    }

    console.log(`✅ Total extractors: ${player.extractors.size}`);

    return player;
}

module.exports = { initPlayer };

