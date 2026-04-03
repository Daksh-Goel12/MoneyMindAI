import { useState } from 'react';
import type { Message } from '../types';

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[\-\*]\s+/gm, '• ')
    .replace(/`(.+?)`/g, '$1');
}

interface MessageBubbleProps {
  message: Message;
  onFeedback: (messageId: string, rating: 'up' | 'down') => void;
  onExport: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  onFeedback,
  onExport,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [selectedRating, setSelectedRating] = useState<'up' | 'down' | null>(
    message.feedback ?? null,
  );

  const handleFeedback = (rating: 'up' | 'down') => {
    setSelectedRating(rating);
    onFeedback(message.id, rating);
  };

  const sourcesCount = message.sources?.length ?? 0;
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-text-inverse'
            : 'bg-surface-secondary text-text border border-[var(--color-border)]'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{isUser ? message.content : cleanMarkdown(message.content)}</p>

        <div
          className={`flex items-center gap-3 mt-2 text-xs ${
            isUser ? 'text-primary-200 justify-end' : 'text-text-secondary'
          }`}
        >
          <span>{timestamp}</span>

          {!isUser && (
            <>
              {sourcesCount > 0 && (
                <span className="text-primary-600 cursor-pointer hover:underline">
                  {sourcesCount} {sourcesCount === 1 ? 'source' : 'sources'}
                </span>
              )}

              <button
                type="button"
                onClick={() => handleFeedback('up')}
                className={`p-1 rounded transition-colors ${
                  selectedRating === 'up'
                    ? 'text-green-600 bg-green-100'
                    : 'hover:text-green-600'
                }`}
                aria-label="Thumbs up"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => handleFeedback('down')}
                className={`p-1 rounded transition-colors ${
                  selectedRating === 'down'
                    ? 'text-red-600 bg-red-100'
                    : 'hover:text-red-600'
                }`}
                aria-label="Thumbs down"
              >
                👎
              </button>
              <button
                type="button"
                onClick={() => onExport(message.id)}
                className="p-1 rounded hover:text-primary-600 transition-colors"
                aria-label="Export response"
              >
                ⬇️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
