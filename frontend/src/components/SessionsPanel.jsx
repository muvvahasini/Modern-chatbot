import { useState } from 'react';
import { getSessions, deleteSession } from '../lib/sessions';

export default function SessionsPanel({ onLoad }) {
  const [sessions, setSessions] = useState(() => getSessions());

  const handleLoad = (session) => {
    onLoad(session.studySet);
  };

  const handleDelete = (id) => {
    deleteSession(id);
    setSessions(getSessions());
  };

  if (sessions.length === 0) {
    return (
      <div className="sessions-empty">
        <p>No saved sessions yet. Generate a study set and click "Save Session".</p>
      </div>
    );
  }

  return (
    <div className="sessions-list">
      {sessions.map((session) => (
        <div key={session.id} className="session-item glass-panel">
          <div className="session-info">
            <p className="session-title">{session.title}</p>
            <p className="session-meta">
              {session.studySet.blocks?.length || 0} blocks •{' '}
              {new Date(session.savedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="session-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleLoad(session)}
            >
              Load
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => handleDelete(session.id)}
              aria-label="Delete session"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
