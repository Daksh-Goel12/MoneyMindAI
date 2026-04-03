import { useState, useEffect } from 'react';
import type { SessionSummary } from '../types';
import { getSessions } from '../api';
import { useSession } from '../contexts/SessionContext';

export default function HistoryPanel() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const { setActiveSessionId, startNewSession } = useSession();

  useEffect(() => {
    getSessions()
      .then((data) => setSessions(data.sessions))
      .catch(() => {});
  }, []);

  const handleNewChat = () => {
    startNewSession();
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-primary-600">History</h2>
        <button
          onClick={handleNewChat}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-text-inverse hover:bg-primary-700 transition-colors"
        >
          + New Chat
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary text-sm">No conversations yet</p>
          <p className="text-text-secondary text-xs mt-1">
            Start a chat to see your history here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                onClick={() => handleSelectSession(session.id)}
                className="w-full text-left px-4 py-3 rounded-lg border border-[var(--color-border)] hover:bg-primary-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-text text-sm truncate">{session.title}</p>
                  <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                    {formatDate(session.updatedAt)}
                  </span>
                </div>
                {session.preview && (
                  <p className="text-xs text-text-secondary truncate">{session.preview}</p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
