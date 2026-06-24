#!/usr/bin/env bash
#
# Glassypage — natív telepítő (disztró-független)
# Támogatott: Arch, Debian/Ubuntu, Fedora/RHEL, openSUSE
# Docker-es telepítéshez lásd: docker compose up -d  (vagy: make up)
#
set -euo pipefail

INSTALL_DIR="$HOME/.local/share/glassypage"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_NAME="glassypage.service"
PORT="${PORT:-3000}"

# A szkript a saját mappájából fut – innen másolunk
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Glassypage telepítésének megkezdése..."

# --- Csomagkezelő felismerése ---
detect_pm() {
  if   command -v apt-get  &>/dev/null; then echo "apt"
  elif command -v pacman   &>/dev/null; then echo "pacman"
  elif command -v dnf      &>/dev/null; then echo "dnf"
  elif command -v zypper   &>/dev/null; then echo "zypper"
  else echo "unknown"; fi
}
PM="$(detect_pm)"

install_node_hint() {
  case "$PM" in
    apt)    echo "sudo apt-get update && sudo apt-get install -y nodejs npm" ;;
    pacman) echo "sudo pacman -S --needed nodejs npm" ;;
    dnf)    echo "sudo dnf install -y nodejs npm" ;;
    zypper) echo "sudo zypper install -y nodejs npm" ;;
    *)      echo "telepítsd a Node.js-t (v18+) és az npm-et a disztród csomagkezelőjével" ;;
  esac
}

# --- 1. Node.js / npm ellenőrzése (és opcionális automatikus telepítés) ---
if ! command -v npm &>/dev/null || ! command -v node &>/dev/null; then
  echo "⚠️  A Node.js/npm nincs telepítve."
  HINT="$(install_node_hint)"
  if [ "$PM" != "unknown" ]; then
    read -r -p "❓ Megpróbáljam most telepíteni? ($HINT) [i/N] " yn
    case "$yn" in
      [iIyY]*)
        echo "📥 Node.js telepítése..."
        eval "$HINT"
        ;;
      *)
        echo "❌ Telepítsd kézzel, majd futtasd újra:  $HINT"
        exit 1
        ;;
    esac
  else
    echo "❌ Ismeretlen csomagkezelő. $HINT"
    exit 1
  fi
fi

# Node verzió ellenőrzés (>=18 a globális fetch() miatt)
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "⚠️  Figyelem: Node.js $NODE_MAJOR észlelve. A v18+ ajánlott a teljes funkcionalitáshoz."
fi

# --- 2. Fájlok másolása ---
echo "📦 Fájlok másolása ide: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
# node_modules és .git nélkül; a config.json-t nem írjuk felül, ha már létezik
RSYNC_EXCLUDES=(--exclude node_modules --exclude .git)
if [ -f "$INSTALL_DIR/config.json" ]; then
  RSYNC_EXCLUDES+=(--exclude config.json --exclude scratchpad.txt)
  echo "ℹ️  Meglévő config.json megőrizve."
fi
if command -v rsync &>/dev/null; then
  rsync -a "${RSYNC_EXCLUDES[@]}" "$SRC_DIR/" "$INSTALL_DIR/"
else
  cp -r "$SRC_DIR/." "$INSTALL_DIR/"
fi

# --- 3. Függőségek telepítése ---
echo "⚙️  NPM csomagok telepítése..."
cd "$INSTALL_DIR"
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi

# --- 4. (Opcionális) rendszer-integrációs csomagok ---
echo "🧩 Ajánlott (opcionális) csomagok a teljes funkcionalitáshoz:"
echo "   • playerctl  – média vezérlés (MPRIS)"
echo "   • lsb_release – disztró infó"
case "$PM" in
  apt)    echo "   Telepítés: sudo apt-get install -y playerctl lsb-release" ;;
  pacman) echo "   Telepítés: sudo pacman -S --needed playerctl lsb-release" ;;
  dnf)    echo "   Telepítés: sudo dnf install -y playerctl" ;;
esac

# --- 5. systemd user service ---
echo "🛠️  systemd user service létrehozása..."
mkdir -p "$SYSTEMD_USER_DIR"
NODE_BIN="$(command -v node)"
cat > "$SYSTEMD_USER_DIR/$SERVICE_NAME" <<EOF
[Unit]
Description=Glassypage — local browser startpage
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
Environment=PORT=$PORT
Environment=NODE_ENV=production
ExecStart=$NODE_BIN $INSTALL_DIR/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

# --- 6. Service indítása ---
echo "🔌 systemd frissítése és a szerver indítása..."
systemctl --user daemon-reload
systemctl --user enable --now "$SERVICE_NAME"

# Maradjon futva kijelentkezés után is (szerver/headless használathoz)
if command -v loginctl &>/dev/null; then
  loginctl enable-linger "$USER" 2>/dev/null || true
fi

echo ""
echo "✅ Kész! A Glassypage telepítve és fut a háttérben."
echo "🌐 Kezdőlap: http://localhost:$PORT"
echo "ℹ️  Állapot:  systemctl --user status $SERVICE_NAME"
echo "ℹ️  Leállítás: systemctl --user stop $SERVICE_NAME"
