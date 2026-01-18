#!/bin/bash

echo "========================================"
echo "   🚀 FOCUS LOGGER - Quick Start"
echo "========================================"

# 1. Check for Node Modules (Install if missing)
if [ ! -d "node_modules" ]; then
  echo "📦 First time setup: Installing dependencies..."
  npm install
  echo "✅ Dependencies installed!"
  echo ""
fi

# 2. Show Menu
echo "What would you like to do?"
echo "   1) 🌐 Run Web App (Browser Mode)"
echo "   2) 🖥️  Test Desktop App (Electron Dev Mode)"
echo "   3) 📦 Build Mac App (.dmg Installer)"
echo ""
read -p "Enter number (1-3): " option

echo ""

# 3. Execute Selection
case $option in
  1)
    echo "🌐 Starting Web App..."
    echo "👉 Open http://localhost:5173 in your browser."
    npm run dev
    ;;
  2)
    echo "🖥️  Launching Desktop App..."
    npm run electron:dev
    ;;
  3)
    echo "📦 Building Mac Application..."
    echo "☕ This may take a minute..."
    npm run dist
    echo ""
    echo "🎉 Build Complete!"
    echo "📂 You can find your app in the 'dist-electron' folder."
    open dist-electron
    ;;
  *)
    echo "❌ Invalid option. Exiting."
    ;;
esac