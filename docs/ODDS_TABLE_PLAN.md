# Plan: Bảng Tỷ Lệ Kèo (Odds Table)

## Mục tiêu
Xây dựng bảng tỷ lệ kèo chi tiết hiển thị các loại kèo cá cược bóng đá theo thời gian thực, bao gồm cả trận đấu sắp diễn ra và đang diễn ra (live).

---

## 1. API Endpoints cần sử dụng (API-Football v3)

### 1.1. Lấy danh sách trận đấu
```
GET https://v3.football.api-sports.io/fixtures
```

| Parameter | Mô tả | Ví dụ |
|-----------|-------|-------|
| `live` | Lấy tất cả trận đang diễn ra | `live=all` hoặc `live=39-61-48` (theo league) |
| `date` | Lấy theo ngày | `date=2024-01-15` |
| `league` | Lọc theo giải đấu | `league=135` (Serie A) |
| `season` | Mùa giải | `season=2024` |
| `next` | X trận tiếp theo | `next=15` |

**Response Structure:**
```typescript
interface FixtureResponse {
  fixture: {
    id: number;
    status: {
      long: string;    // "First Half", "Halftime", "Second Half"
      short: string;   // "1H", "HT", "2H", "FT"
      elapsed: number; // Phút đã chơi
    };
  };
  league: {
    id: number;
    name: string;     // "Serie A"
    country: string;  // "Italy"
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null; };
    away: { id: number; name: string; logo: string; winner: boolean | null; };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null; };
    fulltime: { home: number | null; away: number | null; };
  };
}
```

### 1.2. Lấy tỷ lệ kèo Pre-Match
```
GET https://v3.football.api-sports.io/odds
```

| Parameter | Mô tả | Ví dụ |
|-----------|-------|-------|
| `fixture` | ID trận đấu | `fixture=215662` |
| `bookmaker` | Nhà cái | `bookmaker=6` (Bwin) |
| `bet` | Loại cược | `bet=1` (Match Winner) |
| `league` + `season` | Lọc theo giải | `league=39&season=2024` |

### 1.3. Lấy tỷ lệ kèo Live
```
GET https://v3.football.api-sports.io/odds/live
```

| Parameter | Mô tả | Ví dụ |
|-----------|-------|-------|
| `fixture` | ID trận đấu | `fixture=721238` |

**Response Structure:**
```typescript
interface OddsResponse {
  fixture: {
    id: number;
    status: {
      elapsed: number;
      seconds: string;  // "62:14"
    };
  };
  teams: {
    home: { id: number; goals: number; };
    away: { id: number; goals: number; };
  };
  odds: OddsMarket[];
}

interface OddsMarket {
  id: number;
  name: string;
  values: OddsValue[];
}

interface OddsValue {
  value: string;      // "Home", "Away", "Over", "Under", "Yes", "No"
  odd: string;        // "1.85"
  handicap: string | null;  // "-0.5", "2.5"
  main: boolean | null;     // true = primary line
  suspended: boolean;       // true = không thể đặt cược
}
```

---

## 2. Các loại kèo cần hiển thị

### 2.1. Bảng kèo chính (Full Time)

| Cột | Tên API | Bet ID | Mô tả |
|-----|---------|--------|-------|
| **HDP** | Asian Handicap | 33 | Kèo chấp châu Á |
| **O/U** | Over/Under | 2 | Tài xỉu tổng bàn thắng |
| **1X2** | Match Winner | 1 | Thắng/Hòa/Thua |
| **Home Goal O/U** | Total - Home | 16 | Tài xỉu bàn thắng đội nhà |
| **Away Goal O/U** | Total - Away | 17 | Tài xỉu bàn thắng đội khách |
| **BTTS** | Both Teams to Score | 69 | Cả 2 đội ghi bàn |

### 2.2. Bảng kèo hiệp 1 (Half Time) - Chỉ hiển thị khi trận live

| Cột | Tên API | Mô tả |
|-----|---------|-------|
| **HT HDP** | Asian Handicap (First Half) | Kèo chấp hiệp 1 |
| **HT O/U** | Over/Under (First Half) | Tài xỉu hiệp 1 |
| **HT 1X2** | 1X2 (First Half) | 1X2 hiệp 1 |

---

## 3. Cấu trúc dữ liệu Frontend

### 3.1. Types/Interfaces

