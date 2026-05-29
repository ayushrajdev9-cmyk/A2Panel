<img width="20%" src="public/logo.svg" alt="A2Panel logo">

# A2Panel

**A modern, rebranded game server management panel — forked from Pelican Panel.**

A2Panel is a free, open-source game server control panel that gives you a modern web UI for creating and managing game servers, with each server running in an isolated Docker container.

## Why A2Panel?

- Docker-isolated game servers (Minecraft, SteamCMD, and more)
- Modern, polished UI with premium dark mode
- Free and open-source
- Built for personal servers, communities, and hosting providers

## One-Line Install (Ubuntu/Debian)

Run on a fresh VPS as root:

```bash
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | \
  sudo DOMAIN=panel.yourdomain.com bash
```

The script installs everything: PHP 8.3, Composer, Node.js, MariaDB, Redis, Nginx, Docker, the panel itself, SSL via Certbot, and creates your admin user. Credentials are shown at the end.

### Manual Setup

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

## Credits

A2Panel is a fork of [Pelican Panel](https://github.com/pelican-dev/panel). All original credit goes to the Pelican team and contributors.
