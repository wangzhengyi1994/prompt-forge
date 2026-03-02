#!/bin/bash
# XHS Collector - auto start script
# Starts Chrome + collector server + cloudflare tunnel
# Tunnel URL auto-updates in the frontend

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TUNNEL_URL_FILE="$SCRIPT_DIR/.tunnel-url"
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo "[$(date)] Starting XHS Collector..." >> "$LOG_DIR/start.log"

# 1. Start Chrome if not running
if ! curl -s http://127.0.0.1:18800/json/version &>/dev/null; then
  echo "[$(date)] Starting Chrome..." >> "$LOG_DIR/start.log"
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --remote-debugging-port=18800 \
    --user-data-dir=/Users/dang/.openclaw/browser/openclaw/user-data \
    --no-first-run --no-default-browser-check --disable-sync \
    --disable-features=Translate,MediaRouter \
    "https://www.xiaohongshu.com/explore" &>/dev/null &
  sleep 5
fi

# 2. Start collector server if not running
if ! curl -s http://localhost:3721/api/collect -X POST -H "Content-Type: application/json" -d '{"text":"ping"}' &>/dev/null; then
  echo "[$(date)] Starting collector server..." >> "$LOG_DIR/start.log"
  cd "$SCRIPT_DIR"
  node index.js >> "$LOG_DIR/server.log" 2>&1 &
  sleep 2
fi

# 3. Start cloudflare tunnel
echo "[$(date)] Starting tunnel..." >> "$LOG_DIR/start.log"
pkill -f "cloudflared tunnel --url http://localhost:3721" 2>/dev/null
sleep 1

cloudflared tunnel --url http://localhost:3721 --no-tls-verify 2>&1 | while read line; do
  echo "$line" >> "$LOG_DIR/tunnel.log"
  # Extract tunnel URL
  URL=$(echo "$line" | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com')
  if [ -n "$URL" ]; then
    echo "$URL" > "$TUNNEL_URL_FILE"
    echo "[$(date)] Tunnel URL: $URL" >> "$LOG_DIR/start.log"
    
    # Auto-update frontend
    cd "$PROJECT_DIR"
    sed -i '' "s|https://[a-z0-9-]*\.trycloudflare\.com|$URL|g" src/pages/Collect.jsx
    npm run build >> "$LOG_DIR/build.log" 2>&1
    npx gh-pages -d dist >> "$LOG_DIR/deploy.log" 2>&1
    echo "[$(date)] Frontend updated with new tunnel URL" >> "$LOG_DIR/start.log"
  fi
done
