"use client";

import { Trophy, MapPin, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Match, MatchStatus, MatchOddsItem } from "@/services/match.service";
import Link from "next/link";
import { useLiveMatchTime } from "@/hooks/useLiveMatchTime";
import { useBetSlipStore } from "@/stores/betslip.store";
import { useMemo, useCallback } from "react";

interface MatchCardProps {
  match: Match;
  className?: string;
}

export function MatchCard({ match, className }: MatchCardProps) {
  const isLive = match.status === "live" || match.isLive;
  const isFinished = match.status === "finished";
  const { toggleSelection, isSelected } = useBetSlipStore();

  const { displayTime } = useLiveMatchTime({
    startTime: match.startTime,
    period: match.period,
    liveMinute: match.liveMinute,
    isLive,
    status: match.status,
    updateInterval: 1000,
  });

  // Extract 1X2 odds from match.odds
  const oneXTwoOdds = useMemo(() => {
    if (!match.odds || match.odds.length === 0) return null;
    const matchWinnerOdds = match.odds.filter(
      (o) => o.betType?.code === "match_winner",
    );
    if (matchWinnerOdds.length === 0) return null;

    const home = matchWinnerOdds.find((o) => o.selection === "Home");
    const draw = matchWinnerOdds.find((o) => o.selection === "Draw");
    const away = matchWinnerOdds.find((o) => o.selection === "Away");

    return { home, draw, away };
  }, [match.odds]);

  const fixtureId = match.externalId ? parseInt(match.externalId, 10) : 0;
  const matchName = `${match.homeTeam?.name || "Home"} vs ${match.awayTeam?.name || "Away"}`;

  const handleOddsClick = useCallback(
    (e: React.MouseEvent, odds: MatchOddsItem, selectionLabel: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!fixtureId) return;
      toggleSelection({
        fixtureId,
        matchName,
        market: "1X2",
        selection: selectionLabel,
        odds: Number(odds.oddsValue),
        oddsId: odds.id,
      });
    },
    [fixtureId, matchName, toggleSelection],
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case "live":
        return "text-red-500 bg-red-50 dark:bg-red-950/20";
      case "finished":
        return "text-slate-500 bg-slate-100 dark:bg-slate-800";
      case "cancelled":
      case "postponed":
        return "text-orange-500 bg-orange-50 dark:bg-orange-950/20";
      default:
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20";
    }
  };

  const getStatusLabel = (status: MatchStatus) => {
    switch (status) {
      case "live":
        return "LIVE";
      case "finished":
        return "FT";
      case "cancelled":
        return "CNCL";
      case "postponed":
        return "PPD";
      default:
        return "UPCOMING";
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-lg dark:hover:bg-slate-800/50",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {match.league?.logoUrl ? (
            <img
              src={match.league.logoUrl}
              alt={match.league.name}
              className="h-4 w-4 object-contain"
            />
          ) : (
            <Trophy className="h-3.5 w-3.5" />
          )}
          <span className="font-medium truncate max-w-[150px]">
            {match.league?.name || "Unknown League"}
          </span>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            getStatusColor(match.status),
          )}
        >
          {isLive && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current"></span>
            </span>
          )}
          {getStatusLabel(match.status)}
          {isLive && <span className="ml-0.5">{displayTime}</span>}
        </div>
      </div>

      <Link href={`/matches/${match.id}`} className="flex-1 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-muted/50 p-2 group-hover:bg-emerald-500/10 transition-colors">
              {match.homeTeam?.logoUrl ? (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-xs font-bold">
                  {match.homeTeam?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold leading-tight line-clamp-2">
              {match.homeTeam?.name || "Home Team"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {isLive || isFinished ? (
              <div className="flex items-center gap-3 text-2xl font-bold font-mono tracking-tight">
                <span
                  className={cn(
                    match.homeScore! > match.awayScore!
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "",
                  )}
                >
                  {match.homeScore ?? 0}
                </span>
                <span className="text-muted-foreground/50">-</span>
                <span
                  className={cn(
                    match.awayScore! > match.homeScore!
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "",
                  )}
                >
                  {match.awayScore ?? 0}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                <span className="text-xl font-bold tracking-tight">
                  {formatTime(match.startTime)}
                </span>
                <span className="text-[10px] font-medium uppercase">
                  {formatDate(match.startTime)}
                </span>
              </div>
            )}

            {match.league?.country && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <MapPin className="h-3 w-3" />
                <span>{match.league.country}</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-3 text-center">
            <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-muted/50 p-2 group-hover:bg-emerald-500/10 transition-colors">
              {match.awayTeam?.logoUrl ? (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-xs font-bold">
                  {match.awayTeam?.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold leading-tight line-clamp-2">
              {match.awayTeam?.name || "Away Team"}
            </span>
          </div>
        </div>
      </Link>

      {match.bettingEnabled &&
        !["finished", "cancelled", "postponed"].includes(match.status) && (
          <div className="grid grid-cols-3 gap-px border-t bg-border/50">
            {[
              { label: "1", odds: oneXTwoOdds?.home, selection: "Home" },
              { label: "X", odds: oneXTwoOdds?.draw, selection: "Draw" },
              { label: "2", odds: oneXTwoOdds?.away, selection: "Away" },
            ].map(({ label, odds, selection }) => {
              const selected =
                fixtureId > 0 && isSelected(fixtureId, "1X2", selection);
              const oddsValue = odds ? Number(odds.oddsValue).toFixed(2) : "—";
              return (
                <button
                  key={label}
                  onClick={
                    odds
                      ? (e) => handleOddsClick(e, odds, selection)
                      : undefined
                  }
                  disabled={!odds}
                  className={cn(
                    "flex flex-col items-center justify-center bg-card py-2.5 transition-colors",
                    odds
                      ? selected
                        ? "bg-emerald-500 text-white dark:bg-emerald-600"
                        : "hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                      : "opacity-50 cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium mb-0.5",
                      selected ? "text-emerald-100" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  <span className="text-sm font-bold">{oddsValue}</span>
                </button>
              );
            })}
          </div>
        )}

      {(!match.bettingEnabled ||
        ["finished", "cancelled", "postponed"].includes(match.status)) && (
        <div className="flex items-center justify-center gap-2 border-t py-2.5 text-xs text-muted-foreground bg-muted/20">
          <CircleDot className="h-3 w-3" />
          <span>Betting unavailable</span>
        </div>
      )}
    </div>
  );
}
