import { startOfDay, isAfter, addDays } from 'date-fns';

const STORAGE_KEY = 'focus_logger_sessions';
const TAGS_KEY = 'focus_logger_tags';
const PREFS_KEY = 'focus_logger_prefs';
const TASKS_KEY = 'focus_logger_tasks';     // Simple Tasks
const PROJECTS_KEY = 'focus_logger_projects'; // Complex Tasks

// --- HELPERS ---
const getJSON = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } 
  catch { return []; }
};
const saveJSON = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// --- HISTORY ---
export const getHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveSession = (session) => {
  try {
    const history = getHistory();
    const newSession = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      note: '',
      ...session
    };
    const updated = [newSession, ...history];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) { return []; }
};

export const updateSession = (updatedSession) => {
  const history = getHistory();
  const index = history.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    history[index] = updatedSession;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
  return history;
};

export const deleteSession = (id) => {
  const history = getHistory();
  const updated = history.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

// --- TAGS & PREFS ---
export const getSavedTags = () => {
  try {
    const data = localStorage.getItem(TAGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) { return null; }
};

export const saveTags = (tags) => {
  localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
};

export const getPrefs = () => {
  try {
    const data = localStorage.getItem(PREFS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) { return {}; }
};

export const savePrefs = (prefs) => {
  // Merge with existing to avoid data loss
  const current = getPrefs();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...prefs }));
};  

// --- NEW: PROJECT (Complex Task) OPERATIONS ---
export const getProjects = () => getJSON(PROJECTS_KEY);

export const saveProject = (project) => {
  const projects = getProjects();
  // If ID exists, update; else add
  const index = projects.findIndex(p => p.id === project.id);
  let updated;
  if (index !== -1) {
    projects[index] = { ...projects[index], ...project };
    updated = projects;
  } else {
    updated = [{ id: Date.now(), title: '', note: '', ...project }, ...projects];
  }
  saveJSON(PROJECTS_KEY, updated);
  return updated;
};

export const deleteProject = (id) => {
  // When deleting a project, we should probably delete (or orphan) its tasks. 
  // For safety, let's just orphan them (remove projectId).
  const tasks = getTasks();
  const updatedTasks = tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t);
  saveJSON(TASKS_KEY, updatedTasks);

  const projects = getProjects().filter(p => p.id !== id);
  saveJSON(PROJECTS_KEY, projects);
  return projects;
};

// --- NEW: TASK (Simple Task) OPERATIONS ---
export const getTasks = () => getJSON(TASKS_KEY);

export const saveTask = (task) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === task.id);
  let updated;
  
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...task };
    updated = tasks;
  } else {
    // New Task Default State
    const newTask = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      title: '',
      note: '',
      priority: 3, // Default to High/Normal (3)
      deadline: '',
      tag: 'Deep Work',
      projectId: null, // Link to Complex Task
      completed: false,
      deferredUntil: null, // ISO Date string
      ...task
    };
    updated = [newTask, ...tasks];
  }
  saveJSON(TASKS_KEY, updated);
  return updated;
};

export const deleteTask = (id) => {
  const updated = getTasks().filter(t => t.id !== id);
  saveJSON(TASKS_KEY, updated);
  return updated;
};

export const toggleDeferTask = (task) => {
  // If currently deferred, undefer it. 
  // If active, defer until TOMORROW start of day.
  const isDeferred = task.deferredUntil && isAfter(new Date(task.deferredUntil), new Date());
  
  let newDate = null;
  if (!isDeferred) {
    newDate = startOfDay(addDays(new Date(), 1)).toISOString();
  }
  
  return saveTask({ ...task, deferredUntil: newDate });
};

// --- AGGREGATOR ---
// This function prepares the "Action Items" list for the UI
export const getActionItems = () => {
  const tasks = getTasks();
  const projects = getProjects();
  const today = new Date();

  // 1. Filter Active & Non-Deferred
  const active = tasks.filter(t => {
    if (t.completed) return false;
    if (t.deferredUntil && isAfter(new Date(t.deferredUntil), today)) return false;
    return true;
  });

  // 2. Attach Project Names for display
  const enriched = active.map(t => {
    const proj = projects.find(p => p.id === t.projectId);
    return { ...t, projectName: proj ? proj.title : null };
  });

  // 3. Sort by Priority (Descending: 5 -> 1)
  // Note: We can add a 'manualOrder' field later for drag-and-drop override
  return enriched.sort((a, b) => b.priority - a.priority);
};