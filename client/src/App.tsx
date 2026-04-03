import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { SessionProvider, useSession } from './contexts/SessionContext';
import Navigation, { type Panel } from './components/Navigation';
import ThemeToggle from './components/ThemeToggle';
import ChatInterface from './components/ChatInterface';
import RetrievedSourcesPanel from './components/RetrievedSourcesPanel';
import KnowledgeBasePanel from './components/KnowledgeBasePanel';
import HistoryPanel from './components/HistoryPanel';
import AboutTab from './components/AboutTab';
import type { Source } from './types';

function AppContent() {
  const [activePanel, setActivePanel] = useState<Panel>('chat');
  const [sources, setSources] = useState<Source[]>([]);
  const { activeSessionId, setActiveSessionId } = useSession();

  const handleSessionCreated = (id: string) => {
    setActiveSessionId(id);
  };

  const handleSourcesChange = (newSources: Source[]) => {
    setSources(newSources);
  };

  return (
    <div className="h-screen flex flex-col bg-surface text-text">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-surface flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-primary-600">💰 MoneyMind AI</h1>
          <Navigation activePanel={activePanel} onPanelChange={setActivePanel} />
        </div>
        <ThemeToggle />
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">
        {activePanel === 'chat' && (
          <div className="flex h-full">
            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0">
              <ChatInterface
                sessionId={activeSessionId}
                onSessionCreated={handleSessionCreated}
                onSourcesChange={handleSourcesChange}
              />
            </div>
            {/* Retrieved Sources sidebar — desktop only */}
            <aside className="hidden lg:block w-80 border-l border-[var(--color-border)] overflow-y-auto flex-shrink-0">
              <RetrievedSourcesPanel sources={sources} />
            </aside>
          </div>
        )}
        {activePanel === 'knowledge' && (
          <div className="h-full overflow-y-auto">
            <KnowledgeBasePanel />
          </div>
        )}
        {activePanel === 'history' && (
          <div className="h-full overflow-y-auto">
            <HistoryPanel />
          </div>
        )}
        {activePanel === 'about' && (
          <div className="h-full overflow-y-auto">
            <AboutTab />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ThemeProvider>
  );
}
