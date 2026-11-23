import React, {useMemo, useState} from 'react';
import {Search, X} from 'lucide-react';
import type {TimezoneMode} from '../config/competition';
import {
  ALL_STAGE_ORDER,
  formatKickoffTime,
  STAGE_LABELS,
  STATUS_LABELS,
} from '../domain/knockoutEngine';
import type {
  CompetitionStage,
  KnockoutMatch,
  KnockoutSnapshot,
  KnockoutTie,
  MatchStatus,
} from '../types/knockout';
import {TeamMonogram} from './TeamMonogram';

interface FixturesTableProps {
  snapshot: KnockoutSnapshot;
  timezoneMode: TimezoneMode;
  onSelectTie: (tie: KnockoutTie) => void;
  onSelectMatch: (match: KnockoutMatch) => void;
  onOpenKnockoutView: () => void;
}

const FILTERABLE_STATUSES: MatchStatus[] = [
  'SCHEDULED',
  'TIMED',
  'IN_PLAY',
  'PAUSED',
  'FINISHED',
  'POSTPONED',
  'SUSPENDED',
  'CANCELLED',
  'AWARDED',
];

function formatMatchScoreCell(match: KnockoutMatch): {primary: string; detail: string | null} {
  if (match.score.isScoreAmbiguous) {
    return {primary: 'Unresolved', detail: 'Score breakdown requires verification'};
  }
  const open = match.score.openPlay;
  if (!open || open.home == null || open.away == null) {
    if (match.status === 'POSTPONED') return {primary: '—', detail: 'Postponed'};
    if (match.status === 'CANCELLED') return {primary: '—', detail: 'Cancelled'};
    if (match.status === 'SUSPENDED') return {primary: '—', detail: 'Suspended'};
    return {primary: '—', detail: 'Score pending'};
  }

  const primary = `${open.home} – ${open.away}`;
  if (match.score.duration === 'PENALTY_SHOOTOUT' && match.score.penalties) {
    const p = match.score.penalties;
    return {
      primary,
      detail: `Penalties ${p.home ?? '—'}–${p.away ?? '—'}`,
    };
  }
  if (match.score.duration === 'EXTRA_TIME') {
    return {primary, detail: 'After extra time'};
  }
  if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
    return {primary, detail: 'Delayed in-play score'};
  }
  return {primary, detail: null};
}

interface CalendarDateGroup {
  dateKey: string;
  dateLabel: string;
  matches: KnockoutMatch[];
}