```typescript
// types/odds.ts

export enum OddsMarketType {
  ASIAN_HANDICAP = 'asian_handicap',
  OVER_UNDER = 'over_under',
  MATCH_WINNER = 'match_winner',
  HOME_TOTAL = 'home_total',
  AWAY_TOTAL = 'away_total',
  BTTS = 'btts',
}

export interface OddsCell {
  label: string;      // "+0.5", "O 2.5", "H"
  odds: number;       // 1.85
  handicap?: string;  // "-0.5"
  suspended: boolean;
}

export interface MatchOdds {
  homeTeam: OddsCell;
  awayTeam: OddsCell;
  draw?: OddsCell;    // Chỉ cho 1X2
}

export interface OddsTableRow {
  fixtureId: number;
  leagueName: string;
  leagueId: number;
  matchTime: string;           // "68:40" hoặc "15:00"
  isLive: boolean;
  homeTeam: {
    name: string;
    score: number | null;
    logo: string;
  };
  awayTeam: {
    name: string;
    score: number | null;
    logo: string;
  };
  // Kèo Full Time
  hdp: MatchOdds;
  overUnder: MatchOdds;
  oneXTwo: MatchOdds;
  homeGoalOU: MatchOdds;
  awayGoalOU: MatchOdds;
  btts: MatchOdds;
  // Kèo Half Time (live only)
  htHdp?: MatchOdds;
  htOverUnder?: MatchOdds;
  htOneXTwo?: MatchOdds;
  // Metadata
  totalMarkets: number;        // Số lượng kèo khác có sẵn
}

export interface LeagueOddsGroup {
  leagueId: number;
  leagueName: string;
  country: string;
  matches: OddsTableRow[];
}
```

### 3.2. API Service

```typescript
// services/odds.service.ts

import api from './api';

export interface GetOddsParams {
  date?: string;
  live?: boolean;
  leagueIds?: number[];
}

export const oddsService = {
  // Lấy fixtures + odds
  getMatchesWithOdds: (params: GetOddsParams) =>
    api.get('/odds/matches', { params }),

  // Lấy odds cho 1 trận cụ thể
  getFixtureOdds: (fixtureId: number) =>
    api.get(`/odds/fixture/${fixtureId}`),

  // Lấy live odds (WebSocket hoặc polling)
  getLiveOdds: (fixtureIds: number[]) =>
    api.get('/odds/live', { params: { fixtures: fixtureIds.join(',') } }),
};
```

---

## 4. Cấu trúc Backend Service

### 4.1. Module Structure

```
modules/odds/
├── odds.module.ts
├── odds.controller.ts
├── odds.service.ts
├── dto/
│   ├── query-odds.dto.ts
│   └── index.ts
├── entities/
│   └── odds.entity.ts
├── interfaces/
│   └── api-football.interface.ts
└── constants/
    └── odds.constants.ts
```

### 4.2. Constants - Bet IDs

```typescript
// modules/odds/constants/odds.constants.ts

export const API_FOOTBALL_BET_IDS = {
  // Full Time
  MATCH_WINNER: 1,           // 1X2
  OVER_UNDER: 2,             // O/U tổng bàn
  ASIAN_HANDICAP: 33,        // Kèo chấp
  HOME_TOTAL: 16,            // O/U đội nhà
  AWAY_TOTAL: 17,            // O/U đội khách
  BTTS: 69,                  // Both Teams to Score
  
  // First Half
  HT_MATCH_WINNER: 13,       // 1X2 hiệp 1
  HT_OVER_UNDER: 8,          // O/U hiệp 1
  HT_ASIAN_HANDICAP: 14,     // Kèo chấp hiệp 1
  
  // Live specific
  ASIAN_HANDICAP_LIVE: 33,
  OVER_UNDER_LIVE: 2,
} as const;

export const DEFAULT_BOOKMAKER_ID = 8; // Bet365
```

### 4.3. Service Logic

```typescript
// modules/odds/odds.service.ts

@Injectable()
export class OddsService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async getMatchesWithOdds(query: QueryOddsDto): Promise<LeagueOddsGroup[]> {
    // 1. Fetch fixtures
    const fixtures = await this.fetchFixtures(query);
    
    // 2. Fetch odds for each fixture (batch if possible)
    const fixtureIds = fixtures.map(f => f.fixture.id);
    const oddsData = await this.fetchOdds(fixtureIds);
    
    // 3. Merge và transform data
    const matchesWithOdds = this.mergeFixturesWithOdds(fixtures, oddsData);
    
    // 4. Group by league
    return this.groupByLeague(matchesWithOdds);
  }

  private async fetchFixtures(query: QueryOddsDto) {
    const params: Record<string, any> = {};
    
    if (query.live) {
      params.live = 'all';
    } else if (query.date) {
      params.date = query.date;
    }
    
    if (query.leagueIds?.length) {
      params.league = query.leagueIds.join('-');
    }

    const response = await this.httpService.axiosRef.get(
      'https://v3.football.api-sports.io/fixtures',
      {
        params,
        headers: { 'x-apisports-key': this.configService.get('API_FOOTBALL_KEY') },
      }
    );
    
    return response.data.response;
  }

  private parseOddsMarket(odds: any[], betId: number): MatchOdds | null {
    const market = odds.find(o => o.id === betId);
    if (!market) return null;

    const values = market.values;
    // Parse based on bet type...
    // Implementation depends on bet type
  }
}
```

---

## 5. Giao diện Component

### 5.1. Component Structure

