import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SessionContextValue {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  startNewSession: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  return (
    <SessionContext.Provider value={{ activeSessionId, setActiveSessionId, startNewSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
