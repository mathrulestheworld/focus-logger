import React, { useState } from 'react';
import { Save, Bell, Clock, Palette, Play } from 'lucide-react';

const PRESET_COLORS = [
  '#0f172a', // Slate 900 (Default)
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#16a34a', // Green
  '#0891b2', // Cyan
  '#2563eb', // Blue
  '#4f46e5', // Indigo
  '#7c3aed', // Violet
  '#db2777'  // Pink
];

const SOUNDS = [
  { id: 'beep', name: 'Standard Beep' },
  { id: 'digital', name: 'Digital Alarm' },
  { id: 'bell', name: 'Soft Bell' },
  { id: 'retro', name: '8-Bit Jump' },
  { id: 'chime', name: 'Magic Chime' },   
  { id: 'success', name: 'Success' },     
];

const Settings = ({ tags, prefs, updatePrefs, onTestSound }) => {
  
  // Local state for color mapping to allow changes before saving
  const [colors, setColors] = useState(prefs.tagColors || {});

  const handleColorChange = (tag, color) => {
    const newColors = { ...colors, [tag]: color };
    setColors(newColors);
    updatePrefs({ tagColors: newColors });
  };

  return (
    <div className="h-full flex flex-col p-1 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 px-1">Settings</h2>

      <div className="space-y-8 pb-8">
        
        {/* 1. GENERAL SETTINGS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
            <Clock size={18} />
            <h3>Timer Defaults</h3>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-500 font-medium">Default Target Duration</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1"
                value={prefs.defaultGoalMinutes || 30}
                onChange={(e) => updatePrefs({ defaultGoalMinutes: parseInt(e.target.value) || 30 })}
                className="w-16 border border-gray-200 rounded-lg py-1 px-2 text-center font-bold text-slate-900 focus:border-slate-900 outline-none"
              />
              <span className="text-xs text-gray-400 font-medium">mins</span>
            </div>
          </div>
        </div>

        {/* 2. SOUND SETTINGS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
            <Bell size={18} />
            <h3>Alarm Sound</h3>
          </div>
          <div className="space-y-3">
            {SOUNDS.map((sound) => (
              <label key={sound.id} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="sound" 
                    value={sound.id}
                    checked={(prefs.alarmSound || 'beep') === sound.id}
                    onChange={() => updatePrefs({ alarmSound: sound.id })}
                    className="accent-slate-900 w-4 h-4"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-slate-900 transition-colors">{sound.name}</span>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); onTestSound(sound.id); }}
                  className="p-1.5 rounded-full text-gray-300 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  <Play size={14} fill="currentColor" />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* 3. TAG COLORS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
            <Palette size={18} />
            <h3>Tag Appearance</h3>
          </div>
          <div className="space-y-4">
            {tags.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No tags created yet.</p>
            ) : (
              tags.map(tag => (
                <div key={tag} className="flex items-center justify-between">
                   <span className="text-sm font-medium text-slate-700">{tag}</span>
                   <div className="flex gap-1.5">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(tag, color)}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                            (colors[tag] || PRESET_COLORS[0]) === color ? 'border-gray-400 shadow-md scale-110' : 'border-transparent opacity-80'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;