# 🎵 Nora — Discord Music Bot

Bot phát nhạc Discord được xây dựng với **discord.js v14** và **discord-player**.  
Hỗ trợ phát nhạc từ **YouTube**, **Spotify**, **SoundCloud**, **Apple Music** và nhiều nguồn khác.

---

## ✨ Tính năng

- 🎶 Phát nhạc từ nhiều nguồn (YouTube, Spotify, SoundCloud, Apple Music)
- 🔍 Tìm kiếm thông minh — nhập link phát ngay, nhập từ khóa hiện danh sách chọn
- 📋 Hàng đợi với phân trang đẹp
- 🔁 Lặp bài / Lặp hàng đợi / Autoplay
- 🔀 Xáo trộn hàng đợi
- 🔊 Chỉnh âm lượng với thanh hiển thị
- ⏩ Tua bài hát đến vị trí cụ thể
- 🎨 Giao diện embed đẹp mắt, trực quan

---

## 📋 Danh sách lệnh

| Lệnh | Alias | Mô tả |
|-------|-------|-------|
| `n!play <query>` | `n!p` | Phát nhạc (link hoặc từ khóa) |
| `n!skip` | `n!s` | Bỏ qua bài hiện tại |
| `n!stop` | `n!dc` | Dừng phát & rời kênh |
| `n!list` | `n!l`, `n!q` | Xem hàng đợi |
| `n!nowplaying` | `n!np` | Bài đang phát + progress bar |
| `n!pause` | — | Tạm dừng |
| `n!resume` | `n!r` | Tiếp tục phát |
| `n!volume <0-100>` | `n!vol`, `n!v` | Chỉnh âm lượng |
| `n!shuffle` | — | Xáo trộn hàng đợi |
| `n!loop [mode]` | `n!lp` | Lặp: off/track/queue/autoplay |
| `n!remove <số>` | `n!rm` | Xóa bài trong hàng đợi |
| `n!seek <time>` | — | Tua đến vị trí (VD: 1:30) |
| `n!help` | `n!h` | Xem trợ giúp |

---

## 🚀 Hướng dẫn cài đặt

### 1. Tạo Bot trên Discord Developer Portal

1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → Đặt tên **Nora**
3. Tab **Bot** → Click **"Add Bot"**
4. **Bật các Privileged Gateway Intents:**
   - ✅ Message Content Intent
   - ✅ Server Members Intent
   - ✅ Presence Intent
5. Copy **Bot Token** (click "Reset Token" nếu cần)
6. Tab **OAuth2** → **URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Embed Links`, `Read Message History`, `Connect`, `Speak`, `Use Voice Activity`
   - Copy URL và mở trong trình duyệt để mời bot vào server

### 2. Cài đặt trên máy tính

```bash
# Clone project
git clone <your-repo-url>
cd Bot-Discord-Nora

# Cài đặt dependencies
npm install

# Copy file .env
cp .env.example .env
```

### 3. Cấu hình .env

Mở file `.env` và điền token:

```env
DISCORD_TOKEN=your_bot_token_here

# (Tùy chọn) Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### 4. Chạy bot

```bash
npm start
```

---

## ☁️ Deploy lên Render

### Bước 1: Push code lên GitHub

```bash
git init
git add .
git commit -m "Initial commit - Nora Music Bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nora-discord-bot.git
git push -u origin main
```

### Bước 2: Tạo Web Service trên Render

1. Vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Kết nối GitHub repository
4. Cấu hình:
   - **Name:** `nora-discord-bot`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Plan:** `Free`
5. Thêm **Environment Variables:**
   - `DISCORD_TOKEN` = [Bot Token của bạn]
   - `SPOTIFY_CLIENT_ID` = [Nếu có]
   - `SPOTIFY_CLIENT_SECRET` = [Nếu có]
6. Bấm **"Deploy"**

### Bước 3: Setup Uptime Monitor (giữ bot online 24/7)

Render Free sẽ tắt bot sau 15 phút không hoạt động. Để giữ bot sống:

1. Vào [UptimeRobot](https://uptimerobot.com) → Tạo tài khoản miễn phí
2. Click **"Add New Monitor"**
3. Cấu hình:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Nora Bot
   - **URL:** `https://nora-discord-bot.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
4. Bấm **"Create Monitor"**

Giờ bot sẽ được ping mỗi 5 phút và luôn online!

---

## 📁 Cấu trúc project

```
Bot Discord Nora/
├── src/
│   ├── index.js           # Entry point
│   ├── config.js          # Cấu hình bot
│   ├── player.js          # Khởi tạo music player
│   ├── commands/          # Tất cả commands
│   │   ├── play.js
│   │   ├── skip.js
│   │   ├── stop.js
│   │   ├── list.js
│   │   ├── nowplaying.js
│   │   ├── pause.js
│   │   ├── resume.js
│   │   ├── volume.js
│   │   ├── shuffle.js
│   │   ├── loop.js
│   │   ├── remove.js
│   │   ├── seek.js
│   │   └── help.js
│   ├── events/            # Event handlers
│   │   ├── messageCreate.js
│   │   └── playerEvents.js
│   └── utils/             # Utilities
│       ├── embed.js
│       └── formatters.js
├── server.js              # Health check server
├── .env                   # Bot token (KHÔNG commit)
├── .env.example           # Template
├── .gitignore
├── package.json
├── render.yaml
└── README.md
```

---

## 🛠️ Tech Stack

- **discord.js** v14 — Bot framework
- **discord-player** — Music engine
- **@discord-player/extractor** — Spotify, SoundCloud, Apple Music extractors
- **discord-player-youtubei** — YouTube extractor
- **express** — Health check server

---

## 📝 License

MIT License

---

💜 **Made with love by Nora Bot Team**
