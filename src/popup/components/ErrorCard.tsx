import { useState } from 'react';
import { AlertCircle, AlertTriangle, Copy, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react';
import type { ConsoleError } from '../../types';

interface ErrorCardProps {
  error: ConsoleError;
  onAnalyze: () => void;
}

export default function ErrorCard({ error, onAnalyze }: ErrorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isError = error.type === 'error';
  const timeAgo = getTimeAgo(error.timestamp);

  const handleCopy = async () => {
    const text = `${error.type.toUpperCase()}: ${error.message}\n\nFile: ${error.filename}:${error.lineno}\nURL: ${error.url}\n\nStack Trace:\n${error.stack}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-lg border ${isError ? 'border-red-200' : 'border-yellow-200'} overflow-hidden transition-shadow hover:shadow-md`}>
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Icon */}
          <div className={`mt-0.5 ${isError ? 'text-error' : 'text-warning'}`}>
            {isError ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Type badge and time */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                isError ? 'bg-red-100 text-error' : 'bg-yellow-100 text-warning'
              }`}>
                {error.type}
              </span>
              <span className="text-[10px] text-gray-400">{timeAgo}</span>
            </div>

            {/* Message */}
            <p className={`text-sm text-gray-900 font-medium ${expanded ? '' : 'line-clamp-2'}`}>
              {error.message}
            </p>

            {/* File info */}
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-xs text-gray-500 font-mono truncate">
                {formatFilename(error.filename)}
              </span>
              {error.lineno > 0 && (
                <span className="text-xs text-gray-400">:{error.lineno}</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Less' : 'More'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <button
            onClick={onAnalyze}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Sparkles size={14} />
            Analyze
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          {/* URL */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Page URL</p>
            <a
              href={error.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
            >
              {error.url}
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Stack trace */}
          {error.stack && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Stack Trace</p>
              <pre className="text-[11px] text-gray-700 font-mono bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap break-all">
                {error.stack}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper: Format filename
function formatFilename(filename: string): string {
  if (!filename || filename === 'unknown') return 'Unknown file';
  try {
    const url = new URL(filename);
    return url.pathname.split('/').pop() || filename;
  } catch {
    return filename.split('/').pop() || filename;
  }
}

// Helper: Get relative time
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

