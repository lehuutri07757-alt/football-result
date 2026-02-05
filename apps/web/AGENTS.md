# WEB FRONTEND

Next.js 14 App Router + TailwindCSS + shadcn/ui + Zustand.

## STRUCTURE

```
web/src/
├── app/                    # App Router
│   ├── layout.tsx          # Root layout + providers
│   ├── providers.tsx       # Theme, query client
│   ├── globals.css         # Tailwind + custom CSS
│   ├── admin/              # Admin routes (15+)
│   ├── dashboard/          # User dashboard
│   ├── live/               # Live matches
│   ├── matches/            # Match list + detail
│   ├── wallet/             # Deposits/withdrawals
│   └── demo/               # UI demos (bet365, flashscore)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── admin/              # Admin-specific
│   ├── odds/               # Odds display variants
│   ├── bet365/             # bet365-style UI
│   ├── flashscore/         # Flashscore-style UI
│   ├── mobile/             # Mobile-specific
│   ├── matches/            # Match cards
│   └── dashboard/          # Dashboard widgets
├── services/               # API clients (11)
├── stores/                 # Zustand stores (3)
├── hooks/                  # Custom hooks
├── types/                  # TypeScript interfaces
├── contexts/               # React contexts
└── lib/                    # Utils (i18n, date, search)
```

## API SERVICE PATTERN

```typescript
// services/api.ts - base axios client
import api from './api';

// services/{domain}.service.ts
export const matchService = {
  getAll: (params) => api.get('/matches', { params }),
  getById: (id) => api.get(`/matches/${id}`),
};
```

## ZUSTAND STORES

| Store | Purpose | Key State |
|-------|---------|-----------|
| `auth.store.ts` | User session | `user`, `isAuthenticated`, `login()`, `logout()` |
| `language.store.ts` | i18n | `language`, `setLanguage()` |
| `betslip.store.ts` | Bet cart | `selections`, `addSelection()`, `removeSelection()` |

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new page | `app/{route}/page.tsx` |
| Add admin page | `app/admin/{route}/page.tsx` |
| New UI component | `components/ui/` (shadcn pattern) |
| New API service | `services/{domain}.service.ts` |
| New type/interface | `types/{domain}.ts` |
| Global state | `stores/{domain}.store.ts` |

## TOKEN HANDLING

```typescript
// services/api.ts - auto-attached + auto-refresh
// Access token: localStorage.getItem('accessToken')
// Refresh: POST /api/auth/refresh on 401
```

## DEMO UIs

- `/demo/bet365` - bet365-inspired odds table
- `/demo/flashscore` - Flashscore-inspired UI

## ANTI-PATTERNS

- Don't put interfaces in service files - use `types/`
- Don't call `api` directly in components - use services
- Don't access localStorage server-side - check `typeof window`
- Don't skip loading/error states in data fetching
