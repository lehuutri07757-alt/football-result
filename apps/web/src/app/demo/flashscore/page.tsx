'use client';

import { FlashscoreMatchList } from '@/components/flashscore';
import { FlashscoreMatchListData } from '@/types/flashscore';

const MOCK_DATA: FlashscoreMatchListData = {
  leagues: [
    {
      id: 'uefa-youth-league',
      name: 'UEFA Youth League',
      country: 'Europe',
      countryCode: 'EU',
      logo: '/leagues/uefa-youth-league.png',
      matches: [
        {
          id: '1',
          startTime: new Date().toISOString(),
          matchMinute: 34,
          period: '1st half',
          round: 'Play-off. Round of 32',
          status: 'live',
          homeTeam: {
            id: 'hjk',
            name: 'HJK Helsinki U19',
            logo: '/teams/hjk.png',
            score: 1,
            halfTimeScore: 1,
          },
          awayTeam: {
            id: 'mancity',
            name: 'Manchester City U19',
            logo: '/teams/mancity.png',
            score: 1,
            halfTimeScore: 1,
          },
          oneXTwo: {
            home: { value: 8.07, suspended: false },
            draw: { value: 4.09, suspended: false },
            away: { value: 1.46, suspended: false },
          },
          doubleChance: {
            homeOrDraw: { value: 2.685, suspended: false },
            homeOrAway: { value: 1.24, suspended: false },
            awayOrDraw: { value: 1.085, suspended: false },
          },
          totalMarkets: 453,
          isFavorite: false,
          hasStats: true,
          hasLineup: true,
          hasAnalysis: true,
        },
        {
          id: '2',
          startTime: new Date().toISOString(),
          matchMinute: 34,
          period: '1st half',
          round: 'Play-off. Round of 32',
          status: 'live',
          homeTeam: {
            id: 'maccabi',
            name: 'Maccabi Haifa U19',
            logo: '/teams/maccabi.png',
            score: 0,
            halfTimeScore: 0,
          },
          awayTeam: {
            id: 'barcelona',
            name: 'Barcelona U19',
            logo: '/teams/barcelona.png',
            score: 0,
            halfTimeScore: 0,
          },
          oneXTwo: {
            home: { value: 8.07, suspended: false },
            draw: { value: 4.09, suspended: false },
            away: { value: 1.46, suspended: false },
          },
          doubleChance: {
            homeOrDraw: { value: 2.685, suspended: false },
            homeOrAway: { value: 1.24, suspended: false },
            awayOrDraw: { value: 1.085, suspended: false },
          },
          totalMarkets: 493,
          isFavorite: true,
          hasStats: true,
          hasLineup: true,
          hasAnalysis: true,
        },
        {
          id: '3',
          startTime: new Date().toISOString(),
          matchMinute: 35,
          period: '1st half',
          round: 'Play-off. Round of 32',
          status: 'live',
          homeTeam: {
            id: 'benfica',
            name: 'S.L. Benfica U19',
            logo: '/teams/benfica.png',
            score: 1,
            halfTimeScore: 1,
          },
          awayTeam: {
            id: 'slavia',
            name: 'Slavia Prague U19',
            logo: '/teams/slavia.png',
            score: 1,
            halfTimeScore: 1,
          },
          oneXTwo: {
            home: { value: 1.35, suspended: false },
            draw: { value: 5.11, suspended: false },
            away: { value: 8.6, suspended: false },
          },
          doubleChance: {
            homeOrDraw: { value: 1.08, suspended: false },
            homeOrAway: { value: 1.17, suspended: false },
            awayOrDraw: { value: 3.1, suspended: false },
          },
          totalMarkets: 464,
          isFavorite: false,
          hasStats: true,
          hasLineup: true,
          hasAnalysis: true,
        },
        {
          id: '4',
          startTime: new Date().toISOString(),
          matchMinute: 36,
          period: '1st half',
          round: 'Play-off. Round of 32',
          status: 'live',
          homeTeam: {
            id: 'villarreal',
            name: 'Villarreal U19',
            logo: '/teams/villarreal.png',
            score: 1,
            halfTimeScore: 1,
          },
          awayTeam: {
            id: 'leverkusen',
            name: 'Bayer 04 Leverkusen U19',
            logo: '/teams/leverkusen.png',
            score: 2,
            halfTimeScore: 2,
          },
          oneXTwo: {
            home: { value: 4.33, suspended: false },
            draw: { value: 3.34, suspended: false },
            away: { value: 1.915, suspended: false },
          },
          doubleChance: {
            homeOrDraw: { value: 1.875, suspended: false },
            homeOrAway: { value: 1.33, suspended: false },
            awayOrDraw: { value: 1.22, suspended: false },
          },
          totalMarkets: 449,
          isFavorite: false,
          hasStats: true,
          hasLineup: true,
          hasAnalysis: true,
        },
        {
          id: '5',
          startTime: new Date(Date.now() + 3600000).toISOString(),
          period: undefined,
          round: 'Play-off. Round of 32',
          status: 'scheduled',
          homeTeam: {
            id: 'puskas',
            name: 'Puskas Akademia U19',
            logo: '/teams/puskas.png',
            score: 0,
            halfTimeScore: 0,
          },
          awayTeam: {
            id: 'sporting',
            name: 'Sporting U19',
            logo: '/teams/sporting.png',
            score: 0,
            halfTimeScore: 0,
          },
          oneXTwo: {
            home: { value: 9.13, suspended: false },
            draw: { value: 5.33, suspended: false },
            away: { value: 1.325, suspended: false },
          },
          doubleChance: {
            homeOrDraw: { value: 3.32, suspended: false },
            homeOrAway: { value: 1.16, suspended: false },
            awayOrDraw: { value: 1.065, suspended: false },
          },
          totalMarkets: 554,
          isFavorite: false,
          hasStats: true,
          hasLineup: false,
          hasAnalysis: true,
        },
      ],
    },
  ],
  totalMatches: 5,
  lastUpdate: new Date().toISOString(),
};

export default function FlashscoreDemoPage() {
  const handleFavoriteToggle = (matchId: string) => {
    console.log('Toggle favorite:', matchId);
  };

  const handleMatchClick = (matchId: string) => {
    console.log('Match clicked:', matchId);
  };

  const handleOddsClick = (matchId: string, market: string, selection: string) => {
    console.log('Odds clicked:', { matchId, market, selection });
  };

  const handleMarketsClick = (matchId: string) => {
    console.log('Markets clicked:', matchId);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Flashscore-style Match List Demo</h1>
      <FlashscoreMatchList
        data={MOCK_DATA}
        title="Live Matches"
        onFavoriteToggle={handleFavoriteToggle}
        onMatchClick={handleMatchClick}
        onOddsClick={handleOddsClick}
        onMarketsClick={handleMarketsClick}
      />
    </div>
  );
}
