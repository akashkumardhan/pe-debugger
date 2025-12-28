import { useState, useMemo } from 'react';
import { Search, Trash2, AlertCircle, AlertTriangle, Filter, RefreshCw } from 'lucide-react';
import type { ConsoleError } from '../../types';
import { clearErrors, refreshErrors, getErrors } from '../../utils/storage';
import ErrorCard from './ErrorCard';

interface ErrorListProps {
  errors: ConsoleError[];
  onAnalyze: (error: ConsoleError) => void;
  onUpdate: (errors: ConsoleError[]) => void;
  currentTabId?: number; // Current tab ID for filtering
}

type FilterType = 'all' | 'error' | 'warning';

export default function ErrorList({ errors, onAnalyze, onUpdate, currentTabId }: ErrorListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and search errors
  const filteredErrors = useMemo(() => {
    return errors
      .filter(error => {
        if (filter !== 'all' && error.type !== filter) return false;
        if (search) {
          const searchLower = search.toLowerCase();
          return (
            error.message.toLowerCase().includes(searchLower) ||
            error.filename.toLowerCase().includes(searchLower) ||
            error.url.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [errors, filter, search]);

  // Error counts
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;

  // Handle clear all - only clears errors for current tab
  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all errors for this tab?')) {
      await clearErrors(currentTabId);
      onUpdate([]);
    }
  };

  // Handle refresh - clears and re-fetches errors for current tab
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh errors (clears existing and re-injects content script)
      await refreshErrors(currentTabId);
      // Re-fetch fresh errors after a brief delay to allow content script to capture
      setTimeout(async () => {
        const freshErrors = await getErrors(currentTabId);
        onUpdate(freshErrors);
        setIsRefreshing(false);
      }, 500);
    } catch (err) {
      console.error('Failed to refresh errors:', err);
      setIsRefreshing(false);
    }
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
            placeholder="Search errors..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter size={12} />
              All ({errors.length})
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
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            {errors.length > 0 && (
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

      {/* Error list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredErrors.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {search || filter !== 'all' ? (
                <Search size={24} className="text-gray-400" />
              ) : (
                <AlertCircle size={24} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {search || filter !== 'all' ? 'No matching errors' : 'No errors on this tab'}
            </h3>
            <p className="text-xs text-gray-500">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Console errors from the current tab will appear here'}
            </p>
          </div>
        ) : (
          filteredErrors.map(error => (
            <ErrorCard
              key={error.id}
              error={error}
              onAnalyze={() => onAnalyze(error)}
            />
          ))
        )}
      </div>
    </div>
  );
}
