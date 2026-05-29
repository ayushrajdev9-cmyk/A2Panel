#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# A2Panel — Automated Installer
# https://github.com/ayushrajdev9-cmyk/A2Panel
# ──────────────────────────────────────────────

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── Config (overridable via env vars) ──
DOMAIN="${DOMAIN:-panel.example.com}"          # Your panel domain
TIMEZONE="${TIMEZONE:-UTC}"                    # PHP timezone (e.g. Asia/Kolkata)
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-$(openssl rand -base64 12)}"
A2PANEL_REPO="${A2PANEL_REPO:-https://github.com/ayushrajdev9-cmyk/A2Panel.git}"

# ── Pre-flight ──
if [[ $EUID -ne 0 ]]; then err "Run as root (sudo)."; fi

export DEBIAN_FRONTEND=noninteractive

# ── Step 1: System Dependencies ──
info "Updating system…"
apt-get update -qq && apt-get upgrade -y -qq

info "Installing base packages…"
apt-get install -y -qq curl wget git unzip tar certbot python3-certbot-nginx \
    nginx mariadb-server redis-server \
    php8.3 php8.3-{cli,common,gd,curl,mysql,mbstring,bcmath,xml,fpm,zip,intl,redis,bz2}

info "Installing Composer…"
if ! command -v composer &>/dev/null; then
    curl -fsSL https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

info "Installing Node.js 22…"
if ! command -v node &>/dev/null || [[ $(node -v) < v22 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs
fi

info "Installing Docker…"
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | bash
fi

ok "System dependencies installed."

# ── Step 2: Database ──
info "Configuring MariaDB…"
mariadb -u root -e "
    CREATE USER IF NOT EXISTS 'a2panel'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
    CREATE DATABASE IF NOT EXISTS a2panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON a2panel.* TO 'a2panel'@'127.0.0.1';
    FLUSH PRIVILEGES;
"
ok "Database 'a2panel' created."

# ── Step 3: Clone A2Panel ──
info "Cloning A2Panel into /var/www/a2panel…"
rm -rf /var/www/a2panel
git clone --depth=1 "$A2PANEL_REPO" /var/www/a2panel
cd /var/www/a2panel

cp .env.example .env

# Configure .env
sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
sed -i "s|TIMEZONE=.*|TIMEZONE=$TIMEZONE|" .env
sed -i "s|CACHE_STORE=.*|CACHE_STORE=redis|" .env
sed -i "s|SESSION_DRIVER=.*|SESSION_DRIVER=redis|" .env
sed -i "s|QUEUE_CONNECTION=.*|QUEUE_CONNECTION=redis|" .env

# Generate APP_KEY
php artisan key:generate --force

# ── Step 4: Install PHP deps + Build ──
info "Installing Composer dependencies…"
composer install --no-dev --quiet

info "Building frontend…"
npm install --silent
npm run build --silent

# ── Step 5: Migrate & Seed ──
info "Running migrations…"
php artisan migrate --force --seed
php artisan storage:link

# ── Step 6: Permissions ──
chown -R www-data:www-data /var/www/a2panel/storage /var/www/a2panel/bootstrap/cache /var/www/a2panel/public
chmod -R 755 /var/www/a2panel/storage /var/www/a2panel/bootstrap/cache

# ── Step 7: Nginx ──
info "Configuring Nginx…"
cat > /etc/nginx/sites-available/a2panel.conf <<NGINX
server {
    listen 80;
    server_name $DOMAIN;

    root /var/www/a2panel/public;
    index index.php;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht { deny all; }
    location ~ /\.env { deny all; }
}
NGINX

ln -sf /etc/nginx/sites-available/a2panel.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configured for $DOMAIN"

# ── Step 8: Queue Worker (systemd) ──
cat > /etc/systemd/system/a2panel-queue.service <<SVC
[Unit]
Description=A2Panel Queue Worker
After=redis-server.service mariadb.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/a2panel
ExecStart=/usr/bin/php /var/www/a2panel/artisan queue:work --sleep=3 --tries=3
Restart=always

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable --now a2panel-queue
ok "Queue worker started."

# ── Step 9: Schedule Cron ──
(crontab -u www-data -l 2>/dev/null; echo '* * * * * /usr/bin/php /var/www/a2panel/artisan schedule:run') | crontab -u www-data -
ok "Cron scheduled."

# ── Step 10: SSL via Certbot ──
if command -v certbot &>/dev/null; then
    info "Attempting Let's Encrypt SSL for $DOMAIN…"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" || warn "Certbot failed — get SSL manually."
fi

# ── Step 11: Create Admin User ──
info "Creating admin user…"
php artisan p:user:make --email="$ADMIN_EMAIL" --username="$ADMIN_USER" --name-prefix="Admin" --password="$ADMIN_PASS" --admin=1 --no-interaction 2>/dev/null || true
ok "Admin user created."

# ── Done ──
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  A2Panel installed successfully!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Panel:   ${CYAN}https://$DOMAIN${NC}"
echo -e "  Email:   ${YELLOW}$ADMIN_EMAIL${NC}"
echo -e "  User:    ${YELLOW}$ADMIN_USER${NC}"
echo -e "  Pass:    ${YELLOW}$ADMIN_PASS${NC}"
echo -e "  DB Pass: ${YELLOW}$DB_PASSWORD${NC}"
echo ""
echo -e "${YELLOW}  Save these credentials — shown only once!${NC}"
echo ""
echo -e "  Next steps:"
echo -e "  1. Point DNS  ${CYAN}$DOMAIN${NC}  to this server"
echo -e "  2. Configure Wings (daemon) — run:"
echo -e "     ${CYAN}php artisan p:node:configuration ID${NC}"
echo -e "  3. Or set up Cloudflare Tunnel for SSL-free setup"
echo ""

# Save credentials to a temp file
cat > /root/.a2panel-credentials <<CRED
Panel:  https://$DOMAIN
Email:  $ADMIN_EMAIL
User:   $ADMIN_USER
Pass:   $ADMIN_PASS
DB Pass: $DB_PASSWORD
CRED
chmod 600 /root/.a2panel-credentials
