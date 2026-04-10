const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Tạo embed chuẩn với theme Nora
 */
function createEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || config.colors.primary)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) {
        embed.setFooter({ text: options.footer });
    } else {
        embed.setFooter({ text: `${config.emojis.heart} Nora Music Bot` });
    }

    return embed;
}

/**
 * Embed thông báo thành công
 */
function successEmbed(message) {
    return createEmbed({
        description: `${config.emojis.success} ${message}`,
        color: config.colors.success,
    });
}

/**
 * Embed thông báo lỗi
 */
function errorEmbed(message) {
    return createEmbed({
        description: `${config.emojis.error} ${message}`,
        color: config.colors.error,
    });
}

/**
 * Embed thông báo cảnh báo
 */
function warningEmbed(message) {
    return createEmbed({
        description: `${config.emojis.warning} ${message}`,
        color: config.colors.warning,
    });
}

/**
 * Embed thông tin
 */
function infoEmbed(message) {
    return createEmbed({
        description: `${config.emojis.info} ${message}`,
        color: config.colors.info,
    });
}

/**
 * Embed Loading
 */
function loadingEmbed(message) {
    return createEmbed({
        description: `${config.emojis.loading} ${message}`,
        color: config.colors.info,
    });
}

/**
 * Embed Now Playing với progress bar
 */
function nowPlayingEmbed(track, queue) {
    const progressBar = queue.node.createProgressBar({
        length: 20,
        timecodes: false,
        indicator: '🔘',
        leftChar: '▬',
        rightChar: '▬',
    });

    const timestamp = queue.node.getTimestamp();
    const loopModes = ['Off', 'Track', 'Queue', 'Autoplay'];
    const loopMode = loopModes[queue.repeatMode] || 'Off';

    const description = [
        `### ${config.emojis.music} ${track.title}`,
        ``,
        `${progressBar}`,
        `\`${timestamp?.current?.label || '0:00'}\` ━━━━━━━━━━━ \`${timestamp?.total?.label || '0:00'}\``,
        ``,
        `${config.emojis.user} **Tác giả:** ${track.author}`,
        `${config.emojis.disk} **Nguồn:** ${track.source || 'Unknown'}`,
        `${config.emojis.volume} **Âm lượng:** ${queue.node.volume}%`,
        `${config.emojis.loop} **Lặp:** ${loopMode}`,
    ].join('\n');

    const embed = createEmbed({
        title: `${config.emojis.play} Now Playing`,
        description: description,
        color: config.colors.nowPlaying,
        thumbnail: track.thumbnail,
    });

    if (track.requestedBy) {
        embed.setFooter({ text: `${config.emojis.heart} Requested by ${track.requestedBy.displayName || track.requestedBy.username}` });
    }

    return embed;
}

/**
 * Embed khi thêm bài vào queue
 */
function trackAddedEmbed(track, position) {
    const embed = createEmbed({
        title: `${config.emojis.success} Đã thêm vào hàng đợi`,
        description: [
            `**${track.title}**`,
            ``,
            `${config.emojis.user} Tác giả: **${track.author}**`,
            `${config.emojis.clock} Thời lượng: **${track.duration}**`,
            `${config.emojis.queue} Vị trí: **#${position}**`,
        ].join('\n'),
        color: config.colors.success,
        thumbnail: track.thumbnail,
    });

    if (track.requestedBy) {
        embed.setFooter({ text: `${config.emojis.heart} Requested by ${track.requestedBy.displayName || track.requestedBy.username}` });
    }

    return embed;
}

module.exports = {
    createEmbed,
    successEmbed,
    errorEmbed,
    warningEmbed,
    infoEmbed,
    loadingEmbed,
    nowPlayingEmbed,
    trackAddedEmbed,
};
