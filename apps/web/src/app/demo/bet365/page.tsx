'use client';

import { Bet365MatchList } from '@/components/bet365';
import { Bet365MatchListData } from '@/types/bet365';

const MOCK_DATA: Bet365MatchListData = {
  leagues: [
    {
      id: 'spain-copa-del-rey',
      name: 'Copa del Rey',
      country: 'Spain',
      dateGroups: [
        {
          date: '2025-02-05',
          matches: [
            {
              id: '1',
              startTime: '2025-02-05T03:00:00Z',
              status: 'scheduled',
              homeTeam: { id: 'valencia', name: 'Valencia' },
              awayTeam: { id: 'athletic', name: 'Athletic Club' },
              odds: {
                home: { value: 2.57 },
                draw: { value: 3.00 },
                away: { value: 2.50 },
              },
              totalMarkets: 6,
              hasStats: false,
              hasStream: true,
            },
            {
              id: '2',
              startTime: '2025-02-05T03:00:00Z',
              status: 'scheduled',
              homeTeam: { id: 'alaves', name: 'CD Alaves' },
              awayTeam: { id: 'sociedad', name: 'Real Sociedad' },
              odds: {
                home: { value: 2.82 },
                draw: { value: 3.10 },
                away: { value: 2.50 },
              },
              totalMarkets: 7,
              hasStats: true,
              hasStream: true,
            },
          ],
        },
        {
          date: '2025-02-06',
          matches: [
            {
              id: '3',
              startTime: '2025-02-06T03:00:00Z',
              status: 'scheduled',
              homeTeam: { id: 'betis', name: 'Real Betis' },
              awayTeam: { id: 'atletico', name: 'Atletico Madrid' },
              odds: {
                home: { value: 3.30 },
                draw: { value: 3.50 },
                away: { value: 2.05 },
              },
              totalMarkets: 9,
              hasStats: true,
              hasStream: true,
            },
          ],
        },
      ],
    },
  ],
};

export default function Bet365DemoPage() {
  const handleMatchClick = (matchId: string) => {
    console.log('Match clicked:', matchId);
  };

  const handleOddsClick = (matchId: string, selection: 'home' | 'draw' | 'away') => {
    console.log('Odds clicked:', { matchId, selection });
  };

  const handleMarketsClick = (matchId: string) => {
    console.log('Markets clicked:', matchId);
  };

  const handleLeagueClick = (leagueId: string) => {
    console.log('League clicked:', leagueId);
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      <div className="max-w-4xl mx-auto py-4">
        <Bet365MatchList
          data={MOCK_DATA}
          onMatchClick={handleMatchClick}
          onOddsClick={handleOddsClick}
          onMarketsClick={handleMarketsClick}
          onLeagueClick={handleLeagueClick}
        />
      </div>
    </div>
  );
}
