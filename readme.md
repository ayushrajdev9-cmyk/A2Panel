<img width="20%" src="public/logo.svg" alt="A2Panel logo">

# A2Panel

**A modern game server management panel.**

A2Panel is a free, open-source game server control panel that gives you a modern web UI for creating and managing game servers, with each server running in an isolated Docker container.

## One-Line Install

### Linux (Ubuntu/Debian)
```bash
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | \
  sudo DOMAIN=panel.yourdomain.com bash
```

### macOS
```bash
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | \
  DOMAIN=panel.yourdomain.com bash
```
Requires [Homebrew](https://brew.sh) — installed automatically if missing.

### Windows
```powershell
# Run PowerShell as Administrator
iwr -useb https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.ps1 | iex
```
Requires WSL2 with Ubuntu + Docker Desktop.

## Manual Setup

Prerequisites: PHP 8.3+, Composer, Node.js 22+, Redis, MariaDB/MySQL, Docker, Nginx.

```bash
git clone https://github.com/ayushrajdev9-cmyk/A2Panel.git /var/www/a2panel
cd /var/www/a2panel
cp .env.example .env
# Edit .env with your DB credentials and APP_URL
composer install --no-dev
npm install && npm run build
php artisan key:generate
php artisan migrate --force --seed
```

## Why A2Panel?

- Docker-isolated game servers (Minecraft, SteamCMD, and more)
- Modern, polished UI with premium dark mode
- Free and open-source
- Built for personal servers, communities, and hosting providers
