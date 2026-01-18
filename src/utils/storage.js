import { startOfDay, isAfter, addDays } from 'date-fns';

const STORAGE_KEY = 'focus_logger_sessions';
const TAGS_KEY = 'focus_logger_tags';
const PREFS_KEY = 'focus_logger_prefs';
const TASKS_KEY = 'focus_logger_tasks';
const PROJECTS_KEY = 'focus_logger_projects';

// --- HELPERS ---
const getJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } 
  catch { return []; }
};
const saveJSON = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// --- MIGRATION (Fix Old Data) ---
export const migrateData = () => {
  const sessions = getJSON(STORAGE_KEY);
  let hasChanges = false;

  const updated = sessions.map(session => {
    // If it has a timestamp but NO startTime, it's an old entry
    if (session.timestamp && !session.startTime) {
      hasChanges = true;
      const endTime = new Date(session.timestamp);
      // Calculate start time based on duration (duration is in seconds)
      const startTime = new Date(endTime.getTime() - (session.duration * 1000));
      
      return {
        ...session,
        endTime: session.timestamp, // Old timestamp was effectively the end time
        startTime: startTime.toISOString()
      };
    }
    return session;
  });

  if (hasChanges) {
    console.log("Migrated data to Start-End format");
    saveJSON(STORAGE_KEY, updated);
  }
};

// --- HISTORY ---
export const getHistory = () => {
  migrateData(); // Ensure migration runs on fetch
  return getJSON(STORAGE_KEY);
};

export const saveSession = (session) => {
  const history = getHistory();
  
  // Logic: Use provided Start/End, or calculate them if missing (defaults to Now)
  const newSession = {
    id: Date.now(),
    startTime: session.startTime || new Date(Date.now() - (session.duration * 1000)).toISOString(),
    endTime: session.endTime || new Date().toISOString(),
    ...session
  };

  const updated = [newSession, ...history];
  saveJSON(STORAGE_KEY, updated);
  return updated;
};

export const updateSession = (updatedSession) => {
  const history = getHistory();
  const index = history.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    history[index] = updatedSession;
    saveJSON(STORAGE_KEY, history);
  }
  return history;
};

export const deleteSession = (id) => {
  const updated = getHistory().filter(s => s.id !== id);
  saveJSON(STORAGE_KEY, updated);
  return updated;
};

// --- TAGS & PREFS ---
export const getSavedTags = () => getJSON(TAGS_KEY);
export const saveTags = (tags) => saveJSON(TAGS_KEY, tags);
export const getPrefs = () => getJSON(PREFS_KEY);
export const savePrefs = (prefs) => {
  const current = getPrefs();
  saveJSON(PREFS_KEY, { ...current, ...prefs });
};  

// --- PROJECTS ---
export const getProjects = () => getJSON(PROJECTS_KEY);
export const saveProject = (project) => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  const updated = index !== -1 
    ? projects.map(p => p.id === project.id ? { ...p, ...project } : p)
    : [{ id: Date.now(), title: '', note: '', ...project }, ...projects];
  saveJSON(PROJECTS_KEY, updated);
  return updated;
};
export const deleteProject = (id) => {
  const tasks = getTasks();
  saveJSON(TASKS_KEY, tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t));
  saveJSON(PROJECTS_KEY, getProjects().filter(p => p.id !== id));
};

// --- TASKS ---
export const getTasks = () => getJSON(TASKS_KEY);
export const saveTask = (task) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  const updated = index !== -1 
    ? tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
    : [{
        id: Date.now(),
        createdAt: new Date().toISOString(),
        title: '', note: '', priority: 3, deadline: '', 
        tag: 'Deep Work', projectId: null, completed: false, 
        deferredUntil: null, ...task
      }, ...tasks];
  saveJSON(TASKS_KEY, updated);
  return updated;
};
export const deleteTask = (id) => saveJSON(TASKS_KEY, getTasks().filter(t => t.id !== id));
export const toggleDeferTask = (task) => {
  const isDeferred = task.deferredUntil && isAfter(new Date(task.deferredUntil), new Date());
  return saveTask({ ...task, deferredUntil: !isDeferred ? startOfDay(addDays(new Date(), 1)).toISOString() : null });
};
export const getActionItems = () => {
  const tasks = getTasks(); const projects = getProjects(); const today = new Date();
  return tasks.filter(t => !t.completed && (!t.deferredUntil || !isAfter(new Date(t.deferredUntil), today)))
    .map(t => ({ ...t, projectName: projects.find(p => p.id === t.projectId)?.title }))
    .sort((a, b) => b.priority - a.priority);
};