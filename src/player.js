const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
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

    // Load tất cả extractors mặc định (Spotify, SoundCloud, Apple Music, etc.)
    await player.extractors.loadMulti(DefaultExtractors);

    // Load YoutubeiExtractor cho YouTube ổn định hơn
    try {
        const { YoutubeiExtractor } = require('discord-player-youtubei');
        await player.extractors.register(YoutubeiExtractor, {});
        console.log('✅ YoutubeiExtractor loaded successfully');
    } catch (err) {
        console.log('⚠️ YoutubeiExtractor not available, using default YouTube extractor');
    }

    console.log(`✅ Loaded ${player.extractors.size} extractors`);

    return player;
}

module.exports = { initPlayer };
