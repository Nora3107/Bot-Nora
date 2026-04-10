require('dotenv').config();

module.exports = {
    // Bot prefix
    prefix: 'n!',

    // Bot token
    token: process.env.DISCORD_TOKEN,

    // Spotify API (optional)
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID || '',
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    },

    // Player settings
    player: {
        defaultVolume: 80,
        maxVolume: 100,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30000,     // 30 giây
        leaveOnEnd: true,
        leaveOnEndCooldown: 60000,       // 60 giây
        leaveOnStop: true,
        selfDeaf: true,                   // Tự deaf để tối ưu bandwidth
    },

    // Embed colors
    colors: {
        primary: 0xB967FF,    // Tím chủ đạo
        success: 0x01CDFE,    // Xanh dương neon
        error: 0xFF6B6B,      // Đỏ nhẹ
        warning: 0xFFA502,    // Cam
        info: 0x7B68EE,       // Tím medium
        nowPlaying: 0xFF61A6, // Hồng neon
    },

    // Emoji icons
    emojis: {
        music: '🎵',
        play: '▶️',
        pause: '⏸️',
        stop: '⏹️',
        skip: '⏭️',
        previous: '⏮️',
        queue: '📋',
        volume: '🔊',
        volumeMute: '🔇',
        loop: '🔁',
        loopOne: '🔂',
        shuffle: '🔀',
        search: '🔍',
        error: '❌',
        success: '✅',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '⏳',
        disk: '💿',
        heart: '💜',
        star: '⭐',
        clock: '🕐',
        user: '👤',
        link: '🔗',
    },

    // Search settings
    search: {
        maxResults: 10,          // Số kết quả tối đa hiển thị
        selectionTimeout: 60000, // 60 giây để chọn bài
    },

    // Queue display
    queue: {
        tracksPerPage: 10,
    },
};
