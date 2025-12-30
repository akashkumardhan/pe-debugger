import { useState, useMemo } from 'react';
import { Search, Trash2, AlertCircle, AlertTriangle, Filter, Terminal } from 'lucide-react';
import type { ConsoleError, PELog } from '../../types';
import { clearErrors, clearPELogs } from '../../utils/storage';
import ErrorCard from './ErrorCard';

interface LogsListProps {
  errors: ConsoleError[];
  peLogs: PELog[];
  onAnalyze: (error: ConsoleError) => void;
  onErrorsUpdate: (errors: ConsoleError[]) => void;
  onPELogsUpdate: (logs: PELog[]) => void;
  currentTabId?: number;
}

type FilterType = 'all' | 'error' | 'warning' | 'pelogs';

// Unified log item type for display
interface DisplayLogItem {
  id: number;
  type: 'error' | 'warning' | 'pelog';
  message: string;
  timestamp: number;
  source: 'console' | 'pushengage';
  original: ConsoleError | PELog;
}

export default function LogsList({ 
  errors, 
  peLogs, 
  onAnalyze, 
  onErrorsUpdate, 
  onPELogsUpdate,
  currentTabId 
}: LogsListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // Combine and transform all logs for unified display
  const allLogs = useMemo((): DisplayLogItem[] => {
    const errorItems: DisplayLogItem[] = errors.map(e => ({
      id: e.id,
      type: e.type,
      message: e.message,
      timestamp: e.timestamp,
      source: 'console' as const,
      original: e
    }));

    const peLogItems: DisplayLogItem[] = peLogs.map(l => ({
      id: l.id,
      type: 'pelog' as const,
      message: l.message,
      timestamp: l.timestamp,
      source: 'pushengage' as const,
      original: l
    }));

    return [...errorItems, ...peLogItems];
  }, [errors, peLogs]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return allLogs
      .filter(log => {
        // Filter by type
        if (filter === 'error' && log.type !== 'error') return false;
        if (filter === 'warning' && log.type !== 'warning') return false;
        if (filter === 'pelogs' && log.type !== 'pelog') return false;
        
        // Search
        if (search) {
          const searchLower = search.toLowerCase();
          if (log.source === 'console') {
            const error = log.original as ConsoleError;
            return (
              log.message.toLowerCase().includes(searchLower) ||
              error.filename.toLowerCase().includes(searchLower) ||
              error.url.toLowerCase().includes(searchLower)
            );
          } else {
            return log.message.toLowerCase().includes(searchLower);
          }
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [allLogs, filter, search]);

  // Counts
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  const peLogCount = peLogs.length;
  const totalCount = allLogs.length;

  // Handle clear all
  const handleClearAll = async () => {
    const clearType = filter === 'pelogs' ? 'PE logs' : filter === 'all' ? 'all logs' : `${filter}s`;
    if (confirm(`Are you sure you want to clear ${clearType} for this tab?`)) {
      if (filter === 'pelogs') {
        await clearPELogs(currentTabId);
        onPELogsUpdate([]);
      } else if (filter === 'all') {
        await Promise.all([
          clearErrors(currentTabId),
          clearPELogs(currentTabId)
        ]);
        onErrorsUpdate([]);
        onPELogsUpdate([]);
      } else {
        // Clear only errors (includes both error and warning types)
        await clearErrors(currentTabId);
        onErrorsUpdate([]);
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="p-3 space-y-2 bg-white border-b">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter size={12} />
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === 'error'
                  ? 'bg-error text-white'
                  : 'bg-red-50 text-error hover:bg-red-100'
              }`}
            >
              <AlertCircle size={12} />
              Errors ({errorCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === 'warning'
                  ? 'bg-warning text-white'
                  : 'bg-yellow-50 text-warning hover:bg-yellow-100'
              }`}
            >
              <AlertTriangle size={12} />
              Warnings ({warningCount})
            </button>
            <button
              onClick={() => setFilter('pelogs')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === 'pelogs'
                  ? 'bg-secondary text-white'
                  : 'bg-indigo-50 text-secondary hover:bg-indigo-100'
              }`}
            >
              <Terminal size={12} />
              PE Logs ({peLogCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {filteredLogs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-error transition-colors"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'pelogs' ? (
                <Terminal size={24} className="text-gray-400" />
              ) : search || filter !== 'all' ? (
                <Search size={24} className="text-gray-400" />
              ) : (
                <AlertCircle size={24} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {filter === 'pelogs'
                ? 'No PE logs captured'
                : search || filter !== 'all' 
                ? 'No matching logs' 
                : 'No logs on this page'}
            </h3>
            <p className="text-xs text-gray-500">
              {filter === 'pelogs'
                ? 'PushEngage SDK verbose logs will appear here automatically'
                : search || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Console logs from the current page session will appear here'}
            </p>
          </div>
        ) : (
          filteredLogs.map(log => (
            log.source === 'console' ? (
              <ErrorCard
                key={`error-${log.id}`}
                error={log.original as ConsoleError}
                onAnalyze={() => onAnalyze(log.original as ConsoleError)}
              />
            ) : (
              <PELogCard
                key={`pelog-${log.id}`}
                log={log.original as PELog}
                formatTime={formatTime}
              />
            )
          ))
        )}
      </div>
    </div>
  );
}

// PE Log Card Component (inline for simplicity)
interface PELogCardProps {
  log: PELog;
  formatTime: (timestamp: number) => string;
}

function PELogCard({ log, formatTime }: PELogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLongMessage = log.message.length > 200;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(log.message);
  };

  return (
    <div className="bg-white rounded-lg border border-indigo-200 p-3 hover:border-indigo-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase bg-indigo-100 text-indigo-700">
            PE {log.type}
          </span>
          <span className="text-[10px] text-gray-400">
            {formatTime(log.timestamp)}
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          title="Copy log message"
        >
          📋
        </button>
      </div>

      {/* Message */}
      <div className="text-xs font-mono text-gray-700 break-all">
        {isLongMessage && !expanded ? (
          <>
            {log.message.slice(0, 200)}...
            <button
              onClick={() => setExpanded(true)}
              className="text-secondary hover:underline ml-1"
            >
              Show more
            </button>
          </>
        ) : (
          <>
            {log.message}
            {isLongMessage && (
              <button
                onClick={() => setExpanded(false)}
                className="text-secondary hover:underline ml-1"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

