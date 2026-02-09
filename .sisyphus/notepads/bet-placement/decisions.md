# Decisions

## Architecture
- Single bet only (no combo/system)
- Server-authoritative odds (ignore client-provided odds)
- Client sends `oddsId` only; server derives match, selection, odds value
- Idempotency key prevents double-submit
- Settlement: auto via cron for finished matches, 1X2 market only

## Balance
- Real balance first, then bonus if insufficient
- Winnings credit to realBalance
- Refunds proportional to original split (stored in bet metadata)

## Settlement
- 1X2 market: Home win (homeScore > awayScore), Away win (awayScore > homeScore), Draw (equal)
- Other markets stay `pending` for future settlement
- Cancelled/postponed matches → void all pending bets + refund
- Settlement is idempotent (only process `pending` results)
