import React from 'react';
import {COMPETITION_CONFIG, type TimezoneMode} from '../config/competition';
import {
  computeOverviewStats,
  formatKickoffTime,
  formatRelativeAge,
  formatUtcTimestamp,
  STAGE_LABELS,
} from '../domain/knockoutEngine';
import type {KnockoutMatch, KnockoutSnapshot} from '../types/knockout';

interface TournamentOverviewProps {
  snapshot: KnockoutSnapshot;
  timezoneMode: TimezoneMode;
  onTimezoneChange: (mode: TimezoneMode) => void;
  lastCheckedAtUtc: string | null;
  recheckError: string | null;
  isRetainedFallback: boolean;
  onSelectMatch: (match: KnockoutMatch) => void;
  onOpenKnockoutView: () => void;
}

export const TournamentOverview: React.FC<TournamentOverviewProps> = ({
  snapshot,
  timezoneMode,
  onTimezoneChange,
  lastCheckedAtUtc,
  recheckError,
  isRetainedFallback,
  onSelectMatch,
  onOpenKnockoutView,
}) => {
  const stats = computeOverviewStats(snapshot);
  const nextFixture = stats.nextVerifiedFixture;
  const nextKickoff = nextFixture
    ? formatKickoffTime(nextFixture.utcDate, timezoneMode)
    : null;

  const localZoneName = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  })();

  const statusHeadline = (() => {
    if (isRetainedFallback) {
      return 'Snapshot recheck failed — retaining last validated snapshot';
    }
    switch (snapshot.ingestionStatus) {
      case 'not_configured':
        return 'Setup required — awaiting first authenticated snapshot';
      case 'awaiting_draw':
        return 'Provider connected — awaiting 2026/27 fixtures';
      case 'error':
        return 'Published snapshot unavailable';
      case 'ok':
        return 'Verified delayed snapshot active';
    }
  })();

  return (
    <section
      id="overview"
      aria-labelledby="overview-heading"
      className="border-b border-[#c4d2e8]/12 bg-[#070d19]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#5ca0ff]">
              {snapshot.competitionName}
              <span aria-hidden="true" className="mx-2 text-[#7f91ad]">
                ·
              </span>
              Season {snapshot.seasonLabel}
            </p>
            <h1
              id="overview-heading"
              className="font-display text-3xl font-bold leading-[1.06] tracking-tight text-[#f4f7fb] sm:text-5xl"
              style={{textWrap: 'balance'}}
            >
              {snapshot.seasonLabel} Champions League Fixtures &amp; Results
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#b7c5da] sm:text-base">
              Verified {snapshot.seasonLabel} League Stage matches and results grouped by calendar
              date in Egypt time. Open the Knockout tab in the bottom bar at any time to inspect
              the Round of 16 through Final bracket.
            </p>
          </div>

          {/* Explicit Egypt Time Default Switcher */}
          <div className="flex flex-col items-start gap-1.5 lg:items-end">
            <span className="text-xs font-medium text-[#7f91ad]">Kickoff Display Timezone</span>
            <div
              role="group"
              aria-label="Kickoff timezone selector"
              className="inline-flex rounded-md border border-[#c4d2e8]/18 bg-[#0d172b] p-1"
            >
              <button
                type="button"
                onClick={() => onTimezoneChange('cairo')}
                aria-pressed={timezoneMode === 'cairo'}
                className={`min-h-[40px] rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  timezoneMode === 'cairo'
                    ? 'bg-[#2f7bff] text-white'
                    : 'text-[#b7c5da] hover:text-[#f4f7fb]'
                }`}
              >
                Egypt time (Africa/Cairo)
              </button>
              <button
                type="button"
                onClick={() => onTimezoneChange('local')}
                aria-pressed={timezoneMode === 'local'}
                className={`min-h-[40px] rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  timezoneMode === 'local'
                    ? 'bg-[#2f7bff] text-white'
                    : 'text-[#b7c5da] hover:text-[#f4f7fb]'
                }`}
              >
                Local ({localZoneName})
              </button>
            </div>
          </div>
        </div>

        {/* Truthful Data-Derived Ledger Strip */}
        <dl className="mt-8 grid grid-cols-1 divide-y divide-[#c4d2e8]/12 border border-[#c4d2e8]/15 bg-[#0d172b] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <div className="px-5 py-4">
            <dt className="text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
              Season Fixtures
            </dt>
            <dd className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#f4f7fb]">
              {stats.totalFixtures === 0
                ? '0 published'
                : `${stats.completedFixtures} / ${stats.totalFixtures}`}
            </dd>
            <p className="mt-1 text-xs text-[#7f91ad]">
              {stats.totalFixtures === 0
                ? 'No verified 2026/27 match records ingested yet'
                : `${stats.leagueStageFixtures} League Stage · ${stats.knockoutBracketFixtures} Knockout`}
            </p>
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
              Knockout Bracket Ties
            </dt>
            <dd className="mt-1.5">
              <button
                type="button"
                onClick={onOpenKnockoutView}
                className="text-left group focus-visible:outline-none"
              >
                <span className="block font-mono-tabular text-2xl font-semibold text-[#f4f7fb] group-hover:text-[#5ca0ff]">
                  {stats.tiesWithConfirmedParticipants} / {stats.totalTies}
                </span>
                <span className="mt-1 block text-xs text-[#7f91ad] group-hover:text-[#b7c5da]">
                  {stats.tiesWithConfirmedParticipants === 0
                    ? 'Round of 16–Final remain TBD · Open bracket'
                    : `${stats.tiesDecided} of ${stats.totalTies} ties decided · View bracket`}
                </span>
              </button>
            </dd>
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
              Next Verified Fixture
            </dt>
            {nextFixture && nextKickoff ? (
              <dd className="mt-1.5">
                <button
                  type="button"
                  onClick={() => onSelectMatch(nextFixture)}
                  className="text-left group focus-visible:outline-none"
                >
                  <span className="block text-sm font-semibold text-[#f4f7fb] group-hover:text-[#5ca0ff]">
                    {nextFixture.homeTeam.shortName} vs {nextFixture.awayTeam.shortName}
                  </span>
                  <span className="mt-0.5 block font-mono-tabular text-xs text-[#b7c5da]">
                    {STAGE_LABELS[nextFixture.stage]}
                    {nextFixture.matchday ? ` · MD ${nextFixture.matchday}` : ''} ·{' '}
                    {nextKickoff.dateLabel} {nextKickoff.timeLabel}
                  </span>
                </button>
              </dd>
            ) : (
              <>
                <dd className="mt-1.5 font-display text-xl font-semibold text-[#d8e1ee]">
                  {stats.totalFixtures > 0 ? 'All listed finished' : 'Awaiting snapshot'}
                </dd>
                <p className="mt-1 text-xs text-[#7f91ad]">
                  {stats.totalFixtures > 0
                    ? 'No upcoming scheduled fixtures in current snapshot'
                    : `No scheduled ${snapshot.seasonLabel} kickoff verified yet`}
                </p>
              </>
            )}
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium tracking-wider uppercase text-[#7f91ad]">
              Data Freshness
            </dt>
            <dd className="mt-1.5 font-mono-tabular text-sm font-semibold text-[#f4f7fb]">
              {snapshot.ingestedAtUtc ? formatRelativeAge(snapshot.ingestedAtUtc) : 'Not ingested yet'}
            </dd>
            <p className="mt-1 text-xs text-[#7f91ad]">
              {snapshot.ingestedAtUtc
                ? `Ingested ${formatUtcTimestamp(snapshot.ingestedAtUtc)}`
                : 'Hourly delayed static snapshot model'}
            </p>
          </div>
        </dl>

        {/* Honest Ingestion & Delayed-Snapshot Status Notice */}
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex flex-col gap-2 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b]/80 px-4 py-3 text-xs text-[#b7c5da] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-medium text-[#f4f7fb]">{statusHeadline}</p>
            <p className="text-[#b7c5da]">
              {isRetainedFallback && recheckError
                ? `${recheckError} Displaying previous validated snapshot from ${formatUtcTimestamp(snapshot.ingestedAtUtc)}.`
                : snapshot.statusMessage}
            </p>
          </div>
          <div className="shrink-0 text-[#7f91ad] sm:text-right">
            <p>Checks published static JSON while tab is visible</p>
            <p className="font-mono-tabular">
              Source: {COMPETITION_CONFIG.providerName} (free delayed)
              {lastCheckedAtUtc ? ` · Checked ${formatRelativeAge(lastCheckedAtUtc)}` : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
