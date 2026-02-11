"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Wifi,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Calendar as CalendarIcon,
  TableProperties,
} from "lucide-react";
import { MatchCard } from "@/components/matches/MatchCard";
import {
  matchesService,
  leaguesService,
  standingsService,
  Match,
  League,
  StandingTeam,
} from "@/services/match.service";
import { cn } from "@/lib/utils";

type TabType = "live" | "upcoming" | "finished" | "standings";

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingTeam[]>([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState(false);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        setIsLoading(true);
        const data = await leaguesService.getBySlug(slug);
        setLeague(data);
      } catch (err) {
        console.error("Failed to fetch league:", err);
        setError("League not found");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchLeague();
    }
  }, [slug]);

  const fetchMatches = useCallback(async () => {
    if (!league?.id) return;
    if (activeTab === "standings") return;

    setIsLoadingMatches(true);
    try {
      const params: Record<string, unknown> = {
        leagueId: league.id,
        limit: 100,
      };

      if (activeTab === "live") {
        params.isLive = true;
      } else if (activeTab === "upcoming") {
        params.status = "scheduled";
      } else if (activeTab === "finished") {
        params.status = "finished";
      }

      const response = await matchesService.getAll(params);
      setMatches(response.data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [league?.id, activeTab]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (activeTab === "live") {
      const interval = setInterval(fetchMatches, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchMatches]);

  // Fetch standings when standings tab is active
  useEffect(() => {
    if (activeTab !== "standings" || !league?.id) return;
    const fetchStandings = async () => {
      setIsLoadingStandings(true);
      try {
        const response = await standingsService.getByLeagueId(league.id);
        setStandings(response.standings || []);
      } catch (err) {
        console.error("Failed to fetch standings:", err);
        setStandings([]);
      } finally {
        setIsLoadingStandings(false);
      }
    };
    fetchStandings();
  }, [activeTab, league?.id]);

  const matchTabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "upcoming", label: "Upcoming", icon: <CalendarIcon size={14} /> },
    { key: "live", label: "Live Now", icon: <Wifi size={14} /> },
    { key: "finished", label: "Finished", icon: <CheckCircle2 size={14} /> },
    {
      key: "standings",
      label: "Standings",
      icon: <TableProperties size={14} />,
    },
  ];

  const liveCount = matches.filter(
    (m) => m.status === "live" || m.isLive,
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Trophy className="h-16 w-16 text-slate-300 dark:text-slate-600" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          League not found
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          The league you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            {league.logoUrl ? (
              <img
                src={league.logoUrl}
                alt={league.name}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {league.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {league.country && (
                  <>
                    <span>{league.country}</span>
                    {league.season && <span>•</span>}
                  </>
                )}
                {league.season && <span>{league.season}</span>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-900 overflow-x-auto">
            {matchTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                  activeTab === tab.key
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                  tab.key === "live" &&
                    activeTab === "live" &&
                    "text-red-600 dark:text-red-500",
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.key === "live" && liveCount > 0 && (
                  <span
                    className={cn(
                      "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                      "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse",
                    )}
                  >
                    {liveCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">
            {activeTab !== "standings" && (
              <>
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </>
            )}
          </div>
        </div>

        {activeTab === "standings" ? (
          isLoadingStandings ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-slate-500 dark:text-slate-400">
                Loading standings...
              </span>
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <TableProperties className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No standings available
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Standings data has not been synced for this league yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-3 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 w-10">
                      #
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                      Team
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-10">
                      P
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-10">
                      W
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-10">
                      D
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-10">
                      L
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-14 hidden sm:table-cell">
                      GF
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-14 hidden sm:table-cell">
                      GA
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-14 hidden sm:table-cell">
                      GD
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 w-12">
                      Pts
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">
                      Form
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr
                      key={team.team.id}
                      className={cn(
                        "border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        index < 4 && "border-l-2 border-l-emerald-500",
                        index >= standings.length - 3 &&
                          "border-l-2 border-l-red-500",
                      )}
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400">
                        {team.position}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {team.team.logoUrl ? (
                            <img
                              src={team.team.logoUrl}
                              alt={team.team.name}
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700" />
                          )}
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-none">
                            {team.team.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {team.played}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {team.won}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {team.drawn}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">
                        {team.lost}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {team.goalsFor}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {team.goalsAgainst}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        <span
                          className={cn(
                            "font-medium",
                            team.goalDiff > 0 &&
                              "text-emerald-600 dark:text-emerald-400",
                            team.goalDiff < 0 &&
                              "text-red-500 dark:text-red-400",
                          )}
                        >
                          {team.goalDiff > 0 ? "+" : ""}
                          {team.goalDiff}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-slate-900 dark:text-white">
                        {team.points}
                      </td>
                      <td className="px-3 py-2.5 text-center hidden md:table-cell">
                        {team.form ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {team.form
                              .split("")
                              .slice(-5)
                              .map((result, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white",
                                    result === "W" && "bg-emerald-500",
                                    result === "D" && "bg-amber-500",
                                    result === "L" && "bg-red-500",
                                  )}
                                >
                                  {result}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : isLoadingMatches ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-slate-500 dark:text-slate-400">
              Loading matches...
            </span>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <Trophy className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No matches found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {activeTab === "live"
                ? "No live matches at the moment. Check back later!"
                : "No matches available for this filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
