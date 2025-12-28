import { Zap } from 'lucide-react';

interface PEQuerySuggestionsProps {
  onQuerySelect: (query: string) => void;
}

const SUGGESTIONS = [
  'Show me all active campaigns',
  'What are my cart abandonment settings?',
  'List all browse abandonment campaigns',
  'Show opt-in configuration',
  'What segments do I have?',
  'Explain my chicklet settings',
  'Is geo location enabled?',
  "What's my site URL and ID?"
];

export default function PEQuerySuggestions({ onQuerySelect }: PEQuerySuggestionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SUGGESTIONS.map((query, index) => (
        <button
          key={index}
          onClick={() => onQuerySelect(query)}
          className="flex items-start gap-2 p-2.5 text-left text-xs bg-white border border-gray-200 rounded-lg hover:border-secondary hover:bg-indigo-50 transition-all group"
        >
          <Zap size={12} className="text-secondary mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
          <span className="text-gray-700 group-hover:text-secondary line-clamp-2">
            {query}
          </span>
        </button>
      ))}
    </div>
  );
}