function getCalendarDateGroupKey(utcDate: string | null, timezoneMode: TimezoneMode): string {
  if (!utcDate) return 'TBD';
  const parsed = new Date(utcDate);
  if (Number.isNaN(parsed.getTime())) return 'TBD';
  const targetZone = timezoneMode === 'cairo' ? 'Africa/Cairo' : undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: targetZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export const FixturesTable: React.FC<FixturesTableProps> = ({
  snapshot,
  timezoneMode,
  onSelectTie,
  onSelectMatch,
  onOpenKnockoutView,
}) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | CompetitionStage>('ALL');
  const [matchdayFilter, setMatchdayFilter] = useState<'ALL' | number>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [teamSearch, setTeamSearch] = useState('');

  const tieMap = useMemo(
    () => new Map(snapshot.ties.map((tie) => [tie.tieId, tie])),
    [snapshot.ties],
  );

  const availableStages = useMemo(() => {
    const present = new Set(snapshot.matches.map((m) => m.stage));
    const defaults: CompetitionStage[] = [
      'LEAGUE_STAGE',
      'PLAYOFFS',
      'ROUND_OF_16',
      'QUARTER_FINALS',
      'SEMI_FINALS',
      'FINAL',
    ];
    return ALL_STAGE_ORDER.filter((s) => defaults.includes(s) || present.has(s));
  }, [snapshot.matches]);

  const availableMatchdays = useMemo(() => {
    const days = new Set<number>();
    for (const m of snapshot.matches) {
      if (m.matchday != null) days.add(m.matchday);
    }
    return Array.from(days).sort((a, b) => a - b);
  }, [snapshot.matches]);

  const hasActiveFilters =
    stageFilter !== 'ALL' ||
    matchdayFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    teamSearch.trim() !== '';

  const resetFilters = () => {
    setStageFilter('ALL');
    setMatchdayFilter('ALL');
    setStatusFilter('ALL');
    setTeamSearch('');
  };

  const filteredMatches = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    return snapshot.matches.filter((match) => {
      if (stageFilter !== 'ALL' && match.stage !== stageFilter) return false;
      if (matchdayFilter !== 'ALL' && match.matchday !== matchdayFilter) return false;
      if (statusFilter !== 'ALL' && match.status !== statusFilter) return false;
      if (q) {
        const homeHaystack = `${match.homeTeam.name} ${match.homeTeam.shortName} ${match.homeTeam.tla}`.toLowerCase();
        const awayHaystack = `${match.awayTeam.name} ${match.awayTeam.shortName} ${match.awayTeam.tla}`.toLowerCase();
        if (!homeHaystack.includes(q) && !awayHaystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [snapshot.matches, stageFilter, matchdayFilter, statusFilter, teamSearch]);

  const dateGroups = useMemo<CalendarDateGroup[]>(() => {
    const groupsMap = new Map<string, CalendarDateGroup>();

    for (const match of filteredMatches) {
      const dateKey = getCalendarDateGroupKey(match.utcDate, timezoneMode);
      const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
      const existing = groupsMap.get(dateKey);
      if (existing) {
        existing.matches.push(match);
      } else {
        groupsMap.set(dateKey, {
          dateKey,
          dateLabel: dateKey === 'TBD' ? 'Date TBD' : kickoff.dateLabel,
          matches: [match],
        });
      }
    }

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.dateKey === 'TBD') return 1;
      if (b.dateKey === 'TBD') return -1;
      return a.dateKey.localeCompare(b.dateKey);
    });
  }, [filteredMatches, timezoneMode]);

  const handleInspect = (match: KnockoutMatch) => {
    const tie = match.tieId ? tieMap.get(match.tieId) : undefined;
    if (tie) {
      onSelectTie(tie);
    } else {
      onSelectMatch(match);
    }
  };

  return (
    <section
      id="matches"
      aria-labelledby="matches-heading"
      className="border-b border-[#c4d2e8]/12 bg-[#070d19]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#5ca0ff]">
              Season Fixtures &amp; Results
            </p>
            <h2
              id="matches-heading"
              className="mt-1 font-display text-2xl font-bold tracking-wide text-[#f4f7fb] sm:text-3xl"
            >
              Matches by Calendar Date
            </h2>
          </div>
          <p className="font-mono-tabular text-xs text-[#7f91ad]">
            Showing {filteredMatches.length} of {snapshot.matches.length} verified fixture(s) ·{' '}
            {timezoneMode === 'cairo' ? 'Egypt time (Africa/Cairo)' : 'Viewer local time'}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-8 grid grid-cols-1 gap-3 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-4 md:grid-cols-[1fr_180px_150px_170px_auto] md:items-end">
          <div>
            <label htmlFor="team-search-input" className="block text-xs font-medium text-[#b7c5da]">
              Team Search
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7f91ad]"
                aria-hidden="true"
              />
              <input
                id="team-search-input"
                type="search"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Filter by club name or TLA…"
                className="min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] py-2 pr-3 pl-9 text-sm text-[#f4f7fb] placeholder:text-[#7f91ad] focus:border-[#2f7bff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stage-filter-select" className="block text-xs font-medium text-[#b7c5da]">
              Stage
            </label>
            <select
              id="stage-filter-select"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as 'ALL' | CompetitionStage)}
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">All Stages</option>
              {availableStages.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="matchday-filter-select"
              className="block text-xs font-medium text-[#b7c5da]"
            >
              Matchday
            </label>
            <select
              id="matchday-filter-select"
              value={matchdayFilter === 'ALL' ? 'ALL' : String(matchdayFilter)}
              onChange={(e) =>
                setMatchdayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">All Matchdays</option>
              {availableMatchdays.map((md) => (
                <option key={md} value={String(md)}>
                  Matchday {md}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter-select"
              className="block text-xs font-medium text-[#b7c5da]"
            >
              Match Status
            </label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | MatchStatus)}
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              {FILTERABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded border border-[#c4d2e8]/20 bg-[#12203b] px-4 py-2 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Truthful Empty States */}
        {snapshot.matches.length === 0 ? (
          <div className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-[#f4f7fb]">
              No Verified {snapshot.seasonLabel} Fixtures Published Yet
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#b7c5da]">
              {snapshot.ingestionStatus === 'not_configured'
                ? 'This preview has not yet run an authenticated snapshot sync. Once the scheduled ingestion publishes the 2026/27 Champions League dataset, all League Stage fixtures and results will appear here grouped by calendar date in Egypt time.'
                : 'No match records are published in the current validated snapshot yet.'}
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onOpenKnockoutView}
                className="inline-flex min-h-[44px] items-center rounded border border-[#2f7bff]/60 bg-[#2f7bff]/15 px-4 py-2 text-xs font-medium text-[#f4f7fb] transition-colors hover:bg-[#2f7bff]/25"
              >
                Open Knockout Bracket
              </button>
            </div>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-[#f4f7fb]">
              No Fixtures Match Your Filters
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#b7c5da]">
              Try clearing the club search or widening your stage, matchday, and status filters.
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-[44px] items-center rounded bg-[#2f7bff] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4188ff]"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {dateGroups.map((group) => (
              <section
                key={group.dateKey}
                aria-label={`Fixtures on ${group.dateLabel}`}
                className="space-y-3"
              >
                {/* Calendar Date Heading */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c4d2e8]/18 pb-2">
                  <h3 className="font-display text-xl font-bold tracking-wide text-[#f4f7fb]">
                    {group.dateLabel}
                  </h3>
                  <span className="font-mono-tabular text-xs text-[#7f91ad]">
                    {group.matches.length}{' '}
                    {group.matches.length === 1 ? 'fixture' : 'fixtures'}
                  </span>
                </div>

                {/* Desktop Semantic Table */}
                <div className="hidden overflow-hidden rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] md:block">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <colgroup>
                      <col className="w-[16%]" />
                      <col className="w-[29%]" />
                      <col className="w-[19%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-[#c4d2e8]/15 bg-[#101c34] text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
                        <th scope="col" className="px-4 py-3">
                          Stage / Round
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Matchup
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Kickoff ({timezoneMode === 'cairo' ? 'Egypt time' : 'Local'})
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Score
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c4d2e8]/10">
                      {group.matches.map((match) => {
                        const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
                        const scoreCell = formatMatchScoreCell(match);
                        const contextLabel = match.tieId
                          ? match.isSingleMatch
                            ? 'Single match'
                            : `Leg ${match.leg ?? '?'} · ${match.tieId}`
                          : match.matchday != null
                            ? `Matchday ${match.matchday}`
                            : 'Season fixture';

                        return (
                          <tr
                            key={match.matchId}
                            className="transition-colors hover:bg-[#12203b]/80"
                          >
                            <td className="px-4 py-3.5 align-top">
                              <span className="block font-medium text-[#f4f7fb]">
                                {STAGE_LABELS[match.stage]}
                              </span>
                              <span className="mt-0.5 block text-xs text-[#7f91ad]">
                                {contextLabel}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <TeamMonogram team={match.homeTeam} size="sm" />
                                  <span
                                    className={`truncate ${
                                      match.homeTeam.isTbd
                                        ? 'text-[#7f91ad]'
                                        : 'font-medium text-[#f4f7fb]'
                                    }`}
                                  >
                                    {match.homeTeam.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TeamMonogram team={match.awayTeam} size="sm" />
                                  <span
                                    className={`truncate ${
                                      match.awayTeam.isTbd
                                        ? 'text-[#7f91ad]'
                                        : 'font-medium text-[#d8e1ee]'
                                    }`}
                                  >
                                    {match.awayTeam.name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <span className="block font-mono-tabular text-xs font-semibold text-[#f4f7fb]">
                                {kickoff.timeLabel}
                              </span>
                              <span className="mt-0.5 block font-mono-tabular text-xs text-[#7f91ad]">
                                {kickoff.tzLabel}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <span
                                className={`text-xs font-medium ${
                                  match.status === 'POSTPONED' ||
                                  match.status === 'SUSPENDED' ||
                                  match.status === 'CANCELLED'
                                    ? 'text-amber-300'
                                    : match.status === 'IN_PLAY' || match.status === 'PAUSED'
                                      ? 'text-[#5ca0ff]'
                                      : 'text-[#d8e1ee]'
                                }`}
                              >
                                {STATUS_LABELS[match.status]}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 align-top">
                              <span className="block font-mono-tabular text-sm font-semibold text-[#f4f7fb]">
                                {scoreCell.primary}
                              </span>
                              {scoreCell.detail && (
                                <span className="mt-0.5 block text-xs text-[#7f91ad]">
                                  {scoreCell.detail}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right align-top">
                              <button
                                type="button"
                                onClick={() => handleInspect(match)}
                                className="inline-flex min-h-[40px] items-center rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-1.5 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white whitespace-nowrap"
                              >
                                {match.tieId ? 'Inspect Tie' : 'Match Info'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Labeled Card Layout (< md) */}
                <div className="space-y-3 md:hidden">
                  {group.matches.map((match) => {
                    const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
                    const scoreCell = formatMatchScoreCell(match);
                    const contextLabel = match.tieId
                      ? match.isSingleMatch
                        ? 'Single match'
                        : `Leg ${match.leg ?? '?'} · ${match.tieId}`
                      : match.matchday != null
                        ? `Matchday ${match.matchday}`
                        : 'Season fixture';

                    return (
                      <article
                        key={match.matchId}
                        className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-4"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-[#c4d2e8]/10 pb-2.5 text-xs">
                          <span className="font-medium text-[#5ca0ff]">
                            {STAGE_LABELS[match.stage]} · {contextLabel}
                          </span>
                          <span className="font-medium text-[#d8e1ee]">
                            {STATUS_LABELS[match.status]}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <TeamMonogram team={match.homeTeam} size="sm" />
                              <span className="truncate text-sm font-medium text-[#f4f7fb]">
                                {match.homeTeam.name}
                              </span>
                            </div>
                            <span className="font-mono-tabular text-sm font-semibold text-[#f4f7fb]">
                              {match.score.openPlay?.home ?? '—'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <TeamMonogram team={match.awayTeam} size="sm" />
                              <span className="truncate text-sm font-medium text-[#d8e1ee]">
                                {match.awayTeam.name}
                              </span>
                            </div>
                            <span className="font-mono-tabular text-sm font-semibold text-[#f4f7fb]">
                              {match.score.openPlay?.away ?? '—'}
                            </span>
                          </div>
                        </div>

                        <dl className="mt-3 grid grid-cols-1 gap-1.5 border-t border-[#c4d2e8]/10 pt-2.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <dt className="text-[#7f91ad]">Kickoff</dt>
                            <dd className="font-mono-tabular text-right text-[#d8e1ee]">
                              {kickoff.timeLabel} · {kickoff.tzLabel}
                            </dd>
                          </div>
                          {scoreCell.detail && (
                            <div className="flex justify-between gap-2">
                              <dt className="text-[#7f91ad]">Score Note</dt>
                              <dd className="text-right text-[#b7c5da]">{scoreCell.detail}</dd>
                            </div>
                          )}
                        </dl>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => handleInspect(match)}
                            className="min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#12203b] px-4 py-2 text-xs font-medium text-[#f4f7fb] transition-colors hover:border-[#2f7bff]"
                          >
                            {match.tieId ? 'Inspect Tie Details' : 'Inspect Match Details'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
