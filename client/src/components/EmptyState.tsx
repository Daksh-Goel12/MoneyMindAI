import SuggestedQueries from './SuggestedQueries';

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

export default function EmptyState({ onQuerySelect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center gap-6">
      <div className="text-5xl">💰</div>
      <div>
        <h2 className="text-2xl font-bold text-primary-600 mb-2">
          Welcome to MoneyMind AI
        </h2>
        <p className="text-text-secondary max-w-md">
          Your friendly fintech assistant for budgeting, loans, investing,
          credit, and business finance.
        </p>
      </div>
      <SuggestedQueries onSelect={onQuerySelect} />
    </div>
  );
}
