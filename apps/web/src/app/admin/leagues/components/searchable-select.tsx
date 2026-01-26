'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isDark: boolean;
  allLabel?: string;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  isDark,
  allLabel = 'All',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = value === 'all' ? allLabel : selectedOption?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('all');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-colors flex items-center justify-between ${
          isDark
            ? 'bg-slate-700 border-slate-600 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={value === 'all' ? (isDark ? 'text-gray-400' : 'text-slate-400') : ''}>
          {displayLabel}
        </span>
        <div className="flex items-center gap-1">
          {value !== 'all' && !disabled && (
            <X
              size={16}
              className={isDark ? 'text-gray-400 hover:text-white' : 'text-slate-400 hover:text-slate-800'}
              onClick={handleClear}
            />
          )}
          <ChevronDown
            size={18}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
              isDark ? 'text-gray-400' : 'text-slate-400'
            }`}
          />
        </div>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full mt-2 border rounded-xl shadow-lg overflow-hidden ${
            isDark
              ? 'bg-slate-700 border-slate-600'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="p-2 border-b border-slate-600">
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`}
                size={16}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isDark
                    ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-4 py-2.5 text-left hover:bg-emerald-500/10 transition-colors ${
                value === 'all'
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-50 text-emerald-600'
                  : isDark
                  ? 'text-gray-300'
                  : 'text-slate-800'
              }`}
            >
              {allLabel}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-emerald-500/10 transition-colors ${
                    value === option.value
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-emerald-50 text-emerald-600'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div
                className={`px-4 py-8 text-center ${
                  isDark ? 'text-gray-500' : 'text-slate-400'
                }`}
              >
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
