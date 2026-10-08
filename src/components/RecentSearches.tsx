import React, { useState, useEffect } from 'react';
import {
  useJobContext,
  loadRecentSearchesFromStorage,
  saveRecentSearchesToStorage,
  RECENT_SEARCHES_STORAGE_KEY,
} from '../context/JobContext';
import { History, Search, X, Plus, RotateCcw } from 'lucide-react';

export interface RecentSearchesProps {
  activeQuery?: string;
  onSelectQuery?: (query: string) => void;
  className?: string;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  activeQuery = '',
  onSelectQuery,
  className = '',
}) => {
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useJobContext();

  const [localHistory, setLocalHistory] = useState<string[]>(() =>
    recentSearches && recentSearches.length > 0
      ? recentSearches
      : loadRecentSearchesFromStorage()
  );
  const [quickInput, setQuickInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Sync localHistory with JobContext recentSearches
  useEffect(() => {
    setLocalHistory(recentSearches);
  }, [recentSearches]);

  // Track activeQuery in localStorage when a user searches
  useEffect(() => {
    const trimmed = activeQuery.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => {
        addRecentSearch(trimmed);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [activeQuery]);

  const handleRunQuery = (query: string) => {
    const cleaned = query.trim();
    if (!cleaned) return;
    addRecentSearch(cleaned);
    saveRecentSearchesToStorage([
      cleaned,
      ...localHistory.filter((item) => item.toLowerCase() !== cleaned.toLowerCase()),
    ].slice(0, 6));
    if (onSelectQuery) {
      onSelectQuery(cleaned);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = quickInput.trim();
    if (!cleaned) return;
    handleRunQuery(cleaned);
    setQuickInput('');
    setShowAddInput(false);
  };

  const handleRemoveChip = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    removeRecentSearch(query);
  };

  const handleClearAll = () => {
    clearRecentSearches();
    setLocalHistory([]);
    try {
      localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  return (
    <div
      data-testid="header-recent-searches"
      aria-label="Recent Searches"
      className={`border-t border-slate-100 bg-slate-50/75 py-1.5 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 mr-1">
            <History className="w-3.5 h-3.5 text-emerald-700" />
            <span>Recent Searches:</span>
          </span>

          {localHistory.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">
              No recent queries saved yet
            </span>
          ) : (
            localHistory.map((query) => {
              const isSelected =
                activeQuery.trim().toLowerCase() === query.toLowerCase();
              return (
                <div
                  key={query}
                  className={`inline-flex items-center rounded-full border transition-all ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                  <button
                    type="button"
                    data-testid={`header-recent-chip-${query}`}
                    onClick={() => handleRunQuery(query)}
                    className="px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title={`Re-run search for "${query}"`}
                  >
                    <Search
                      className={`w-2.5 h-2.5 ${
                        isSelected ? 'text-emerald-200' : 'text-emerald-600'
                      }`}
                    />
                    <span>{query}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${query} from recent searches`}
                    onClick={(e) => handleRemoveChip(e, query)}
                    className={`pr-2 pl-0.5 py-0.5 rounded-r-full transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-emerald-200 hover:text-white'
                        : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title="Remove from history"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {showAddInput ? (
            <form onSubmit={handleAddSubmit} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Quick search..."
                aria-label="Quick search query"
                className="px-2 py-0.5 text-[11px] bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-emerald-600 w-32"
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-md cursor-pointer"
              >
                Go
              </button>
              <button
                type="button"
                onClick={() => setShowAddInput(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              title="Run and save a new search query"
            >
              <Plus className="w-3 h-3" />
              <span>Quick Query</span>
            </button>
          )}

          {localHistory.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Clear recent search history"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
