'use client';

import type { ReactNode } from 'react';
import { Search, RefreshCw, RotateCcw } from 'lucide-react';
import { SearchableSelect } from './searchable-select';

export type LeagueStatusFilter = 'all' | 'active' | 'inactive';
export type LeagueFeaturedFilter = 'all' | 'featured' | 'normal';

export interface LeaguesFiltersValue {
  searchQuery: string;
  sportId: string;
  country: string;
  status: LeagueStatusFilter;
  featured: LeagueFeaturedFilter;
}

export interface LeaguesFiltersSportOption {
  id: string;
  name: string;
}

export interface LeaguesFiltersCountryOption {
  code: string;
  name: string;
}

interface LeaguesFiltersProps {
  isDark: boolean;
  loading?: boolean;
  disabled?: boolean;
  sports: LeaguesFiltersSportOption[];
  countries: LeaguesFiltersCountryOption[];
  value: LeaguesFiltersValue;
  onChange: (patch: Partial<LeaguesFiltersValue>) => void;
  onReset: () => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: Array<{ value: LeagueStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const FEATURED_OPTIONS: Array<{ value: LeagueFeaturedFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'Featured only' },
  { value: 'normal', label: 'Non-featured' },
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

export function LeaguesFilters({
  isDark,
  loading,
  disabled,
  sports,
  countries,
  value,
  onChange,
  onReset,
  onRefresh,
}: LeaguesFiltersProps) {
  const countryOptions = countries.map((country) => ({
    value: country.name,
    label: country.name,
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
            Search and narrow results
            {disabled ? ' (disabled while reordering)' : ''}
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
        <div className="md:col-span-5">
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
                placeholder="Search leagues..."
                value={value.searchQuery}
                onChange={(e) => onChange({ searchQuery: e.target.value })}
                disabled={!!disabled}
                className={`${controlClassName} pl-10`}
              />
            </div>
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Sport" isDark={isDark}>
            <select
              value={value.sportId}
              onChange={(e) => onChange({ sportId: e.target.value })}
              disabled={!!disabled}
              className={controlClassName}
            >
              <option value="all">All Sports</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Country" isDark={isDark}>
            <SearchableSelect
              value={value.country}
              options={countryOptions}
              onChange={(newValue) => onChange({ country: newValue })}
              placeholder="Select country"
              disabled={!!disabled}
              isDark={isDark}
              allLabel="All Countries"
            />
          </Field>
        </div>

        <div className="md:col-span-2">
          <Field label="Status" isDark={isDark}>
            <select
              value={value.status}
              onChange={(e) => onChange({ status: e.target.value as LeagueStatusFilter })}
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

        <div className="md:col-span-1">
          <Field label="Featured" isDark={isDark}>
            <select
              value={value.featured}
              onChange={(e) => onChange({ featured: e.target.value as LeagueFeaturedFilter })}
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
      </div>
    </div>
  );
}
