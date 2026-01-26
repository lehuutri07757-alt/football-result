import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';

class HomeTeamEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  logoUrl?: string | null;
}

export class HomeLeagueEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false, nullable: true })
  country?: string | null;

  @ApiProperty({ required: false, nullable: true })
  countryCode?: string | null;

  @ApiProperty({ required: false, nullable: true })
  logoUrl?: string | null;

  @ApiProperty()
  liveMatchCount: number;
}

export class OddsSnapshotEntity {
  @ApiProperty()
  betTypeId: string;

  @ApiProperty()
  betTypeCode: string;

  @ApiProperty()
  selection: string;

  @ApiProperty({ required: false, nullable: true })
  handicap?: string | null;

  @ApiProperty()
  oddsValue: string;
}

export class HomeMatchEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  leagueId: string;

  @ApiProperty()
  leagueName: string;

  @ApiProperty()
  startTime: string;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty()
  isLive: boolean;

  @ApiProperty({ required: false, nullable: true })
  liveMinute?: number | null;

  @ApiProperty({ required: false, nullable: true })
  period?: string | null;

  @ApiProperty({ required: false, nullable: true })
  homeScore?: number | null;

  @ApiProperty({ required: false, nullable: true })
  awayScore?: number | null;

  @ApiProperty({ type: HomeTeamEntity })
  homeTeam: HomeTeamEntity;

  @ApiProperty({ type: HomeTeamEntity })
  awayTeam: HomeTeamEntity;
}

export class HomeFeedEntity {
  @ApiProperty({ type: [HomeLeagueEntity] })
  hotLeagues: HomeLeagueEntity[];

  @ApiProperty({ type: [HomeMatchEntity] })
  topLiveMatches: HomeMatchEntity[];

  @ApiProperty({
    description: 'Odds snapshot keyed by matchId',
    type: 'object',
    additionalProperties: { type: 'array', items: { $ref: '#/components/schemas/OddsSnapshotEntity' } },
  })
  oddsSnapshotByMatchId: Record<string, OddsSnapshotEntity[]>;

  @ApiProperty()
  lastUpdate: string;
}

