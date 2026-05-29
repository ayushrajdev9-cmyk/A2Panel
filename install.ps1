# ──────────────────────────────────────────────
# A2Panel — Windows Installer (PowerShell)
# Requires: WSL2 with Ubuntu, Docker Desktop
# ──────────────────────────────────────────────

Write-Host "A2Panel Windows Installer" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "A2Panel runs inside WSL2 (Ubuntu). This script:" -ForegroundColor Yellow
Write-Host "  1. Installs WSL2 + Ubuntu (if not present)"
Write-Host "  2. Installs Docker Desktop (if not present)"
Write-Host "  3. Runs the A2Panel install script inside WSL"
Write-Host ""

# ── 1. Check WSL ──
$wslInstalled = Get-Command wsl -ErrorAction SilentlyContinue
if (-not $wslInstalled) {
    Write-Host "[1/4] Installing WSL2 and Ubuntu…" -ForegroundColor Cyan
    wsl --install -d Ubuntu
    Write-Host "    Restart your computer after WSL installation finishes, then re-run this script." -ForegroundColor Red
    exit
}

# ── 2. Check Docker ──
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "[2/4] Docker Desktop not found." -ForegroundColor Yellow
    Write-Host "    Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "    Install it, enable WSL2 integration, then re-run this script." -ForegroundColor Yellow
    exit
}

# ── 3. Get config from user ──
$domain = Read-Host "[3/4] Enter your panel domain (e.g. panel.example.com)"
if (-not $domain) { $domain = "panel.example.com" }

$email = Read-Host "Enter admin email"
if (-not $email) { $email = "admin@example.com" }

$user = Read-Host "Enter admin username"
if (-not $user) { $user = "admin" }

Write-Host ""
Write-Host "[4/4] Running A2Panel installer inside WSL…" -ForegroundColor Cyan
Write-Host ""

# ── 4. Run install in WSL ──
wsl -d Ubuntu -- bash -c @"
export DOMAIN="$domain"
export ADMIN_EMAIL="$email"
export ADMIN_USER="$user"
curl -sSL https://github.com/ayushrajdev9-cmyk/A2Panel/raw/main/install.sh | sudo bash
"@

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "Check the output above for your credentials." -ForegroundColor Yellow
