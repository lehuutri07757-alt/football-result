'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Trophy, Users, Calendar, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useLanguageStore } from '@/stores/language.store';
import { formatDateTime } from '@/lib/date';

interface League {
  id: string;
  name: string;
  country?: string;
  logoUrl?: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  shortName?: string;
}

interface Match {
  id: string;
  homeTeam: { id: string; name: string; logoUrl?: string };
  awayTeam: { id: string; name: string; logoUrl?: string };
  startTime: string;
  league?: { name: string };
}

interface SearchResults {
  leagues: League[];
  teams: Team[];
  matches: Match[];
  meta?: {
    total: number;
    query: string;
    executionTime: number;
  };
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ leagues: [], teams: [], matches: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const language = useLanguageStore((s) => s.language);

  const updateDropdownPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const performSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ leagues: [], teams: [], matches: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/search', {
        params: { q: q.trim(), limit: 5 },
      });

      setResults(response.data || { leagues: [], teams: [], matches: [] });
      updateDropdownPosition();
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ leagues: [], teams: [], matches: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const totalResults = (results.leagues?.length || 0) + (results.teams?.length || 0) + (results.matches?.length || 0);
  const hasResults = totalResults > 0;

  const getItemAtIndex = (index: number): { type: 'league' | 'team' | 'match'; id: string } | null => {
    let currentIndex = 0;

    if (index < results.leagues.length) {
      return { type: 'league', id: results.leagues[index].id };
    }
    currentIndex += results.leagues.length;

    if (index < currentIndex + results.teams.length) {
      return { type: 'team', id: results.teams[index - currentIndex].id };
    }
    currentIndex += results.teams.length;

    if (index < currentIndex + results.matches.length) {
      return { type: 'match', id: results.matches[index - currentIndex].id };
    }

    return null;
  };

  const navigateToSelected = () => {
    const item = getItemAtIndex(selectedIndex);
    if (!item) return;

    const routes = {
      league: `/leagues/${item.id}`,
      team: `/teams/${item.id}`,
      match: `/matches/${item.id}`,
    };

    router.push(routes[item.type]);
    clearSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !hasResults) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      navigateToSelected();
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        inputRef.current && !inputRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleFocus = () => {
    if (query.length >= 2) {
      updateDropdownPosition();
      setIsOpen(true);
    }
  };

  const dropdownContent = isOpen && query.length >= 2 && (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
      className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[9999] max-h-[500px] overflow-y-auto"
    >
      {results.leagues && results.leagues.length > 0 && (
        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Leagues ({results.leagues.length})
          </h3>
          {results.leagues.map((league, idx) => (
            <Link
              key={league.id}
              href={`/leagues/${league.id}`}
              onClick={clearSearch}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                selectedIndex === idx
                  ? 'bg-emerald-50 dark:bg-emerald-500/10'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {league.logoUrl ? (
                <img src={league.logoUrl} alt="" className="w-6 h-6 rounded object-cover" />
              ) : (
                <Trophy className="w-5 h-5 text-amber-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {league.name}
                </p>
                {league.country && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {league.country}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {results.teams && results.teams.length > 0 && (
        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Teams ({results.teams.length})
          </h3>
          {results.teams.map((team, idx) => {
            const currentIndex = results.leagues.length + idx;
            return (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                onClick={clearSearch}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  selectedIndex === currentIndex
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt="" className="w-6 h-6 rounded object-cover" />
                ) : (
                  <Users className="w-5 h-5 text-blue-500" />
                )}
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {team.name}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {results.matches && results.matches.length > 0 && (
        <div className="p-2">
          <h3 className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Matches ({results.matches.length})
          </h3>
          {results.matches.map((match, idx) => {
            const currentIndex = results.leagues.length + results.teams.length + idx;
            return (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                onClick={clearSearch}
                className={`w-full block px-3 py-2.5 rounded-lg transition-colors ${
                  selectedIndex === currentIndex
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-slate-900 dark:text-white truncate flex-1">
                    {match.homeTeam.name}
                  </span>
                  <span className="text-xs text-slate-400">vs</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate flex-1 text-right">
                    {match.awayTeam.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(match.startTime, language)}
                  </span>
                  {match.league && (
                    <>
                      <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {match.league.name}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="p-8 text-center">
          <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No results found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try searching for a different term
          </p>
        </div>
      )}

      {hasResults && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Use ↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search matches, leagues, teams..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-24 py-4 text-base lg:rounded-xl border-x-0 lg:border-x border-y border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-0 lg:focus:ring-2 focus:ring-emerald-500/20 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
        />

        {isLoading && (
          <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}

        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-3 w-3 text-slate-400" />
          </button>
        )}

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded dark:bg-slate-800 dark:border-slate-700">
            ⌘K
          </kbd>
        </div>
      </div>

      {typeof window !== 'undefined' && createPortal(dropdownContent, document.body)}
    </div>
  );
}
