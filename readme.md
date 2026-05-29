<div align="center">

  <img src="public/logo.svg" alt="A2Panel" width="260"/>

  # 🚀 A2Panel

  **The next-gen game server management panel.**
  
  [![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blueviolet.svg)](https://www.gnu.org/licenses/agpl-3.0)
  [![Stars](https://img.shields.io/github/stars/ayushrajdev9-cmyk/A2Panel?style=flat&logo=github)](https://github.com/ayushrajdev9-cmyk/A2Panel/stargazers)
  [![Forks](https://img.shields.io/github/forks/ayushrajdev9-cmyk/A2Panel?style=flat&logo=github)](https://github.com/ayushrajdev9-cmyk/A2Panel/forks)
  [![Open Issues](https://img.shields.io/github/issues/ayushrajdev9-cmyk/A2Panel)](https://github.com/ayushrajdev9-cmyk/A2Panel/issues)
  [![Downloads](https://img.shields.io/github/downloads/ayushrajdev9-cmyk/A2Panel/total?color=success)](https://github.com/ayushrajdev9-cmyk/A2Panel/releases)
  [![Made with Laravel](https://img.shields.io/badge/Made%20with-Laravel-red?logo=laravel)](https://laravel.com)

  <p align="center">
    <a href="#-one-line-install">Install</a> •
    <a href="#-features">Features</a> •
    <a href="#-screenshots">Screenshots</a> •
    <a href="#-why-a2panel">Why A2Panel?</a> •
    <a href="#-support">Support</a>
  </p>

  <hr>

</div>

## ⚡ One-Line Install

### 🐧 Linux (Ubuntu/Debian)
```bash
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | \
  sudo DOMAIN=panel.yourdomain.com bash
```

### 🍎 macOS
```bash
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | \
  DOMAIN=panel.yourdomain.com bash
```

---

## ✨ Features

| | |
|---|---|
| 🎮 **Multi-Game Support** | Minecraft, SteamCMD, Discord bots, databases, voice servers & more |
| 🐳 **Docker Isolation** | Each server in its own container — secure & clean |
| 🌙 **Premium Dark Mode** | Glassmorphism UI with smooth animations |
| ⚡ **One-Click Install** | Single command setup on any Linux/macOS server |
| 🔒 **Cloudflare Ready** | Built-in proxy support for SSL & DDoS protection |
| 🎨 **Fully Customizable** | Rebrandable logo, colors, and footer |
| 📦 **Auto Backups** | Scheduled & manual server backups |
| 👥 **Multi-User** | Admin, sub-user, and API key management |

## 📸 Screenshots

<div align="center">
  <i>Coming soon — submit your A2Panel setup screenshot!</i>
</div>

## 🎯 Why A2Panel?

- **Modern UI** — Ditch ugly old panels. A2Panel looks premium out of the box.
- **Zero Bloat** — Clean Laravel codebase, easy to extend.
- **Single Command Deploy** — Up and running in 60 seconds.
- **Active Development** — Fresh fork with ongoing improvements.
- **100% Free** — Open source under AGPLv3. No paywalls, no limits.

## 🚀 Quick Start (Manual)

```bash
git clone https://github.com/ayushrajdev9-cmyk/A2Panel.git /var/www/a2panel
cd /var/www/a2panel
cp .env.example .env
# Edit .env: DB credentials, APP_URL
composer install --no-dev
npm install && npm run build
php artisan key:generate
php artisan migrate --force --seed
```

## 🌐 Social

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-A2Panel-181717?style=for-the-badge&logo=github)](https://github.com/ayushrajdev9-cmyk/A2Panel)
[![Discord](https://img.shields.io/badge/Discord-Join_Us-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/your-invite)

**⭐ Star the repo — it helps a lot!**

</div>

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0** — see the [LICENSE](license) file for details.
