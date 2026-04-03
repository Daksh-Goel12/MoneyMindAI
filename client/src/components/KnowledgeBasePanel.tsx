import { useState, useEffect, useMemo } from 'react';
import type { Document } from '../types';
import { getKnowledgeBase } from '../api';
import UploadManager from './UploadManager';

export default function KnowledgeBasePanel() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    getKnowledgeBase()
      .then((data) => setDocuments(data.documents))
      .catch(() => {});
  }, []);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;

    const q = searchQuery.toLowerCase();
    return documents
      .map((doc) => {
        const docMatches = doc.name.toLowerCase().includes(q);
        const matchingSections = doc.sections.filter(
          (s) =>
            s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        );

        if (docMatches) return doc;
        if (matchingSections.length > 0) return { ...doc, sections: matchingSections };
        return null;
      })
      .filter(Boolean) as Document[];
  }, [documents, searchQuery]);

  const toggleDoc = (docId: string) => {
    setExpandedDoc(expandedDoc === docId ? null : docId);
    setExpandedSection(null);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-primary-600 mb-4">Knowledge Base</h2>

      <input
        type="text"
        placeholder="Search documents and sections…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 mb-4 rounded-lg border border-[var(--color-border)] bg-surface text-text placeholder:text-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
      />

      <div className="flex-1 overflow-auto">
        {filteredDocuments.length === 0 ? (
          <p className="text-text-secondary text-sm">No results found</p>
        ) : (
          <ul className="space-y-2">
            {filteredDocuments.map((doc) => (
              <li
                key={doc.id}
                className="border border-[var(--color-border)] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleDoc(doc.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary-50 transition-colors"
                  aria-expanded={expandedDoc === doc.id}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-primary-500">📄</span>
                    <span className="font-medium text-text truncate">{doc.name}</span>
                    <span className="text-xs text-text-secondary flex-shrink-0">
                      ({doc.sections.length} sections)
                    </span>
                  </div>
                  <span
                    className={`ml-2 text-text-secondary transition-transform ${
                      expandedDoc === doc.id ? 'rotate-180' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {expandedDoc === doc.id && (
                  <ul className="border-t border-[var(--color-border)]">
                    {doc.sections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between px-6 py-2 text-left text-sm hover:bg-surface-secondary transition-colors"
                          aria-expanded={expandedSection === section.id}
                        >
                          <span className="text-text truncate">{section.title}</span>
                          <span
                            className={`ml-2 text-xs text-text-secondary transition-transform ${
                              expandedSection === section.id ? 'rotate-180' : ''
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {expandedSection === section.id && (
                          <div className="px-6 pb-3 bg-surface-secondary">
                            <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                              {section.content}
                            </p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <UploadManager />
    </div>
  );
}
