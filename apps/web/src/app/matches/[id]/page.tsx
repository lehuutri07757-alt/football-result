'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, 
  Calendar, 
  Clock, 
  Trophy, 
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

import { matchesService, Match } from '@/services/match.service';
import { oddsService } from '@/services/odds.service';
import { OddsTableRow, OddsCell, MatchOdds } from '@/types/odds';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

interface BetSelection {
  id: string;
  marketName: string;
  selectionName: string;
  odds: number;
  matchId: string;
  matchName: string;
  handicap?: string;
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [match, setMatch] = useState<Match | null>(null);
  const [odds, setOdds] = useState<OddsTableRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [stake, setStake] = useState<string>('100000');
  
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    setError(null);
    
    try {
      const matchData = await matchesService.getById(id);
      setMatch(matchData);
      
      if (matchData.externalId) {
        const fixtureId = parseInt(matchData.externalId);
        if (!isNaN(fixtureId)) {
          const oddsData = await oddsService.getFixtureOdds(fixtureId);
          setOdds(oddsData);
        }
      }
    } catch (err) {
      console.error('Error fetching match data:', err);
      setError('Failed to load match details. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchData(true);
    }
  }, [id]);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (match?.isLive && !isLoading) {
      intervalId = setInterval(() => {
        fetchData(false);
      }, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [match?.isLive, isLoading]);
  
  const addToBetSlip = (
    marketName: string, 
    selectionName: string, 
    oddsCell: OddsCell
  ) => {
    if (oddsCell.suspended) return;
    
    const selection: BetSelection = {
      id: `${marketName}-${selectionName}`,
      marketName,
      selectionName,
      odds: oddsCell.odds,
      matchId: match?.id || '',
      matchName: `${match?.homeTeam?.name} vs ${match?.awayTeam?.name}`,
      handicap: oddsCell.handicap
    };
    
    setBetSlip([selection]);
  };
  
  const handlePlaceBet = () => {
    alert(`Placing bet: ${formatCurrency(Number(stake))} on ${betSlip[0].selectionName} @ ${betSlip[0].odds}`);
  };
  
  if (isLoading && !match) {
    return <MatchSkeleton />;
  }
  
  if (error || !match) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error Loading Match</h2>
            <p className="text-muted-foreground mb-6">{error || 'Match not found'}</p>
            <Button onClick={() => fetchData(true)}>Retry</Button>
            <div className="mt-4">
              <Link href="/matches" className="text-primary hover:underline text-sm">
                Back to Matches
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const potentialWin = Number(stake) * (betSlip[0]?.odds || 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/matches" className="hover:text-foreground">Matches</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
            {match.homeTeam?.name} vs {match.awayTeam?.name}
          </span>
        </div>
      </div>
      
      <div className="bg-card border-b shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/5 to-slate-950/5 pointer-events-none" />
        
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-center gap-3 mb-8">
            {match.league?.logoUrl ? (
              <img src={match.league.logoUrl} alt={match.league.name} className="h-8 w-8 object-contain" />
            ) : (
              <Trophy className="h-6 w-6 text-emerald-600" />
            )}
            <div className="text-center">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {match.league?.country} • {match.league?.name}
              </h2>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-8">
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-full p-4 shadow-sm border mb-4 flex items-center justify-center">
                {match.homeTeam?.logoUrl ? (
                  <img src={match.homeTeam.logoUrl} alt={match.homeTeam.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground">{match.homeTeam?.name.substring(0, 2)}</div>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold">{match.homeTeam?.name}</h1>
            </div>
            
            <div className="flex flex-col items-center justify-center min-w-[140px]">
              {isLive || isFinished ? (
                <div className="text-5xl md:text-6xl font-bold tracking-tighter mb-2 font-mono tabular-nums">
                  {match.homeScore ?? 0} - {match.awayScore ?? 0}
                </div>
              ) : (
                <div className="text-4xl md:text-5xl font-bold tracking-tighter mb-2 text-muted-foreground">
                  VS
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {isLive ? (
                  <Badge variant="destructive" className="animate-pulse px-3 py-1 text-sm uppercase">
                    Live • {match.liveMinute}'
                  </Badge>
                ) : isFinished ? (
                  <Badge variant="secondary" className="px-3 py-1 text-sm uppercase">
                    Full Time
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-sm uppercase">
                    {format(parseISO(match.startTime), 'HH:mm')}
                  </Badge>
                )}
              </div>
              
              {isLive && isRefreshing && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Updating odds...
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="h-24 w-24 md:h-32 md:w-32 bg-white rounded-full p-4 shadow-sm border mb-4 flex items-center justify-center">
                {match.awayTeam?.logoUrl ? (
                  <img src={match.awayTeam.logoUrl} alt={match.awayTeam.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground">{match.awayTeam?.name.substring(0, 2)}</div>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold">{match.awayTeam?.name}</h1>
            </div>
          </div>
          
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground border-t pt-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(parseISO(match.startTime), 'EEEE, d MMMM yyyy')}</span>
            </div>
            {match.league?.season && (
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span>Season {match.league.season}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Kickoff {format(parseISO(match.startTime), 'HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Betting Markets
              </h2>
            </div>
            
            {!match.bettingEnabled ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3" />
                  <p>Betting is currently disabled for this match.</p>
                </CardContent>
              </Card>
            ) : !odds ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Info className="h-10 w-10 mx-auto mb-3" />
                  <p>No odds available at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto mb-6 bg-transparent p-0 gap-2 h-auto">
                  <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white border px-4 py-2 h-auto rounded-full">All Markets</TabsTrigger>
                  <TabsTrigger value="main" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white border px-4 py-2 h-auto rounded-full">Main</TabsTrigger>
                  <TabsTrigger value="goals" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white border px-4 py-2 h-auto rounded-full">Goals</TabsTrigger>
                  <TabsTrigger value="half" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white border px-4 py-2 h-auto rounded-full">1st Half</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  <MarketGroup title="Match Result (1X2)" market={odds.oneXTwo} 
                    type="1x2" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away', draw: 'Draw' }} 
                  />
                  
                  <MarketGroup title="Asian Handicap" market={odds.hdp} 
                    type="handicap" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away' }}
                  />
                  
                  <MarketGroup title="Over/Under" market={odds.overUnder} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                  
                  <MarketGroup title="Both Teams To Score" market={odds.btts} 
                    type="btts" onSelect={addToBetSlip} 
                    labels={{ home: 'Yes', away: 'No' }}
                  />

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4 text-muted-foreground">Half Time Markets</h3>
                    <div className="space-y-4">
                      <MarketGroup title="HT Match Result" market={odds.htOneXTwo} 
                        type="1x2" onSelect={addToBetSlip} 
                        labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away', draw: 'Draw' }}
                      />
                      <MarketGroup title="HT Handicap" market={odds.htHdp} 
                        type="handicap" onSelect={addToBetSlip} 
                        labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away' }}
                      />
                      <MarketGroup title="HT Over/Under" market={odds.htOverUnder} 
                        type="ou" onSelect={addToBetSlip} 
                        labels={{ home: 'Over', away: 'Under' }}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="main" className="space-y-4">
                  <MarketGroup title="Match Result (1X2)" market={odds.oneXTwo} 
                    type="1x2" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away', draw: 'Draw' }} 
                  />
                  <MarketGroup title="Asian Handicap" market={odds.hdp} 
                    type="handicap" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away' }}
                  />
                  <MarketGroup title="Over/Under" market={odds.overUnder} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                </TabsContent>

                <TabsContent value="goals" className="space-y-4">
                  <MarketGroup title="Over/Under" market={odds.overUnder} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                  <MarketGroup title="Home Team O/U" market={odds.homeGoalOU} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                  <MarketGroup title="Away Team O/U" market={odds.awayGoalOU} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                  <MarketGroup title="Both Teams To Score" market={odds.btts} 
                    type="btts" onSelect={addToBetSlip} 
                    labels={{ home: 'Yes', away: 'No' }}
                  />
                </TabsContent>
                
                <TabsContent value="half" className="space-y-4">
                  <MarketGroup title="HT Match Result" market={odds.htOneXTwo} 
                    type="1x2" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away', draw: 'Draw' }}
                  />
                  <MarketGroup title="HT Handicap" market={odds.htHdp} 
                    type="handicap" onSelect={addToBetSlip} 
                    labels={{ home: match.homeTeam?.name || 'Home', away: match.awayTeam?.name || 'Away' }}
                  />
                  <MarketGroup title="HT Over/Under" market={odds.htOverUnder} 
                    type="ou" onSelect={addToBetSlip} 
                    labels={{ home: 'Over', away: 'Under' }}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
          
          <div className="space-y-6">
            <Card className="sticky top-4 border-emerald-500/20 shadow-lg">
              <CardHeader className="bg-emerald-500/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <div className="bg-emerald-500 text-white p-1 rounded">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Bet Slip
                </CardTitle>
                <CardDescription>
                  {betSlip.length > 0 ? 'Review your selection' : 'Select odds to place a bet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {betSlip.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-sm">Click on any odds to add selection</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {betSlip.map((selection) => (
                      <div key={selection.id} className="bg-muted/50 p-3 rounded-md border relative group">
                        <button 
                          onClick={() => setBetSlip([])}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        <div className="text-xs text-muted-foreground mb-1">{selection.marketName}</div>
                        <div className="font-bold flex justify-between items-center">
                          <span className="text-sm">{selection.selectionName} {selection.handicap && `(${selection.handicap})`}</span>
                          <Badge variant="outline" className="bg-background font-mono text-emerald-600 border-emerald-200">
                            {selection.odds.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{selection.matchName}</div>
                      </div>
                    ))}
                    
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="stake">Stake Amount</Label>
                      <div className="relative">
                        <Input 
                          id="stake"
                          type="number" 
                          value={stake} 
                          onChange={(e) => setStake(e.target.value)}
                          className="pl-8 font-mono"
                        />
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₫</span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        {['50000', '100000', '500000', '1000000'].map((amt) => (
                          <button 
                            key={amt}
                            onClick={() => setStake(amt)}
                            className="bg-muted px-2 py-1 rounded hover:bg-muted/80 transition-colors"
                          >
                            {Number(amt) / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-emerald-500/10 p-3 rounded-md flex justify-between items-center">
                      <span className="text-sm font-medium">Potential Win</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(potentialWin)}</span>
                    </div>
                    
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-700" 
                      onClick={handlePlaceBet}
                      disabled={!betSlip.length || !stake || Number(stake) <= 0}
                    >
                      Place Bet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Head to Head</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span>Wins</span>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-emerald-600">3</span>
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 w-[60%]"></div>
                        <div className="h-full bg-slate-300 w-[20%]"></div>
                        <div className="h-full bg-red-500 w-[20%]"></div>
                      </div>
                      <span className="font-bold text-red-600">1</span>
                    </div>
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    Last 5 matches: {match.homeTeam?.name} won 3, {match.awayTeam?.name} won 1, 1 Draw
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketGroup({ 
  title, 
  market, 
  type, 
  onSelect, 
  labels 
}: { 
  title: string; 
  market?: MatchOdds; 
  type: '1x2' | 'handicap' | 'ou' | 'btts'; 
  onSelect: (market: string, selection: string, odds: OddsCell) => void;
  labels: { home: string, away: string, draw?: string }
}) {
  if (!market) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted/40 px-4 py-2 text-sm font-medium flex justify-between items-center border-b">
        <span>{title}</span>
        {market.home.handicap && <Badge variant="outline" className="text-xs font-normal">{market.home.handicap}</Badge>}
      </div>
      <CardContent className="p-0">
        <div className={`grid ${type === '1x2' ? 'grid-cols-3' : 'grid-cols-2'} divide-x`}>
          <OddsButton 
            label={labels.home} 
            value={market.home} 
            onClick={() => onSelect(title, labels.home, market.home)} 
          />
          {type === '1x2' && market.draw && (
            <OddsButton 
              label={labels.draw!} 
              value={market.draw} 
              onClick={() => onSelect(title, labels.draw!, market.draw!)} 
            />
          )}
          <OddsButton 
            label={labels.away} 
            value={market.away} 
            onClick={() => onSelect(title, labels.away, market.away)} 
          />
        </div>
      </CardContent>
    </Card>
  );
}

function OddsButton({ label, value, onClick }: { label: string, value: OddsCell, onClick: () => void }) {
  const isSuspended = value.suspended;
  
  return (
    <button
      onClick={onClick}
      disabled={isSuspended}
      className={`
        flex flex-col items-center justify-center py-4 px-2 hover:bg-emerald-500/5 transition-colors
        ${isSuspended ? 'opacity-50 cursor-not-allowed bg-muted/20' : 'cursor-pointer active:bg-emerald-500/10'}
      `}
    >
      <span className="text-xs text-muted-foreground mb-1 truncate max-w-full px-1">{label}</span>
      <div className="flex items-center gap-1">
        <span className={`font-bold font-mono ${isSuspended ? 'text-muted-foreground' : 'text-emerald-600'}`}>
          {isSuspended ? '-' : value.odds.toFixed(2)}
        </span>
        {value.handicap && (
          <span className="text-xs text-muted-foreground font-mono">
            {value.handicap}
          </span>
        )}
      </div>
    </button>
  );
}

function MatchSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="h-12 border-b bg-muted/30 mb-0" />
      <div className="bg-card border-b shadow-sm py-12 mb-8">
        <div className="container mx-auto px-4 flex justify-between items-center max-w-4xl">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
