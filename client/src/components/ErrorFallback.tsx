import type { ApiErrorType } from '../api';

const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  llm: "We couldn't generate a response right now. Please try again.",
  retrieval: 'We had trouble searching the knowledge base. Please try again.',
  network:
    "It looks like there's a connection issue. Check your internet and try again.",
  rate_limited: 'The system is busy. Please wait a moment and try again.',
  unknown: 'Something went wrong. Please try again.',
};

interface ErrorFallbackProps {
  errorType: ApiErrorType;
  onRetry: () => void;
}

export default function ErrorFallback({
  errorType,
  onRetry,
}: ErrorFallbackProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
      <span className="text-xl" aria-hidden="true">⚠️</span>
      <div className="flex-1">
        <p className="text-sm">{ERROR_MESSAGES[errorType]}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
