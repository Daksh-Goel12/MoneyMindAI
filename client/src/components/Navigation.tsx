export type Panel = 'chat' | 'knowledge' | 'history' | 'about';

interface NavigationProps {
  activePanel: Panel;
  onPanelChange: (panel: Panel) => void;
}

const tabs: { id: Panel; label: string; icon: string }[] = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'knowledge', label: 'Knowledge Base', icon: '📚' },
  { id: 'history', label: 'History', icon: '🕒' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
];

export default function Navigation({ activePanel, onPanelChange }: NavigationProps) {
  return (
    <>
      {/* Desktop: horizontal top tabs */}
      <nav className="hidden md:flex items-center gap-1 px-4" role="tablist" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activePanel === tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePanel === tab.id
                ? 'bg-primary-600 text-text-inverse'
                : 'text-text-secondary hover:bg-primary-100 dark:hover:bg-primary-50'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile: bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-[var(--color-border)] flex z-50"
        role="tablist"
        aria-label="Main navigation"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activePanel === tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors min-h-[48px] ${
              activePanel === tab.id
                ? 'text-primary-600 font-semibold'
                : 'text-text-secondary'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
