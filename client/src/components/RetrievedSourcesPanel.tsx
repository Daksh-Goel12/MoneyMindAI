import { useState } from 'react';
import type { Source } from '../types';

interface RetrievedSourcesPanelProps {
  sources: Source[];
}

export default function RetrievedSourcesPanel({ sources }: RetrievedSourcesPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold text-primary-600 mb-4">Retrieved Sources</h2>

      {sources.length === 0 ? (
        <p className="text-text-secondary text-sm">No sources used</p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source, index) => (
            <li
              key={source.sectionId}
              className="border border-[var(--color-border)] rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary-50 transition-colors"
                aria-expanded={expandedIndex === index}
              >
                <div className="min-w-0">
                  <p className="font-medium text-text truncate">{source.sectionTitle}</p>
                  <p className="text-xs text-text-secondary truncate">{source.documentName}</p>
                </div>
                <span
                  className={`ml-2 text-text-secondary transition-transform ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {expandedIndex === index && (
                <div className="px-4 pb-4 border-t border-[var(--color-border)] bg-surface-secondary">
                  <p className="text-sm text-text pt-3 whitespace-pre-wrap">{source.content}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
