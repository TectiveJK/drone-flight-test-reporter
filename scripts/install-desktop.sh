#!/usr/bin/env bash
# Install a desktop shortcut that launches the Electron app only.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_ID="drone-flight-test-reporter"
APP_NAME="Drone Flight Test Reporter"
LAUNCHER="$SCRIPT_DIR/launch-desktop.sh"
BIN_DIR="${HOME}/.local/bin"
DESKTOP_DIR="${HOME}/.local/share/applications"
DESKTOP_FILE="${DESKTOP_DIR}/${APP_ID}.desktop"
ICON_PATH="$APP_ROOT/icons/icon-512.png"

resolve_desktop_dir() {
  local dir=""
  if command -v xdg-user-dir >/dev/null 2>&1; then
    dir="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
  fi
  if [[ -n "$dir" && -d "$dir" ]]; then
    echo "$dir"
    return
  fi
  for candidate in "${HOME}/Desktop" "${HOME}/Bureaublad"; do
    if [[ -d "$candidate" ]]; then
      echo "$candidate"
      return
    fi
  done
  mkdir -p "${HOME}/Desktop"
  echo "${HOME}/Desktop"
}

chmod +x "$LAUNCHER"

if [[ ! -f "$APP_ROOT/node_modules/.bin/electron" ]]; then
  (cd "$APP_ROOT" && npm install)
fi

mkdir -p "$BIN_DIR" "$DESKTOP_DIR"

cat > "${BIN_DIR}/${APP_ID}" <<EOF
#!/usr/bin/env bash
exec "$LAUNCHER" "\$@"
EOF
chmod +x "${BIN_DIR}/${APP_ID}"

if [[ ! -f "$ICON_PATH" ]]; then
  ICON_PATH="application-x-executable"
fi

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=${APP_NAME}
Comment=Professional multi-flight drone test reporting
Exec="${LAUNCHER}"
Icon=${ICON_PATH}
Terminal=false
Categories=Utility;Office;Development;
Keywords=drone;flight;test;report;
StartupNotify=true
StartupWMClass=drone-flight-test-reporter
EOF
chmod +x "$DESKTOP_FILE"

USER_DESKTOP_DIR="$(resolve_desktop_dir)"
USER_DESKTOP="${USER_DESKTOP_DIR}/${APP_NAME}.desktop"
cp "$DESKTOP_FILE" "$USER_DESKTOP"
chmod +x "$USER_DESKTOP"

# Replace the old web-launcher copy so leftover shortcuts cannot open a browser.
OLD_LAUNCHER="${HOME}/.local/share/${APP_ID}/scripts/launch-desktop.sh"
if [[ -f "$OLD_LAUNCHER" ]]; then
  cat > "$OLD_LAUNCHER" <<EOF
#!/usr/bin/env bash
exec "$LAUNCHER" "\$@"
EOF
  chmod +x "$OLD_LAUNCHER"
fi

if command -v gio >/dev/null 2>&1; then
  gio set "$USER_DESKTOP" metadata::trusted true 2>/dev/null || true
  gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi

echo "Desktop shortcut updated to launch the Electron app only."
echo "  ${USER_DESKTOP}"
echo "  ${DESKTOP_FILE}"
