#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# A2Panel — Cross-Platform Installer
# Supports: Linux (apt), macOS (Homebrew)
# ──────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; exit 1; }

# ── Config ──
DOMAIN="${DOMAIN:-panel.example.com}"
TIMEZONE="${TIMEZONE:-UTC}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-$(openssl rand -base64 12)}"
A2PANEL_REPO="${A2PANEL_REPO:-https://github.com/ayushrajdev9-cmyk/A2Panel.git}"

# ── Detect OS ──
OS="linux"
if [[ "$(uname)" == "Darwin" ]]; then OS="macos"; fi

if [[ $EUID -ne 0 && "$OS" == "linux" ]]; then err "Run as root (sudo)."; fi

export DEBIAN_FRONTEND=noninteractive

# ── Install packages ──
install_pkg_linux() {
    apt-get update -qq && apt-get install -y -qq "$@"
}

install_pkg_macos() {
    if ! command -v brew &>/dev/null; then
        warn "Installing Homebrew…"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install "$@"
}

install_pkg() {
    if [[ "$OS" == "macos" ]]; then install_pkg_macos "$@"; else install_pkg_linux "$@"; fi
}

# ── Step 1: Dependencies ──
info "Installing system dependencies…"

if [[ "$OS" == "linux" ]]; then
    install_pkg_linux curl wget git unzip tar nginx mariadb-server redis-server \
        php8.3 php8.3-{cli,common,gd,curl,mysql,mbstring,bcmath,xml,fpm,zip,intl,redis,bz2}
elif [[ "$OS" == "macos" ]]; then
    install_pkg_macos curl wget git unzip nginx mariadb redis php@8.3
    info "Starting services…"
    brew services start nginx 2>/dev/null || true
    brew services start mariadb 2>/dev/null || true
    brew services start redis 2>/dev/null || true
fi

# ── Composer ──
if ! command -v composer &>/dev/null; then
    info "Installing Composer…"
    curl -fsSL https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# ── Node.js ──
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 22 ]]; then
    if [[ "$OS" == "linux" ]]; then
        info "Installing Node.js 22…"
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
        apt-get install -y -qq nodejs
    else
        info "Installing Node.js…"
        brew install node@22
    fi
fi

# ── Docker ──
if ! command -v docker &>/dev/null; then
    info "Installing Docker…"
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://get.docker.com | bash
    else
        brew install --cask docker
        warn "Open Docker.app and complete setup manually."
    fi
fi

ok "Dependencies installed."

# ── Step 2: Database ──
if [[ "$OS" == "linux" ]]; then
    info "Creating database…"
    mariadb -u root -e "
        CREATE USER IF NOT EXISTS 'a2panel'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
        CREATE DATABASE IF NOT EXISTS a2panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        GRANT ALL PRIVILEGES ON a2panel.* TO 'a2panel'@'127.0.0.1';
        FLUSH PRIVILEGES;
    "
    ok "Database created."
else
    warn "Run these in MariaDB manually:"
    echo "  CREATE USER 'a2panel'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';"
    echo "  CREATE DATABASE a2panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    echo "  GRANT ALL ON a2panel.* TO 'a2panel'@'127.0.0.1';"
fi

# ── Step 3: Clone A2Panel ──
TARGET="/var/www/a2panel"
if [[ "$OS" == "macos" ]]; then TARGET="$HOME/a2panel"; fi

info "Cloning A2Panel into $TARGET…"
rm -rf "$TARGET"
git clone --depth=1 "$A2PANEL_REPO" "$TARGET"
cd "$TARGET"

cp .env.example .env
sed -i '' "s|APP_URL=.*|APP_URL=https://$DOMAIN|" .env 2>/dev/null || \
sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|" .env
sed -i '' "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env 2>/dev/null || \
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
sed -i '' "s|TIMEZONE=.*|TIMEZONE=$TIMEZONE|" .env 2>/dev/null || \
sed -i "s|TIMEZONE=.*|TIMEZONE=$TIMEZONE|" .env
sed -i '' "s|CACHE_STORE=.*|CACHE_STORE=redis|" .env 2>/dev/null || \
sed -i "s|CACHE_STORE=.*|CACHE_STORE=redis|" .env
sed -i '' "s|SESSION_DRIVER=.*|SESSION_DRIVER=redis|" .env 2>/dev/null || \
sed -i "s|SESSION_DRIVER=.*|SESSION_DRIVER=redis|" .env
sed -i '' "s|QUEUE_CONNECTION=.*|QUEUE_CONNECTION=redis|" .env 2>/dev/null || \
sed -i "s|QUEUE_CONNECTION=.*|QUEUE_CONNECTION=redis|" .env

php artisan key:generate --force

# ── Step 4: Install deps + Build ──
info "Installing PHP dependencies…"
composer install --no-dev --quiet

info "Building frontend…"
npm install --silent
npm run build --silent

# ── Step 5: Migrate ──
info "Running migrations…"
php artisan migrate --force --seed
php artisan storage:link

# ── Step 6: Permissions ──
if [[ "$OS" == "linux" ]]; then
    chown -R www-data:www-data "$TARGET/storage" "$TARGET/bootstrap/cache" "$TARGET/public"
    chmod -R 755 "$TARGET/storage" "$TARGET/bootstrap/cache"
fi

# ── Step 7: Nginx (Linux only) ──
if [[ "$OS" == "linux" ]]; then
    info "Configuring Nginx…"
    cat > /etc/nginx/sites-available/a2panel.conf <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    root $TARGET/public;
    index index.php;
    location / { try_files \$uri \$uri/ /index.php?\$query_string; }
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
    ok "Nginx configured."
fi

# ── Step 8: Queue Worker ──
if [[ "$OS" == "linux" ]]; then
    cat > /etc/systemd/system/a2panel-queue.service <<SVC
[Unit]
Description=A2Panel Queue Worker
After=redis-server.service mariadb.service
[Service]
User=www-data
Group=www-data
WorkingDirectory=$TARGET
ExecStart=/usr/bin/php $TARGET/artisan queue:work --sleep=3 --tries=3
Restart=always
[Install]
WantedBy=multi-user.target
SVC
    systemctl daemon-reload
    systemctl enable --now a2panel-queue
    ok "Queue worker started."

    (crontab -u www-data -l 2>/dev/null; echo '* * * * * /usr/bin/php $TARGET/artisan schedule:run') | crontab -u www-data -
    ok "Cron scheduled."
fi

# ── Step 9: SSL ──
if command -v certbot &>/dev/null; then
    info "Attempting SSL for $DOMAIN…"
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" || warn "Certbot failed."
fi

# ── Step 10: Admin User ──
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
echo -e "  Dir:     ${CYAN}$TARGET${NC}"
echo -e "  Email:   ${YELLOW}$ADMIN_EMAIL${NC}"
echo -e "  User:    ${YELLOW}$ADMIN_USER${NC}"
echo -e "  Pass:    ${YELLOW}$ADMIN_PASS${NC}"
echo ""
echo -e "${YELLOW}  Save these credentials!${NC}"
echo ""

cat > /root/.a2panel-credentials 2>/dev/null <<CRED || cat > "$HOME/.a2panel-credentials" <<CRED
Panel:  https://$DOMAIN
Email:  $ADMIN_EMAIL
User:   $ADMIN_USER
Pass:   $ADMIN_PASS
DB Pass: $DB_PASSWORD
CRED
chmod 600 /root/.a2panel-credentials 2>/dev/null || chmod 600 "$HOME/.a2panel-credentials"
