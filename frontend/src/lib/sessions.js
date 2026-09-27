// Session storage helpers for saving/reloading study sessions

const SESSIONS_KEY = 'studyflow_sessions';
const MAX_SESSIONS = 10;

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSession(studySet) {
  const sessions = getSessions();
  const session = {
    id: Date.now().toString(),
    title: studySet.title,
    savedAt: new Date().toISOString(),
    studySet,
  };
  const updated = [session, ...sessions].slice(0, MAX_SESSIONS);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  return session;
}

export function deleteSession(id) {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function clearSessions() {
  localStorage.removeItem(SESSIONS_KEY);
}
