#!/usr/bin/env bash
# Launch Drone Flight Test Reporter as an Electron window only.
# Do not start a local web server or open a browser tab.
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
ELECTRON="$APP_ROOT/node_modules/.bin/electron"
LOG_FILE="${XDG_RUNTIME_DIR:-/tmp}/drone-flight-test-reporter.log"

fail() {
  local msg="$1"
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --width=420 --title="Drone Flight Test Reporter" --text="$msg" || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "Drone Flight Test Reporter" "$msg" || true
  fi
  echo "$msg" >&2
  exit 1
}

if [[ ! -f "$ELECTRON" ]]; then
  fail "Electron is not installed.\n\nFrom the project folder, run:\nnpm install"
fi

cd "$APP_ROOT"
: >"$LOG_FILE"

# Linux Chromium sandbox often fails for local launches; the window still
# uses contextIsolation and no Node.js integration in the renderer.
exec "$ELECTRON" --no-sandbox "$APP_ROOT" >>"$LOG_FILE" 2>&1
