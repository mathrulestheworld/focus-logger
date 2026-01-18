import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Check, Trash2, Edit2, Play, Moon, Eye, EyeOff,
  ChevronUp, ChevronDown, Layers, Calendar, X, Folder
} from 'lucide-react';
import { 
  getTasks, getProjects, saveTask, saveProject, 
  deleteTask, deleteProject, toggleDeferTask, getSavedTags, saveSession 
} 
from '../utils/storage';
import { format, isPast, isToday, isAfter, startOfDay } from 'date-fns';

const PRIORITY_LABELS = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent', 5: 'Emergency' };

// UPDATED: Full card styles (Background + Border)
const PRIORITY_STYLES = {
  1: 'bg-blue-50/50 border-blue-100 hover:border-blue-300',
  2: 'bg-green-50/50 border-green-100 hover:border-green-300',
  3: 'bg-amber-50/50 border-amber-100 hover:border-amber-300',
  4: 'bg-orange-50/80 border-orange-200 hover:border-orange-300',
  5: 'bg-red-50/80 border-red-200 hover:border-red-300'
};

const Tasks = ({ onStartTask, tagColors }) => {
  // Data
  const [rawTasks, setRawTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [sortedItems, setSortedItems] = useState([]); // Local state for manual sort

  // View State
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false); 
  const [isProjectEditOpen, setIsProjectEditOpen] = useState(false);

  // Forms
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', priority: 3, tag: '', deadline: '', projectId: '', note: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: '', note: '' });


  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setRawTasks(getTasks());
    setProjects(getProjects());
    setTags(getSavedTags() || []);
  };

  // --- FILTERING LOGIC ---
  useEffect(() => {
    const today = startOfDay(new Date());
    let filtered = rawTasks.filter(t => !t.completed);

    if (!showSnoozed) {
      filtered = filtered.filter(t => {
        if (!t.deferredUntil) return true;
        return !isAfter(new Date(t.deferredUntil), today);
      });
    }

    const enriched = filtered.map(t => {
      const proj = projects.find(p => p.id === t.projectId);
      return { ...t, projectName: proj ? proj.title : null };
    });

    // Default Sort: Priority DESC -> Date ASC
    const sorted = enriched.sort((a, b) => {
       if (b.priority !== a.priority) return b.priority - a.priority;
       return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    setSortedItems(sorted);
  }, [rawTasks, projects, showSnoozed]);


  // --- ACTIONS ---
  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;
    const payload = { ...taskForm, priority: parseInt(taskForm.priority) };
    if (!payload.tag && tags.length > 0) payload.tag = tags[0];

    saveTask(editingTask ? { ...payload, id: editingTask.id } : payload);
    closeModals();
    refreshData();
  };

  const handleDefer = (task) => { toggleDeferTask(task); refreshData(); };
  const handleComplete = (task) => {
    saveTask({ ...task, completed: true });
    
    // Log completion in history (0 duration = completion event)
    saveSession({
      taskName: task.title,
      tag: task.tag,
      duration: 0,
      goalDuration: 0,
      note: '' // <--- CLEARED: No more text note
    });
    
    refreshData();
  };
  const handleDelete = (id) => { if (confirm("Delete this task?")) { deleteTask(id); refreshData(); } };

  // Manual Sort for Tasks (Visual Only)
  const moveTask = (index, direction) => {
    const newItems = [...sortedItems];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setSortedItems(newItems);
  };

  // Manual Sort for Projects
  const moveProject = (index, direction) => {
    const newItems = [...projects];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setProjects(newItems);
    // Note: To persist this, we would need to save 'projects' array order to storage
    // For now, it resets on reload unless we update saveProject storage logic to respect full array save.
  };

  const handleSaveProject = () => {
    if (!projectForm.title.trim()) return;
    saveProject(editingProject ? { ...projectForm, id: editingProject.id } : projectForm);
    setIsProjectEditOpen(false); setIsProjectManagerOpen(true); refreshData();
  };

  const handleDeleteProject = (id) => { if (confirm("Delete project?")) { deleteProject(id); refreshData(); } };


  // --- MODALS ---
  const openTaskModal = (task = null) => {
    setEditingTask(task);
    setTaskForm(task || { title: '', priority: 3, tag: tags[0] || 'Deep Work', deadline: '', projectId: '', note: '' });
    setIsTaskModalOpen(true);
  };
  const openProjectEdit = (project = null) => {
    setEditingProject(project); setProjectForm(project || { title: '', note: '' });
    setIsProjectManagerOpen(false); setIsProjectEditOpen(true);
  };
  const closeModals = () => { setIsTaskModalOpen(false); setIsProjectManagerOpen(false); setIsProjectEditOpen(false); };

  const DeadlineBadge = ({ dateStr }) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const overdue = isPast(date) && !isToday(date);
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${overdue ? 'bg-red-100 text-red-600' : 'bg-white/50 text-slate-500'}`}>
        <Calendar size={10} /> {overdue ? 'Overdue: ' : ''}{format(date, 'MMM d')}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Action Items</h2>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
             <span>{sortedItems.length} active tasks</span>
             {showSnoozed && <span className="text-indigo-500 font-bold text-xs bg-indigo-50 px-2 py-0.5 rounded-full">Showing Snoozed</span>}
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setShowSnoozed(!showSnoozed)} className={`p-2 rounded-xl transition-colors ${showSnoozed ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:text-slate-900'}`} title={showSnoozed ? "Hide Deferred" : "Show Deferred"}>
            {showSnoozed ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
           <button onClick={() => setIsProjectManagerOpen(true)} className="bg-white border border-gray-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50">
            <Folder size={14} /> Projects
          </button>
          <button onClick={() => openTaskModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-grow overflow-y-auto -mx-4 px-4 space-y-3 pb-20">
        {sortedItems.length === 0 ? (
          <div className="text-center mt-20 opacity-50"><Check size={48} className="mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400">All caught up!</p></div>
        ) : (
          sortedItems.map((task, idx) => {
            const isDeferred = task.deferredUntil && isAfter(new Date(task.deferredUntil), new Date());
            return (
              <div key={task.id} className={`group border p-4 rounded-xl shadow-sm hover:shadow-md transition-all ${PRIORITY_STYLES[task.priority]} ${isDeferred ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                     <button onClick={() => handleComplete(task)} className="w-5 h-5 rounded-full border-2 border-gray-400/50 hover:border-green-600 hover:bg-green-100 transition-colors" title="Mark Complete" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-slate-900 truncate block">{task.title}</span>
                      {task.projectName && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/60 text-indigo-700 border border-indigo-100 flex items-center gap-1"><Layers size={8} /> {task.projectName}</span>}
                      {isDeferred && <Moon size={12} className="text-indigo-500" />}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-slate-600">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-black/10 bg-white/40">{PRIORITY_LABELS[task.priority]}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shadow-sm" style={{ backgroundColor: tagColors[task.tag] || '#94a3b8' }}>{task.tag}</span>
                      <DeadlineBadge dateStr={task.deadline} />
                    </div>
                    {task.note && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{task.note}</p>}
                  </div>
                  
                  {/* ACTIONS */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     {!isDeferred && (
                       <button onClick={() => onStartTask(task)} className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 shadow-md" title="Focus Now"><Play size={14} fill="currentColor" /></button>
                     )}
                     <div className="w-px h-6 bg-black/10 mx-1" />
                     <button onClick={() => handleDefer(task)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/50 rounded" title={isDeferred ? "Wake" : "Defer"}><Moon size={16} fill={isDeferred ? "currentColor" : "none"} /></button>
                     <button onClick={() => openTaskModal(task)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white/50 rounded"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white/50 rounded"><Trash2 size={16} /></button>
                     {/* Manual Sort */}
                     <div className="flex flex-col ml-1">
                        <button onClick={() => moveTask(idx, 'up')} className="p-0.5 text-slate-400 hover:text-slate-900"><ChevronUp size={12} /></button>
                        <button onClick={() => moveTask(idx, 'down')} className="p-0.5 text-slate-400 hover:text-slate-900"><ChevronDown size={12} /></button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* --- TASK MODAL --- */}
      {isTaskModalOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 animate-in slide-in-from-bottom-10 rounded-t-2xl shadow-2xl">
           <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">{editingTask ? 'Edit Task' : 'New Action Item'}</h3><button onClick={closeModals} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
          <div className="flex-grow overflow-y-auto space-y-5 pr-2">
             <div><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input className="w-full text-lg font-medium border-b border-gray-200 py-2 focus:border-slate-900 outline-none" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} autoFocus /></div>
             <div className="flex gap-4">
                <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase">Priority</label><select className="w-full border-b border-gray-200 py-2 bg-transparent outline-none font-medium" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>{Object.entries(PRIORITY_LABELS).map(([k,v]) => <option key={k} value={k}>{k} - {v}</option>)}</select></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase">Tag</label><select className="w-full border-b border-gray-200 py-2 bg-transparent outline-none font-medium" value={taskForm.tag} onChange={e => setTaskForm({...taskForm, tag: e.target.value})}>{tags.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
             </div>
             <div className="flex gap-4">
                <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase">Project</label><select className="w-full border-b border-gray-200 py-2 bg-transparent outline-none font-medium text-indigo-600" value={taskForm.projectId} onChange={e => setTaskForm({...taskForm, projectId: e.target.value})}><option value="">None</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
                <div className="flex-1"><label className="text-xs font-bold text-gray-400 uppercase">Deadline</label><input type="date" className="w-full border-b border-gray-200 py-2 bg-transparent outline-none font-medium" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} /></div>
             </div>
             <div><label className="text-xs font-bold text-gray-400 uppercase">Detailed Notes</label><textarea className="w-full border border-gray-200 rounded-lg p-3 mt-2 text-sm focus:border-slate-900 outline-none" rows={4} value={taskForm.note} onChange={e => setTaskForm({...taskForm, note: e.target.value})} /></div>
          </div>
          <button onClick={handleSaveTask} className="mt-4 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">Save Task</button>
        </div>
      )}

      {/* --- PROJECT MANAGER --- */}
      {isProjectManagerOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 animate-in zoom-in-95 rounded-t-2xl">
           <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Manage Projects</h3><button onClick={closeModals} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
          <div className="flex-grow overflow-y-auto space-y-3">
             <button onClick={() => openProjectEdit()} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-slate-900 hover:text-slate-900 transition-colors flex justify-center items-center gap-2"><Plus size={16} /> Create New Project</button>
             {projects.map((p, idx) => (
               <div key={p.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 group">
                  <div><div className="font-bold text-slate-800">{p.title}</div><div className="text-xs text-gray-500">{p.note || 'No description'}</div></div>
                  <div className="flex gap-1">
                    <div className="flex flex-col mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveProject(idx, 'up')} className="p-0.5 text-gray-400 hover:text-slate-900"><ChevronUp size={12} /></button>
                        <button onClick={() => moveProject(idx, 'down')} className="p-0.5 text-gray-400 hover:text-slate-900"><ChevronDown size={12} /></button>
                     </div>
                    <button onClick={() => openProjectEdit(p)} className="p-2 bg-white border border-gray-200 rounded-lg text-slate-600 hover:border-slate-900"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteProject(p.id)} className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:border-red-500"><Trash2 size={14} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* --- PROJECT EDIT MODAL --- */}
      {isProjectEditOpen && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col p-6 animate-in zoom-in-95 rounded-t-2xl">
           <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">{editingProject ? 'Edit Project' : 'New Project'}</h3><button onClick={() => { setIsProjectEditOpen(false); setIsProjectManagerOpen(true); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
          <div className="flex-grow space-y-4">
             <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-xs mb-4"><span className="font-bold block mb-1">About Complex Tasks</span>Projects group your tasks. They don't appear in the daily list, but tasks linked to them do.</div>
             <div><label className="text-xs font-bold text-gray-400 uppercase">Title</label><input className="w-full text-lg font-medium border-b border-gray-200 py-2 focus:border-slate-900 outline-none" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} autoFocus /></div>
             <div><label className="text-xs font-bold text-gray-400 uppercase">Notes</label><textarea className="w-full border border-gray-200 rounded-lg p-3 mt-2 text-sm focus:border-slate-900 outline-none" rows={4} value={projectForm.note} onChange={e => setProjectForm({...projectForm, note: e.target.value})} /></div>
          </div>
          <button onClick={handleSaveProject} className="mt-4 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">Save Project</button>
        </div>
      )}

    </div>
  );
};

export default Tasks;