```
components/odds/
├── OddsTable/
│   ├── OddsTable.tsx           # Main container
│   ├── OddsTableHeader.tsx     # Column headers
│   ├── OddsTableRow.tsx        # Row trận đấu
│   └── OddsCell.tsx            # Cell hiển thị odds
├── OddsLeagueGroup/
│   └── OddsLeagueGroup.tsx     # Group theo giải đấu
└── hooks/
    └── useOdds.ts              # React Query hooks
```

### 5.2. OddsTable Component

```tsx
// components/odds/OddsTable/OddsTable.tsx

interface OddsTableProps {
  date?: string;
  live?: boolean;
  leagueIds?: number[];
}

export function OddsTable({ date, live, leagueIds }: OddsTableProps) {
  const { data, isLoading } = useOdds({ date, live, leagueIds });

  if (isLoading) return <OddsTableSkeleton />;

  return (
    <div className="odds-table">
      {data?.map((leagueGroup) => (
        <OddsLeagueGroup key={leagueGroup.leagueId} {...leagueGroup} />
      ))}
    </div>
  );
}
```

### 5.3. Cấu trúc hiển thị từng row

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Italy Serie A                                         HDP    O/U     1X2    Home O/U  Away O/U  BTTS │
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 🔴 68:40                                                                                   [201>]│
│ 0  Pisa SC          [logo]                          +0/0.5   O 1.5    H      Over 0.5  Over 1.5   Yes │
│                                                      1.68    1.79   45.0      3.32      2.36    3.50 │
│ 1  Como 1907        [logo]                          -0/0.5   U 1.5    A     Under 0.5  Under 1.5  No  │
│                                                      2.28    2.09    1.18     1.25      1.55    1.27 │
│    ⚽ 0-0  📊 1-5                                              D                                       │
│                                                               6.25                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Caching Strategy

### 6.1. Redis Cache

```typescript
// Cache keys
const CACHE_KEYS = {
  FIXTURES_BY_DATE: (date: string) => `fixtures:${date}`,
  LIVE_FIXTURES: 'fixtures:live',
  ODDS_BY_FIXTURE: (id: number) => `odds:fixture:${id}`,
  LIVE_ODDS: (id: number) => `odds:live:${id}`,
};

// TTL
const CACHE_TTL = {
  FIXTURES: 60 * 5,        // 5 phút
  LIVE_FIXTURES: 30,       // 30 giây
  ODDS: 60 * 3,            // 3 phút
  LIVE_ODDS: 10,           // 10 giây
};
```

### 6.2. WebSocket cho Live Odds

```typescript
// Gateway cho realtime updates
@WebSocketGateway()
export class OddsGateway {
  @SubscribeMessage('subscribe:live-odds')
  async handleSubscribe(client: Socket, fixtureIds: number[]) {
    // Join rooms
    fixtureIds.forEach(id => client.join(`odds:${id}`));
  }

  // Emit updates khi có odds mới
  emitOddsUpdate(fixtureId: number, odds: MatchOdds) {
    this.server.to(`odds:${fixtureId}`).emit('odds:update', { fixtureId, odds });
  }
}
```

---

## 7. Tasks Implementation

### Phase 1: Backend Core
- [ ] Tạo `odds` module với structure
- [ ] Implement API-Football integration service
- [ ] Tạo DTOs và interfaces
- [ ] Implement transform logic từ API response sang internal format
- [ ] Thêm Redis caching

### Phase 2: Backend API
- [ ] Tạo endpoints: `GET /odds/matches`, `GET /odds/fixture/:id`
- [ ] Implement live odds endpoint
- [ ] WebSocket gateway cho realtime updates

### Phase 3: Frontend Core
- [ ] Tạo types/interfaces
- [ ] Implement odds service
- [ ] Tạo React Query hooks

### Phase 4: Frontend UI
- [ ] OddsTable component
- [ ] OddsCell component với styling
- [ ] LeagueGroup component
- [ ] Responsive design
- [ ] Loading states & skeletons

### Phase 5: Enhancement
- [ ] Odds movement indicators (↑↓)
- [ ] Favorite matches
- [ ] Filter by league/time
- [ ] Sound notification cho odds changes

---

## 8. API Rate Limits & Optimization

### API-Football Limits
- Free: 100 requests/day
- Pro: Depends on plan

### Optimization Strategies
1. **Batch requests**: Gộp nhiều fixture IDs trong 1 request
2. **Cache aggressively**: Pre-match odds ít thay đổi
3. **Differential updates**: Chỉ fetch thay đổi cho live odds
4. **Background sync**: Cron job refresh data định kỳ

---

## 9. Notes

### Xử lý Asian Handicap Display
```typescript
// Handicap format: "-0.5", "-0/0.5", "+1.5"
function formatHandicap(handicap: string): string {
  if (handicap.includes('/')) {
    // Quarter line: -0/0.5 -> -0.25
    const [first, second] = handicap.split('/').map(Number);
    return ((first + second) / 2).toString();
  }
  return handicap;
}
```

### Suspended Odds Handling
- Hiển thị với style mờ (opacity: 0.5)
- Không cho phép click/đặt cược
- Tooltip: "Tạm khóa"
