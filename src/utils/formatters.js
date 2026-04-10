/**
 * Format giây thành MM:SS hoặc HH:MM:SS
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse thời gian từ string (VD: "1:30", "01:30", "90") → giây
 */
function parseTime(timeStr) {
    if (!timeStr) return null;

    // Nếu chỉ là số → xem như giây
    if (/^\d+$/.test(timeStr)) {
        return parseInt(timeStr);
    }

    // Parse MM:SS hoặc HH:MM:SS
    const parts = timeStr.split(':').map(Number);
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return null;
}

/**
 * Cắt text quá dài
 */
function truncate(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format tổng thời lượng của queue
 */
function formatQueueDuration(tracks) {
    let totalMs = 0;
    for (const track of tracks) {
        totalMs += track.durationMS || 0;
    }
    return formatDuration(Math.floor(totalMs / 1000));
}

/**
 * Kiểm tra URL hợp lệ
 */
function isURL(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    formatDuration,
    parseTime,
    truncate,
    formatQueueDuration,
    isURL,
};
