import React, { useState } from 'react';
import { Play, Pause, Square, Plus, X, Clock } from 'lucide-react';

// Helper to make faint background colors
const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(148, 163, 184, 0.1)'; // default gray
  let r = 0, g = 0, b = 0;
  // Handle 3-digit hex
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
};

const Tracker = ({ state, actions, tagColors }) => {
  const { taskName, tags, activeTag, seconds, isRunning, goalMinutes } = state;
  const { setTaskName, setActiveTag, handleStartStop, handleStop, setGoalMinutes, handleTagOps } = actions;
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const onAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      handleTagOps.add(newTag.trim());
    }
    setNewTag('');
    setIsAddingTag(false);
  };

  const handleGoalChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    setGoalMinutes(val);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 1. Task Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="What are you working on?"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          disabled={isRunning || seconds > 0}
          className="w-full text-xl font-medium bg-transparent border-b-2 border-gray-100 focus:border-slate-900 outline-none pb-2 transition-colors placeholder:text-gray-300"
        />
      </div>

      {/* 2. Tag Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const baseColor = tagColors[tag] || '#0f172a'; // Default slate
            const isActive = activeTag === tag;
            
            return (
              <div
                key={tag}
                onClick={() => !isRunning && setActiveTag(tag)}
                style={{
                  backgroundColor: isActive ? baseColor : hexToRgba(baseColor, 0.1),
                  color: isActive ? 'white' : baseColor,
                  borderColor: isActive ? baseColor : 'transparent'
                }}
                className={`group flex items-center pl-3 pr-2 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all select-none ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {tag}
                {!isRunning && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleTagOps.delete(tag); }}
                    className={`ml-2 p-0.5 rounded-full transition-colors ${
                      isActive 
                        ? 'text-white/70 hover:bg-white/20 hover:text-white' 
                        : 'opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 text-gray-400'
                    }`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
          {!isRunning && (
            isAddingTag ? (
              <input
                autoFocus
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onBlur={onAddTag}
                onKeyDown={(e) => e.key === 'Enter' && onAddTag()}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-slate-900 outline-none w-24"
              />
            ) : (
              <button 
                onClick={() => setIsAddingTag(true)}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-slate-600 hover:border-slate-400 flex items-center gap-1"
              >
                <Plus size={12} /> Add Tag
              </button>
            )
          )}
        </div>
      </div>

      {/* 3. Timer */}
      <div className="flex-grow flex flex-col items-center justify-center mb-8">
        <div className={`text-6xl font-mono font-bold tracking-wider transition-colors ${isRunning ? 'text-slate-900' : 'text-gray-300'}`}>
          {formatTime(seconds)}
        </div>
        
        <div className="mt-8 flex items-center gap-3 text-sm text-gray-500 bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-full">
           <Clock size={16} className="text-slate-400" />
           <span className="uppercase tracking-wide text-xs font-bold text-gray-400">Target:</span>
           {seconds === 0 && !isRunning ? (
             <div className="flex items-center gap-1 relative">
               <input 
                 type="number" 
                 min="1"
                 value={goalMinutes}
                 onChange={handleGoalChange}
                 className="w-12 bg-gray-50 border border-gray-200 rounded px-1 text-center text-slate-900 font-bold focus:outline-none focus:border-slate-900"
               />
               <span className="font-medium text-slate-600">min</span>
             </div>
           ) : (
             <span className="font-bold text-slate-900">{goalMinutes} min</span>
           )}
        </div>
      </div>

      {/* 4. Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleStartStop}
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
            isRunning 
              ? 'bg-white border-2 border-amber-100 text-amber-500 hover:bg-amber-50' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        {seconds > 0 && (
          <button
            onClick={handleStop}
            className="h-16 w-16 rounded-full bg-red-50 text-red-500 border-2 border-red-100 flex items-center justify-center hover:bg-red-100 transition-all active:scale-95"
          >
            <Square size={24} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Tracker;