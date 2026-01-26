'use client';

import { useEffect, useState } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';
import { topLeaguesService } from '@/services/top-leagues.service';
import type { TopLeaguesResponse, CountryLeagueStats } from '@/types/top-leagues';

interface UpcomingMatchesTabsProps {
  onCountrySelect?: (country: CountryLeagueStats | null) => void;
  selectedCountryCode?: string | null;
}

export function UpcomingMatchesTabs({ 
  onCountrySelect, 
  selectedCountryCode = 'TOP' 
}: UpcomingMatchesTabsProps) {
  const [data, setData] = useState<TopLeaguesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(selectedCountryCode || 'TOP');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await topLeaguesService.getTopLeagues();
        setData(response);
      } catch (err) {
        setError('Failed to load leagues data');
        console.error('Failed to fetch top leagues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabClick = (countryCode: string) => {
    setActiveTab(countryCode);
    
    if (onCountrySelect) {
      if (countryCode === 'TOP') {
        onCountrySelect(data?.topLeagues || null);
      } else {
        const country = data?.countries.find(c => c.countryCode === countryCode);
        onCountrySelect(country || null);
      }
    }
  };

  const getTabs = () => {
    if (!data) return [];
    
    const tabs: Array<{ code: string; name: string; flag: string | null; matchCount: number }> = [];
    
    tabs.push({
      code: 'TOP',
      name: 'Top Leagues',
      flag: null,
      matchCount: data.topLeagues.matchCount,
    });
    
    for (const country of data.countries) {
      tabs.push({
        code: country.countryCode,
        name: country.countryName,
        flag: country.countryFlag,
        matchCount: country.matchCount,
      });
    }
    
    return tabs;
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
          Upcoming Matches
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i}
              className="flex-shrink-0 h-16 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
          Upcoming Matches
        </h2>
        <div className="text-red-500 dark:text-red-400 text-sm">{error || 'No data available'}</div>
      </div>
    );
  }

  const tabs = getTabs();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
        Upcoming Matches
      </h2>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.code}
            onClick={() => handleTabClick(tab.code)}
            className={`
              flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${activeTab === tab.code 
                ? 'bg-slate-700 dark:bg-slate-700 text-white' 
                : 'bg-slate-800 dark:bg-slate-800/80 text-slate-300 hover:bg-slate-700 dark:hover:bg-slate-700'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {tab.code === 'TOP' ? (
                <Trophy className="h-5 w-5 text-yellow-500" />
              ) : tab.flag ? (
                <img 
                  src={tab.flag} 
                  alt={tab.name} 
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-slate-600 flex items-center justify-center">
                  <span className="text-xs">{tab.name[0]}</span>
                </div>
              )}
              <div className="text-left">
                <div className="font-semibold text-sm whitespace-nowrap">{tab.name}</div>
                <div className="text-xs text-slate-400">{tab.matchCount} Matches</div>
              </div>
            </div>
          </button>
        ))}
        
        <button className="flex-shrink-0 flex items-center justify-center w-10 h-full rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors">
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
