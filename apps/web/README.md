# ZYNEFINANCE - Dashboard

Web dashboard untuk personal finance manager dengan AI chat dan business analytics.

## Quick Start (One Command)

```bash
curl -sSL https://raw.githubusercontent.com/guzzuga/DashFinanaceAi/main/setup.sh | bash
```

## Manual Setup

### 1. Clone & Install
```bash
git clone https://github.com/guzzuga/DashFinanaceAi.git anything-finance
cd anything-finance/apps/web
npm install
```

### 2. Configure
```bash
cp .env.example .env  # or create .env manually
nano .env
```

Required environment variables:
```
DATABASE_URL=sqlite:///path/to/ai-finance-manager/backend/data/finance.db
MIMO_API_KEY=your_bluesminds_api_key
MIMO_BASE_URL=https://api.bluesminds.com/v1
MIMO_MODEL=glm-4.6
HOST=0.0.0.0
PORT=4000
```

### 3. Run
```bash
npm run dev
```

Access: `http://localhost:4000`

**Default Login:**
- Username: `agus`
- Password: `agus2026`

## Systemd Service (Production)

After running `setup.sh`, service is auto-created:
```bash
sudo systemctl start zynefinance-dashboard
sudo systemctl enable zynefinance-dashboard
```

## Features

- 📊 **Dashboard** — Real-time financial overview
- 📈 **Business Charts** — Profit margin, burn rate, cash runway, health score
- 💬 **AI Chat** — Ask questions about your finances (BluesMinds AI)
- 📱 **Mobile Responsive** — Works on all devices
- 🔐 **Auth** — Secure login system
- 📤 **Export** — CSV and Excel export
- 📅 **Reports** — Daily, monthly, category breakdowns

## Tech Stack
- React Router v7
- Tailwind CSS v4
- Recharts
- Vite
- BluesMinds AI (glm-4.6)
