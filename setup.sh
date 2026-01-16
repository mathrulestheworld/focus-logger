#!/bin/bash

# 1. Create Project Directory
echo "📂 Creating project directory..."
mkdir -p work-tracker
cd work-tracker

# 2. Create package.json
echo "📄 Creating package.json..."
cat > package.json <<EOF
{
  "name": "work-tracker",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "date-fns": "^3.3.1",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^8.57.0",
    "eslint-plugin-react": "^7.34.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
EOF

# 3. Create vite.config.js
echo "⚙️ Creating vite.config.js..."
cat > vite.config.js <<EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
EOF

# 4. Create PostCSS Config
echo "🎨 Creating postcss.config.js..."
cat > postcss.config.js <<EOF
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# 5. Create Tailwind Config
echo "🎨 Creating tailwind.config.js..."
cat > tailwind.config.js <<EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# 6. Create index.html
echo "🌐 Creating index.html..."
cat > index.html <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Focus Logger</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# 7. Create Source Directory
mkdir -p src

# 8. Create src/index.css
echo "🎨 Creating src/index.css..."
cat > src/index.css <<EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
EOF

# 9. Create src/main.jsx
echo "🚀 Creating src/main.jsx..."
cat > src/main.jsx <<EOF
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# 10. Create src/App.jsx (The UI Shell)
echo "💻 Creating src/App.jsx..."
cat > src/App.jsx <<EOF
import React, { useState } from 'react';
import { LayoutDashboard, Timer, History, Settings } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('tracker');

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">Focus Logger</h1>
          <p className="text-slate-400 text-sm">Track your progress daily</p>
        </div>

        {/* Content Area */}
        <div className="p-6 min-h-[400px]">
          {activeTab === 'tracker' && (
            <div className="text-center text-gray-500 mt-20">
              <Timer className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Timer UI will go here</p>
            </div>
          )}
          
          {activeTab === 'history' && (
             <div className="text-center text-gray-500 mt-20">
             <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
             <p>History & Charts will go here</p>
           </div>
          )}
          
          {activeTab === 'settings' && (
             <div className="text-center text-gray-500 mt-20">
             <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
             <p>Settings will go here</p>
           </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bg-gray-50 p-4 flex justify-around border-t border-gray-100">
          <NavButton 
            icon={<LayoutDashboard size={20} />} 
            label="Tracker" 
            isActive={activeTab === 'tracker'} 
            onClick={() => setActiveTab('tracker')}
          />
          <NavButton 
            icon={<History size={20} />} 
            label="History" 
            isActive={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          />
           <NavButton 
            icon={<Settings size={20} />} 
            label="Settings" 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          />
        </div>
      </div>
    </div>
  );
};

// Helper Component for Navigation
const NavButton = ({ icon, label, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={\`flex flex-col items-center gap-1 text-xs font-medium transition-colors \${
      isActive ? 'text-slate-900' : 'text-gray-400 hover:text-gray-600'
    }\`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;
EOF

echo ""
echo "✅ Project generated successfully!"
echo "👉 To start the app, run these commands:"
echo "   cd work-tracker"
echo "   npm install"
echo "   npm run dev"