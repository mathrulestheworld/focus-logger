const STORAGE_KEY = 'focus_logger_sessions';
const TAGS_KEY = 'focus_logger_tags';
const PREFS_KEY = 'focus_logger_prefs';

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