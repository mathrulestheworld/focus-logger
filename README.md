# Focus Logger 🎯

A privacy-focused, offline productivity tracker built with React,
Tailwind, and Electron.

## Features

- **⏱️ Smart Timer:** Custom goals, auto-stop, and distinct audio alarms
  (Retro, Digital, Chime, Success).
- **🏷️ Tag System:** Color-coded tags for tracking different types of
  work (Deep Work, Meetings, etc.).
- **📊 Analytics:** Interactive visualizations (Histograms & Pie Charts)
  with filtering (Today, 7 Days, 30 Days, Custom Range).
- **📑 Reports:** Generate productivity summaries with daily averages
  and tag breakdowns.
- **🔒 Private:** All data is stored locally on your device
  (localStorage / JSON). No cloud, no tracking.
- **🖥️ Cross-Platform:** Runs as a Web App or a Native Desktop App
  (Mac).

---

## 🚀 Quick Start

We have included a script to handle everything for you.

1. **Clone the repo**
   git clone https://github.com/mathrulestheworld/focus-logger.git
   cd focus-logger

2. **Run the Magic Script**
   ./easy-start.sh

3. **Choose your mode from the menu:**
   - **Option 1:** 🌐 Run Web App (Good for quick development/testing).
   - **Option 2:** 🖥️ Test Desktop App (Runs inside an Electron window).
   - **Option 3:** 📦 Build Mac App (Generates a .dmg installer file).

---

## 🛠️ Manual Commands

If you prefer using standard npm commands without the script:

- `npm install`          : Install dependencies
- `npm run dev`          : Start web server (Browser mode)
- `npm run electron:dev` : Run desktop version (Electron)
- `npm run dist`         : Build the final executable (.dmg / .exe)

---

## 📂 Project Structure

- **src/App.jsx**: Main application logic (State, Audio Engine).
- **src/components/Tracker.jsx**: Timer UI, Goal input, Tag selection.
- **src/components/History.jsx**: Analytics, Charts, Reports, Logs.
- **src/components/Settings.jsx**: Config for defaults, sounds, colors.
- **src/utils/storage.js**: LocalStorage persistence logic.
- **electron.js**: Main process file for the Desktop App wrapper.

## 💾 Data Location

Your work logs are stored locally on your machine.

- **Mac:** ~/Library/Application Support/Focus Logger/
