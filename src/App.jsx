import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, History as HistoryIcon, Settings as SettingsIcon, BellRing, CheckSquare } from 'lucide-react';
import Tracker from './components/Tracker';
import History from './components/History';
import Settings from './components/Settings';
import Tasks from './components/Tasks';
import { saveSession, getSavedTags, saveTags, getPrefs, savePrefs } from './utils/storage';

const DEFAULT_TAGS = ['Deep Work', 'Meeting', 'Reading', 'Thinking', 'Admin'];

const App = () => {
  const [activeTab, setActiveTab] = useState('tracker');
  const audioContextRef = useRef(null);

  // --- STATE ---
  const [tags, setTags] = useState(() => getSavedTags() || DEFAULT_TAGS);
  const [prefs, setPrefs] = useState(() => getPrefs() || {});
  const [activeTag, setActiveTag] = useState(() => {
    const p = getPrefs();
    const t = getSavedTags() || DEFAULT_TAGS;
    return (p.activeTag && t.includes(p.activeTag)) ? p.activeTag : t[0];
  });
  const [goalMinutes, setGoalMinutes] = useState(() => {
    const p = getPrefs();
    return p.defaultGoalMinutes || 30;
  });

  const [taskName, setTaskName] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isGoalReached, setIsGoalReached] = useState(false);

  useEffect(() => { savePrefs({ activeTag }); }, [activeTag]);

  // Sync default goal (Only if timer is completely reset)
  useEffect(() => {
    if (!isRunning && seconds === 0 && prefs.defaultGoalMinutes) {
        setGoalMinutes(prefs.defaultGoalMinutes);
    }
  }, [prefs.defaultGoalMinutes, isRunning, seconds]);

  const handleUpdatePrefs = (newPrefs) => {
    setPrefs(prev => ({ ...prev, ...newPrefs }));
    savePrefs(newPrefs);
  };

  // --- TIMER ---
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => {
          const next = s + 1;
          if (goalMinutes > 0 && next === goalMinutes * 60) triggerAlarm();
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, goalMinutes]);

  // --- AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  // Updated: Play 'click.mp3' for all actions
  const playUISound = (type) => {
    // Ensure the file exists in your 'public' folder as 'click.mp3'
    const audio = new Audio('click.mp3'); 
    
    // Optional: You can vary volume slightly if you want distinction
    if (type === 'stop') {
        audio.volume = 0.6; // Slightly louder for stop
        // audio.playbackRate = 0.8; // Optional: Lower pitch for stop
    } else {
        audio.volume = 0.4;
    }

    audio.play().catch(e => console.error("Audio play failed", e));
  };
  const playBeep = (soundOverride = null) => {
    initAudio();
    const ctx = audioContextRef.current;
    const type = soundOverride || prefs.alarmSound || 'beep';
    
    // ... (Keep existing complex sound logic here from previous step) ...
    // Re-inserting the previous playTone logic briefly for completeness:
    const playTone = (freq, type, duration, startTime = 0, vol = 0.1) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.start(ctx.currentTime + startTime); osc.stop(ctx.currentTime + startTime + duration);
    };

    if (type === 'digital') { playTone(880, 'square', 0.1, 0, 0.05); playTone(880, 'square', 0.1, 0.15, 0.05); }
    else if (type === 'retro') { 
        const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(220, ctx.currentTime); osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1); osc.start(); osc.stop(ctx.currentTime + 0.1);
    }
    else if (type === 'bell') { playTone(523.25, 'sine', 1.5, 0, 0.4); }
    else if (type === 'chime') { playTone(1000, 'sine', 1.0, 0, 0.1); playTone(1500, 'triangle', 1.0, 0.1, 0.05); }
    else if (type === 'success') { playTone(440, 'triangle', 0.3, 0, 0.1); playTone(554, 'triangle', 0.3, 0.1, 0.1); playTone(659, 'triangle', 0.6, 0.2, 0.1); }
    else { playTone(440, 'sawtooth', 0.4, 0, 0.1); }
  };

  const triggerAlarm = () => {
    setIsGoalReached(true); setIsRunning(false);
    let count = 0;
    const interval = setInterval(() => { playBeep(); count++; if (count >= 3) clearInterval(interval); }, 1000);
  };

  // --- ACTIONS ---
  const handleStartStop = () => {
    if (!isRunning) {
      initAudio();
      playUISound('start');
    } else {
      playUISound('pause');
    }
    setIsRunning(!isRunning);
  };
  
  const handleStop = () => {
    playUISound('stop');
    setIsRunning(false); setIsGoalReached(false);
    saveSession({ taskName: taskName || 'Untitled Task', tag: activeTag, duration: seconds, goalDuration: goalMinutes * 60 });
    setSeconds(0); setTaskName('');
  };
  
  const handleExtend = () => { setGoalMinutes(prev => prev + 10); setIsGoalReached(false); setIsRunning(true); };
  
  const handleTagOps = {
    add: (newTag) => { const u = [...tags, newTag]; setTags(u); saveTags(u); setActiveTag(newTag); },
    delete: (tDel) => { const u = tags.filter(t => t !== tDel); setTags(u); saveTags(u); if (activeTag === tDel) setActiveTag(u[0] || ''); }
  };

  const handleTaskStart = (task) => {
    setTaskName(task.title);
    if (tags.includes(task.tag)) setActiveTag(task.tag);
    setActiveTab('tracker');
    initAudio();
    playUISound('start'); // Play sound on task start too
    setIsRunning(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
       {/* GLOBAL ALARM MODAL */}
       {isGoalReached && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4"><BellRing size={32} className="text-amber-500 animate-pulse" /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Time's Up!</h2>
            <p className="text-slate-500 mb-8">Goal reached for "{taskName || 'Untitled'}".</p>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={handleStop} className="px-4 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200">Stop</button>
               <button onClick={handleExtend} className="px-4 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800">+10m</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 p-6 text-white flex-shrink-0 flex items-center justify-between shadow-md z-10">
        <div><h1 className="text-xl font-bold tracking-tight">Focus Logger</h1><p className="text-slate-400 text-xs">Stay on track</p></div>
      </div>

      <div className="flex-grow p-6 overflow-hidden relative bg-gray-50/50">
        {activeTab === 'tracker' && (
          <Tracker 
            state={{ taskName, tags, activeTag, seconds, isRunning, goalMinutes }}
            actions={{ setTaskName, setActiveTag, handleStartStop, handleStop, setGoalMinutes, handleTagOps }}
            tagColors={prefs.tagColors || {}}
          />
        )}
        {activeTab === 'tasks' && (
           <Tasks 
             onStartTask={handleTaskStart} 
             tagColors={prefs.tagColors || {}}
           />
        )}
        {activeTab === 'history' && <History tagColors={prefs.tagColors || {}} />}
        {activeTab === 'settings' && <Settings tags={tags} prefs={prefs} updatePrefs={handleUpdatePrefs} onTestSound={playBeep} />}
      </div>

      <div className="bg-white p-3 flex justify-around border-t border-gray-100 flex-shrink-0 pb-6">
        <NavButton icon={<LayoutDashboard size={20} />} label="Tracker" isActive={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} />
        <NavButton icon={<CheckSquare size={20} />} label="Tasks" isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        <NavButton icon={<HistoryIcon size={20} />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        <NavButton icon={<SettingsIcon size={20} />} label="Settings" isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );
};

const NavButton = ({ icon, label, isActive, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${isActive ? 'text-slate-900' : 'text-gray-400 hover:text-gray-600'}`}>
    {icon}
    <span>{label}</span>
  </button>
);

export default App;