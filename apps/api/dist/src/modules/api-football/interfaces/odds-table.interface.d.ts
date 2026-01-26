export interface OddsCell {
    label: string;
    odds: number;
    handicap?: string;
    suspended: boolean;
}
export interface MatchOdds {
    home: OddsCell;
    away: OddsCell;
    draw?: OddsCell;
}
export interface TeamInfo {
    id: string;
    name: string;
    shortName?: string;
    logo?: string;
    score: number | null;
}
export interface OddsTableRow {
    fixtureId: number;
    externalId: number;
    leagueId: number;
    leagueName: string;
    country: string;
    matchTime: string;
    startTime: string;
    isLive: boolean;
    status: string;
    period?: string;
    homeTeam: TeamInfo;
    awayTeam: TeamInfo;
    hdp?: MatchOdds;
    overUnder?: MatchOdds;
    oneXTwo?: MatchOdds;
    homeGoalOU?: MatchOdds;
    awayGoalOU?: MatchOdds;
    btts?: MatchOdds;
    htHdp?: MatchOdds;
    htOverUnder?: MatchOdds;
    htOneXTwo?: MatchOdds;
    totalMarkets: number;
}
export interface LeagueOddsGroup {
    leagueId: number;
    leagueName: string;
    country: string;
    countryFlag?: string;
    leagueLogo?: string;
    matches: OddsTableRow[];
}
export interface OddsTableResponse {
    leagues: LeagueOddsGroup[];
    totalMatches: number;
    lastUpdate: string;
}
