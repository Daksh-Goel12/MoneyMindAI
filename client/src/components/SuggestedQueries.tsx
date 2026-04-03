interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
}

const SUGGESTED_QUERIES = [
  'How do I create a monthly budget?',
  "What's the difference between a 401(k) and an IRA?",
  'How do credit scores work?',
  'What are the basics of investing in stocks?',
  'How do I manage cash flow for my small business?',
  'What should I know about loan interest rates?',
];

export default function SuggestedQueries({ onSelect }: SuggestedQueriesProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTED_QUERIES.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onSelect(query)}
          className="px-4 py-2 rounded-full text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors cursor-pointer"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
