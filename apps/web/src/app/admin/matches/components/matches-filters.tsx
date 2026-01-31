'use client';

import type { ReactNode } from 'react';
import { Search, RefreshCw, RotateCcw, Calendar } from 'lucide-react';
import { SearchableSelect } from '../../leagues/components/searchable-select';
import type { MatchStatus } from '@/services/match.service';

export type MatchStatusFilter = 'all' | MatchStatus;
export type MatchBettingFilter = 'all' | 'enabled' | 'disabled';
export type MatchFeaturedFilter = 'all' | 'featured' | 'normal';

export interface MatchesFiltersValue {
  searchQuery: string;
  leagueId: string;
  teamId: string;
  status: MatchStatusFilter;
  betting: MatchBettingFilter;
  featured: MatchFeaturedFilter;
  dateFrom: string;
  dateTo: string;
}

export interface MatchesFiltersLeagueOption {
  id: string;
  name: string;
}

export interface MatchesFiltersTeamOption {
  id: string;
  name: string;
}

interface MatchesFiltersProps {
  isDark: boolean;
  loading?: boolean;
  disabled?: boolean;
  leagues: MatchesFiltersLeagueOption[];
  teams: MatchesFiltersTeamOption[];
  value: MatchesFiltersValue;
  onChange: (patch: Partial<MatchesFiltersValue>) => void;
  onReset: () => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: Array<{ value: MatchStatusFilter; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'live', label: 'Live' },
  { value: 'finished', label: 'Finished' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
];

const BETTING_OPTIONS: Array<{ value: MatchBettingFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Betting On' },
  { value: 'disabled', label: 'Betting Off' },
];

const FEATURED_OPTIONS: Array<{ value: MatchFeaturedFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'Featured' },
  { value: 'normal', label: 'Normal' },
];

function Field({
  label,
  isDark,
  children,
}: {
  label: string;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
        {label}
      </div>
      {children}
    </div>
  );
}

export function MatchesFilters({
  isDark,
  loading,
  disabled,
  leagues,
  teams,
  value,
  onChange,
  onReset,
  onRefresh,
}: MatchesFiltersProps) {
  const leagueOptions = leagues.map((league) => ({
    value: league.id,
    label: league.name,
  }));

  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));

  const controlClassName = `w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors ${
    isDark
      ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
  }`;

  const iconButtonClassName = `p-2.5 border rounded-xl transition-colors disabled:opacity-50 ${
    isDark
      ? 'bg-slate-700 border-slate-600 text-gray-300 hover:text-white hover:border-emerald-500'
      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-emerald-500'
  }`;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Filters</h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Search and filter matches
            {disabled ? ' (disabled)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!!disabled || !!loading}
            className={iconButtonClassName}
            title="Reset filters"
          >
            <RotateCcw size={18} />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!!disabled || !!loading}
            className={iconButtonClassName}
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4">
          <Field label="Search" isDark={isDark}>
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`}
                size={18}
              />
              <input
                type="text"
                placeholder="Search by team name..."
                value={value.searchQuery}
                onChange={(e) => onChange({ searchQuery: e.target.value })}
                disabled={!!disabled}
                className={`${controlClassName} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="md:col-span-3">
          <Field label="League" isDark={isDark}>
            <SearchableSelect
              value={value.leagueId}
              options={leagueOptions}
              onChange={(newValue) => onChange({ leagueId: newValue })}
              placeholder="Select league"
              disabled={!!disabled}
              isDark={isDark}
              allLabel="All Leagues"
            />
          </Field>
        </div>

        <div className="md:col-span-3">
          <Field label="Team" isDark={isDark}>
            <SearchableSelect
              value={value.teamId}
              options={teamOptions}
              onChange={(newValue) => onChange({ teamId: newValue })}
              placeholder="Select team"
              disabled={!!disabled}
              isDark={isDark}
              allLabel="All Teams"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Status" isDark={isDark}>
            <select
              value={value.status}
              onChange={(e) => onChange({ status: e.target.value as MatchStatusFilter })}
              disabled={!!disabled}
              className={controlClassName}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-3">
          <Field label="Date From" isDark={isDark}>
            <div className="relative">
              <Calendar
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`}
                size={16}
              />
              <input
                type="date"
                value={value.dateFrom}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
                disabled={!!disabled}
                className={`${controlClassName} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="md:col-span-3">
          <Field label="Date To" isDark={isDark}>
            <div className="relative">
              <Calendar
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`}
                size={16}
              />
              <input
                type="date"
                value={value.dateTo}
                onChange={(e) => onChange({ dateTo: e.target.value })}
                disabled={!!disabled}
                className={`${controlClassName} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Betting" isDark={isDark}>
            <select
              value={value.betting}
              onChange={(e) => onChange({ betting: e.target.value as MatchBettingFilter })}
              disabled={!!disabled}
              className={controlClassName}
            >
              {BETTING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Featured" isDark={isDark}>
            <select
              value={value.featured}
              onChange={(e) => onChange({ featured: e.target.value as MatchFeaturedFilter })}
              disabled={!!disabled}
              className={controlClassName}
            >
              {FEATURED_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="md:col-span-2 flex items-end">
          <button
            type="button"
            onClick={onReset}
            disabled={!!disabled || !!loading}
            className={`w-full py-2.5 px-4 border rounded-xl transition-colors text-sm font-medium ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-gray-300 hover:text-white hover:border-red-500 hover:bg-red-500/10'
                : 'bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-500 hover:bg-red-50'
            }`}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
