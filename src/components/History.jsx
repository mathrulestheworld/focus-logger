import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trash2, Calendar, BarChart2, PieChart as PieIcon, 
  Plus, Edit2, X, Save, FileText, Download 
} from 'lucide-react';
import { 
  getHistory, deleteSession, updateSession, saveSession, getSavedTags 
} from '../utils/storage';
import { 
  format, subDays, isSameDay, isAfter, startOfDay, endOfDay, parseISO, differenceInDays 
} from 'date-fns';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const DEFAULT_PALETTE = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

const History = ({ tagColors = {} }) => {
  const [allSessions, setAllSessions] = useState([]);
  const [tags, setTags] = useState([]);
  
  // View State
  const [viewMode, setViewMode] = useState('week'); 
  const [timeWindow, setTimeWindow] = useState('7days'); 
  
  // Custom Date Range State
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Modals
  const [isEditMode, setIsEditMode] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    setAllSessions(getHistory());
    setTags(getSavedTags() || []);
  }, []);

  // --- 1. FILTER DATA ---
  const filteredSessions = useMemo(() => {
    const now = new Date();
    let start, end = endOfDay(now);

    if (timeWindow === '1d') {
      start = startOfDay(now); 
    } else if (timeWindow === '7days') {
      start = startOfDay(subDays(now, 6)); 
    } else if (timeWindow === '30days') {
      start = startOfDay(subDays(now, 29));
    } else if (timeWindow === 'custom') {
      start = startOfDay(parseISO(customStart));
      end = endOfDay(parseISO(customEnd));
    } else {
      start = new Date(0); // All time
    }

    return allSessions
      .filter(s => {
        const date = new Date(s.timestamp);
        return date >= start && date <= end;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [allSessions, timeWindow, customStart, customEnd]);

  // --- 2. REPORT & AVG LOGIC ---
  const reportData = useMemo(() => {
    if (filteredSessions.length === 0) return null;
    const totalSeconds = filteredSessions.reduce((acc, curr) => acc + curr.duration, 0);
    const tagCounts = {};
    filteredSessions.forEach(s => tagCounts[s.tag] = (tagCounts[s.tag] || 0) + s.duration);
    const topTag = Object.keys(tagCounts).reduce((a, b) => tagCounts[a] > tagCounts[b] ? a : b);
    
    let rangeDays = 1;
    if (timeWindow === '1d') rangeDays = 1;
    else if (timeWindow === '7days') rangeDays = 7;
    else if (timeWindow === '30days') rangeDays = 30;
    else if (timeWindow === 'custom') {
        rangeDays = differenceInDays(parseISO(customEnd), parseISO(customStart)) + 1;
    } else if (timeWindow === 'all') {
        // Calculate days between first and last log
        const last = new Date(filteredSessions[0].timestamp); // newest
        const first = new Date(filteredSessions[filteredSessions.length - 1].timestamp); // oldest
        rangeDays = differenceInDays(last, first) + 1;
    }
    if (rangeDays < 1) rangeDays = 1;

    return {
        totalSeconds,
        avgSeconds: totalSeconds / rangeDays,
        topTag,
        tagBreakdown: Object.entries(tagCounts).sort(([,a], [,b]) => b - a).map(([tag, sec]) => ({ tag, sec }))
    };
  }, [filteredSessions, timeWindow, customStart, customEnd]);


  // --- ACTIONS ---
  const handleDelete = (id) => {
    if (confirm('Delete this entry?')) {
      const updated = deleteSession(id);
      setAllSessions(updated);
    }
  };

  const handleEditClick = (session) => {
    const localDate = format(new Date(session.timestamp), "yyyy-MM-dd'T'HH:mm");
    setCurrentSession({ ...session, timestampLocal: localDate, durationMinutes: Math.round(session.duration / 60) || 1 }); 
    setIsEditMode(true);
  };

  const handleManualClick = () => {
    const nowLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    setCurrentSession({
      taskName: '',
      tag: tags[0] || 'Deep Work',
      durationMinutes: 30,
      timestampLocal: nowLocal, 
      note: ''
    });
    setIsManualMode(true);
  };

  const validateAndSave = () => {
    if (!currentSession.taskName) return alert("Task name required");
    if (isAfter(new Date(currentSession.timestampLocal), new Date())) return alert("Cannot log future tasks.");
    const payload = {
      taskName: currentSession.taskName,
      tag: currentSession.tag,
      duration: parseInt(currentSession.durationMinutes) * 60, 
      timestamp: new Date(currentSession.timestampLocal).toISOString(),
      note: currentSession.note
    };
    if (isManualMode) { setAllSessions(saveSession(payload)); setIsManualMode(false); } 
    else { setAllSessions(updateSession({ ...payload, id: currentSession.id })); setIsEditMode(false); }
    setCurrentSession(null);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // --- CHART DATA ---
  const weeklyData = useMemo(() => {
    const days = [];
    const count = timeWindow === '1d' ? 1 : 7; // Only show 1 bar if 1d view
    for (let i = count - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const daySessions = filteredSessions.filter(s => isSameDay(new Date(s.timestamp), date));
      const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.duration, 0);
      days.push({ name: timeWindow === '1d' ? 'Today' : format(date, 'EEE'), hours: parseFloat((totalSeconds / 3600).toFixed(1)), seconds: totalSeconds });
    }
    return days;
  }, [filteredSessions, timeWindow]);

  const tagData = useMemo(() => {
    const counts = {};
    filteredSessions.forEach(s => counts[s.tag] = (counts[s.tag] || 0) + s.duration);
    return Object.keys(counts).map(tag => ({ name: tag, value: parseFloat((counts[tag] / 3600).toFixed(1)), seconds: counts[tag] })).sort((a, b) => b.value - a.value);
  }, [filteredSessions]);

  const totalSeconds = filteredSessions.reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="h-full flex flex-col relative">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
        <div className="flex justify-end gap-2 items-center flex-wrap">
          {timeWindow === 'custom' && (
             <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent text-[10px] font-medium text-slate-700 outline-none w-20" />
                <span className="text-gray-400 text-[10px]">-</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent text-[10px] font-medium text-slate-700 outline-none w-20" />
             </div>
          )}
          <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-bold text-gray-500">
            {['1d', '7days', '30days', 'all', 'custom'].map(w => (
              <button key={w} onClick={() => setTimeWindow(w)} className={`px-2 py-1 rounded-md transition-all capitalize ${timeWindow === w ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-700'}`}>
                {w === '1d' ? 'Today' : w === '7days' ? '7D' : w === '30days' ? '30D' : w}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{formatDuration(totalSeconds)}</h2>
            <p className="text-gray-400 text-sm">Total in window</p>
          </div>
          <div className="flex gap-2">
             <button title="Report" onClick={() => setIsReportOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"><FileText size={18} /></button>
             <div className="w-px h-8 bg-gray-200 mx-1"></div>
             <button onClick={() => setViewMode('week')} className={`p-2 rounded-lg ${viewMode === 'week' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'}`}><BarChart2 size={18} /></button>
             <button onClick={() => setViewMode('tags')} className={`p-2 rounded-lg ${viewMode === 'tags' ? 'bg-slate-100 text-slate-900' : 'text-gray-400'}`}><PieIcon size={18} /></button>
             <button onClick={handleManualClick} className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 ml-2"><Plus size={18} /></button>
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="h-40 mb-4 flex-shrink-0">
        {filteredSessions.length === 0 ? <div className="h-full bg-slate-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">No data</div> : (
           <ResponsiveContainer width="100%" height="100%">
             {viewMode === 'week' ? 
                <BarChart data={weeklyData}>
                  <Bar dataKey="hours" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={20} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip formatter={(val, name, props) => [formatDuration(props.payload.seconds), 'Duration']} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                </BarChart> 
                : 
                <PieChart>
                  <Pie data={tagData} innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                    {tagData.map((entry, index) => <Cell key={`cell-${index}`} fill={tagColors[entry.name] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(val, name, props) => [formatDuration(props.payload.seconds), 'Duration']} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconSize={8} wrapperStyle={{fontSize: '10px'}} />
                </PieChart>
             }
           </ResponsiveContainer>
        )}
      </div>

      {/* LIST */}
      <div className="flex-grow overflow-y-auto -mx-6 px-6 pb-4 space-y-3">
        {filteredSessions.map((session) => {
          // Check if this is a completion log (duration 0 means it was just checked off)
          const isCompletionLog = session.duration === 0;

          return (
            <div 
              key={session.id} 
              className={`border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${
                isCompletionLog 
                  ? 'bg-green-50/50 border-green-200' 
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="overflow-hidden">
                  <div className={`font-semibold truncate ${isCompletionLog ? 'text-green-800' : 'text-slate-800'}`}>
                    {session.taskName}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded text-nowrap text-white font-bold" style={{ backgroundColor: tagColors[session.tag] || '#94a3b8' }}>{session.tag}</span>
                    <span className={`text-xs flex items-center gap-1 ${isCompletionLog ? 'text-green-600' : 'text-gray-400'}`}>
                        <Calendar size={10} /> {format(new Date(session.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {session.note && <div className="mt-2 text-xs text-slate-500 bg-white/50 p-2 rounded italic">"{session.note}"</div>}
                </div>
                <div className="text-right pl-2 flex flex-col items-end gap-2">
                  <div className={`font-mono font-bold text-sm ${isCompletionLog ? 'text-green-700' : 'text-slate-900'}`}>
                    {isCompletionLog ? 'COMPLETED' : formatDuration(session.duration)}
                  </div>
                  <div className="flex gap-1">
                     <button onClick={() => handleEditClick(session)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={12} /></button>
                     <button onClick={() => handleDelete(session.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* REPORT MODAL */}
      {isReportOpen && reportData && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
              <button onClick={() => setIsReportOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              <div className="text-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Report</h2>
                 <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">{timeWindow === 'custom' ? `${customStart} to ${customEnd}` : timeWindow}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-slate-900">{formatDuration(reportData.totalSeconds)}</div><div className="text-xs text-gray-400 font-bold uppercase">Total</div></div>
                 <div className="bg-slate-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-slate-900">{reportData.avgSeconds === 0 ? '--' : formatDuration(reportData.avgSeconds)}</div><div className="text-xs text-gray-400 font-bold uppercase">Daily Avg</div></div>
              </div>
              <div className="space-y-2 mb-6">
                {reportData.tagBreakdown.slice(0,4).map(item => (
                   <div key={item.tag} className="flex justify-between text-sm"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor:tagColors[item.tag]||'#94a3b8'}}></div>{item.tag}</span><span className="font-mono">{formatDuration(item.sec)}</span></div>
                ))}
              </div>
              <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex justify-center gap-2"><Download size={18} /> Print</button>
           </div>
        </div>
      )}

      {/* EDIT / MANUAL MODAL */}
      {(isEditMode || isManualMode) && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-10">
          <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">{isManualMode ? 'New Log' : 'Edit Log'}</h3><button onClick={() => { setIsEditMode(false); setIsManualMode(false); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
          <div className="space-y-4 flex-grow overflow-y-auto">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Task</label><input className="w-full border-b border-gray-200 py-2 focus:border-slate-900 outline-none font-medium" value={currentSession.taskName} onChange={e => setCurrentSession({...currentSession, taskName: e.target.value})} placeholder="What did you do?" /></div>
            <div className="flex gap-4">
               <div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase">Tag</label><select className="w-full border-b border-gray-200 py-2 bg-transparent outline-none" value={currentSession.tag} onChange={e => setCurrentSession({...currentSession, tag: e.target.value})}>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
               <div className="flex-1"><label className="text-xs font-bold text-gray-500 uppercase">Duration (Mins)</label><input type="number" className="w-full border-b border-gray-200 py-2 outline-none" value={currentSession.durationMinutes} onChange={e => setCurrentSession({...currentSession, durationMinutes: e.target.value})} /></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Date</label><input type="datetime-local" max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} className="w-full border-b border-gray-200 py-2 outline-none text-sm" value={currentSession.timestampLocal || ''} onChange={e => setCurrentSession({...currentSession, timestampLocal: e.target.value})} /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Notes</label><textarea className="w-full border border-gray-200 rounded-lg p-3 mt-2 text-sm focus:border-slate-900 outline-none" rows={4} value={currentSession.note || ''} onChange={e => setCurrentSession({...currentSession, note: e.target.value})} /></div>
          </div>
          <button onClick={validateAndSave} className="mt-4 w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-slate-800"><Save size={18} /> Save</button>
        </div>
      )}
    </div>
  );
};

export default History;