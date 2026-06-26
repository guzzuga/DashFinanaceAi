#!/bin/bash
# ============================================
# ZYNEFINANCE - Dashboard Setup Script
# ============================================
# Usage: bash setup.sh
# Requirements: Node.js 18+, npm, git

set -e

echo "=========================================="
echo "  ZYNEFINANCE - Dashboard Setup"
echo "=========================================="

# 1. Clone repo (skip if already exists)
if [ ! -d "$HOME/anything-finance" ]; then
    echo "[1/5] Cloning repository..."
    cd ~
    git clone https://github.com/guzzuga/DashFinanaceAi.git anything-finance
    cd anything-finance
    # Create apps/web structure if needed
    if [ ! -d "apps/web" ]; then
        echo "Note: files are at root level, adjusting..."
    fi
else
    echo "[1/5] Repository already exists, pulling latest..."
    cd ~/anything-finance
    git pull
fi

# Detect project structure
if [ -f "$HOME/anything-finance/apps/web/package.json" ]; then
    WEB_DIR="$HOME/anything-finance/apps/web"
elif [ -f "$HOME/anything-finance/package.json" ]; then
    WEB_DIR="$HOME/anything-finance"
else
    echo "Error: Cannot find package.json"
    exit 1
fi

cd "$WEB_DIR"

# 2. Install Node.js dependencies
echo "[2/5] Installing Node.js dependencies..."
npm install

# 3. Create .env file if not exists
if [ ! -f ".env" ]; then
    echo "[3/5] Creating .env file..."
    cat > .env << 'ENVEOF'
# ============================================
# ZYNEFINANCE Dashboard Configuration
# ============================================

# --- Backend API ---
DATABASE_URL=sqlite://$(HOME)/ai-finance-manager/backend/data/finance.db

# --- AI Chat (BluesMinds) ---
MIMO_API_KEY=YOUR_API_KEY_HERE
MIMO_BASE_URL=https://api.bluesminds.com/v1
MIMO_MODEL=glm-4.6

# --- Server ---
HOST=0.0.0.0
PORT=4000
ENVEOF
    echo "⚠️  Edit $WEB_DIR/.env with your credentials!"
else
    echo "[3/5] .env already exists, skipping..."
fi

# 4. Build (optional for dev)
echo "[4/5] Checking build..."
npm run build 2>/dev/null && echo "Build successful!" || echo "Build skipped (run in dev mode)"

# 5. Create systemd service
echo "[5/5] Creating systemd service..."

sudo tee /etc/systemd/system/zynefinance-dashboard.service > /dev/null << SVCEOF
[Unit]
Description=ZYNEFINANCE Dashboard
After=network.target zynefinance-api.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$WEB_DIR
ExecStart=$(which npm) run dev
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0
Environment=PORT=4000

[Install]
WantedBy=multi-user.target
SVCEOF

sudo systemctl daemon-reload

echo ""
echo "=========================================="
echo "  Dashboard Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Edit .env:  nano $WEB_DIR/.env"
echo "  2. Start:      sudo systemctl start zynefinance-dashboard"
echo "  3. Enable:     sudo systemctl enable zynefinance-dashboard"
echo ""
echo "Access dashboard: http://YOUR_IP:4000"
echo "Login: agus / agus2026"
echo ""
