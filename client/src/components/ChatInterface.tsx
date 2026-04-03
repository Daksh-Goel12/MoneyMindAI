import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, Source } from '../types';
import type { ApiErrorType } from '../api';
import { sendChat, createSession, submitFeedback, updateFeedback, exportMessage } from '../api';
import { ApiError } from '../api';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ErrorFallback from './ErrorFallback';

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onSourcesChange: (sources: Source[]) => void;
}

export default function ChatInterface({
  sessionId,
  onSessionCreated,
  onSourcesChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<{ type: ApiErrorType; query: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Reset messages when session changes
  useEffect(() => {
    if (sessionId === null) {
      setMessages([]);
      setError(null);
    }
  }, [sessionId]);

  const handleSubmit = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      setError(null);
      setInputValue('');

      let currentSessionId = sessionId;

      // Auto-create session if none exists
      if (!currentSessionId) {
        try {
          const { sessionId: newId } = await createSession();
          currentSessionId = newId;
          onSessionCreated(newId);
        } catch {
          setError({ type: 'network', query });
          return;
        }
      }

      // Add user message optimistically
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        sessionId: currentSessionId,
        role: 'user',
        content: query,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const res = await sendChat(query, currentSessionId);
        const assistantMessage: Message = {
          id: res.messageId,
          sessionId: currentSessionId,
          role: 'assistant',
          content: res.response,
          sources: res.sources,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        onSourcesChange(res.sources);
      } catch (err) {
        const errorType: ApiErrorType =
          err instanceof ApiError ? err.type : 'unknown';
        setError({ type: errorType, query });
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading, onSessionCreated, onSourcesChange],
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleRetry = () => {
    if (error) {
      handleSubmit(error.query);
    }
  };

  const handleFeedback = async (messageId: string, rating: 'up' | 'down') => {
    const msg = messages.find((m) => m.id === messageId);
    try {
      if (msg?.feedback) {
        await updateFeedback(messageId, rating);
      } else {
        await submitFeedback(messageId, rating);
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m)),
      );
    } catch {
      // Silently fail feedback — non-critical
    }
  };

  const handleExport = async (messageId: string) => {
    try {
      const blob = await exportMessage(messageId, 'text');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `response-${messageId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silently fail export — non-critical
    }
  };

  const isEmpty = messages.length === 0 && !isLoading && !error;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <EmptyState onQuerySelect={handleSubmit} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onFeedback={handleFeedback}
                onExport={handleExport}
              />
            ))}
            {isLoading && <TypingIndicator />}
            {error && (
              <ErrorFallback errorType={error.type} onRetry={handleRetry} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleFormSubmit}
        className="border-t border-[var(--color-border)] bg-surface p-4"
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a financial question..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border)] bg-surface text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 rounded-lg bg-primary-600 text-text-inverse hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
