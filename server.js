const express = require('express');

/**
 * Express server đơn giản cho health check trên Render
 * Giữ bot online bằng cách có endpoint để uptime monitor ping
 */
function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    app.get('/', (req, res) => {
        res.json({
            status: 'online',
            bot: 'Nora Music Bot',
            uptime: formatUptime(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/health', (req, res) => {
        res.status(200).send('OK');
    });

    app.listen(PORT, () => {
        console.log(`🌐 Health check server running on port ${PORT}`);
    });
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

module.exports = { startServer };
