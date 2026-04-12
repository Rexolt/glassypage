#!/bin/bash

# Kilépés hiba esetén
set -e

# Változók definiálása
INSTALL_DIR="$HOME/.local/share/my-startpage"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"
SERVICE_NAME="startpage.service"

echo "🚀 Startpage telepítésének megkezdése..."

# 1. Node.js ellenőrzése
if ! command -v npm &> /dev/null; then
    echo "❌ Hiba: Az npm (Node.js) nincs telepítve. Futtasd: sudo pacman -S nodejs npm"
    exit 1
fi

# 2. Fájlok másolása a telepítési könyvtárba
echo "📦 Fájlok másolása a $INSTALL_DIR mappába..."
mkdir -p "$INSTALL_DIR"
# Feltételezzük, hogy a szkript a projekt mappájából fut
cp -r ./* "$INSTALL_DIR/"

# 3. Függőségek telepítése
echo "⚙️ NPM csomagok telepítése..."
cd "$INSTALL_DIR"
npm install --production

# 4. Systemd User Service létrehozása
echo "🛠️ Systemd service fájl generálása..."
mkdir -p "$SYSTEMD_USER_DIR"

cat <<EOF > "$SYSTEMD_USER_DIR/$SERVICE_NAME"
[Unit]
Description=Local Browser Startpage
After=network.target

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

# 5. Service engedélyezése és elindítása
echo "🔌 Systemd folyamatok frissítése és a szerver indítása..."
systemctl --user daemon-reload
systemctl --user enable --now "$SERVICE_NAME"

echo "✅ Szuper! A startpage telepítve és fut a háttérben."
echo "🌐 Állítsd be a böngésződben a kezdőlapot erre: http://localhost:3000"
