import React, {useEffect, useRef} from 'react';
import {X} from 'lucide-react';
import type {TimezoneMode} from '../config/competition';
import {
  formatKickoffTime,
  formatUtcTimestamp,
  STAGE_LABELS,
  STATUS_LABELS,
} from '../domain/knockoutEngine';
import type {KnockoutMatch, KnockoutSnapshot, KnockoutTie} from '../types/knockout';
import {TeamMonogram} from './TeamMonogram';

interface MatchDetailPanelProps {
  tie: KnockoutTie | null;
  match: KnockoutMatch | null;
  snapshot: KnockoutSnapshot;
  timezoneMode: TimezoneMode;
  onClose: () => void;
}

const LegCard: React.FC<{
  legNumberLabel: string;
  match: KnockoutMatch | undefined;
  timezoneMode: TimezoneMode;
  fallbackDescription: string;
}> = ({legNumberLabel, match, timezoneMode, fallbackDescription}) => {
  if (!match) {
    return (
      <div className="rounded-md border border-[#c4d2e8]/15 bg-[#070d19] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[#5ca0ff]">{legNumberLabel}</span>
          <span className="text-[#7f91ad]">Awaiting Fixture</span>
        </div>
        <p className="mt-2 text-sm text-[#b7c5da]">{fallbackDescription}</p>
      </div>
    );
  }

  const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
  const openPlay = match.score.openPlay;
  const ht = match.score.halfTime;
  const reg = match.score.regularTime;
  const et = match.score.extraTime;
  const pens = match.score.penalties;

  return (
    <div className="rounded-md border border-[#c4d2e8]/18 bg-[#070d19] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c4d2e8]/10 pb-2.5 text-xs">
        <span className="font-medium text-[#5ca0ff]">{legNumberLabel}</span>
        <span
          className={`font-medium ${
            match.status === 'POSTPONED' ||
            match.status === 'SUSPENDED' ||
            match.status === 'CANCELLED'
              ? 'text-amber-300'
              : 'text-[#d8e1ee]'
          }`}
        >
          {STATUS_LABELS[match.status]}
        </span>
      </div>

      {/* Home vs Away order */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamMonogram team={match.homeTeam} size="sm" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#f4f7fb]">
                {match.homeTeam.name}
              </span>
              <span className="block text-[11px] text-[#7f91ad]">Home</span>
            </div>
          </div>
          <span className="font-mono-tabular text-lg font-semibold text-[#f4f7fb]">
            {openPlay?.home != null ? openPlay.home : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TeamMonogram team={match.awayTeam} size="sm" />
            <div className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#d8e1ee]">
                {match.awayTeam.name}
              </span>
              <span className="block text-[11px] text-[#7f91ad]">Away</span>
            </div>
          </div>
          <span className="font-mono-tabular text-lg font-semibold text-[#f4f7fb]">
            {openPlay?.away != null ? openPlay.away : '—'}
          </span>
        </div>
      </div>

      {/* Distinct Half-Time / 90m / Extra-Time / Penalty Shootout Breakdown */}
      {(ht || reg || et || pens || match.score.isScoreAmbiguous) && (
        <dl className="mt-3 space-y-1 border-t border-[#c4d2e8]/10 pt-2.5 text-xs">
          {ht && ht.home != null && ht.away != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-[#7f91ad]">Half-time</dt>
              <dd className="font-mono-tabular text-[#d8e1ee]">
                {ht.home} – {ht.away}
              </dd>
            </div>
          )}
          {reg && reg.home != null && reg.away != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-[#7f91ad]">90 Minutes</dt>
              <dd className="font-mono-tabular text-[#d8e1ee]">
                {reg.home} – {reg.away}
              </dd>
            </div>
          )}
          {et && et.home != null && et.away != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-[#7f91ad]">Extra Time Goals</dt>
              <dd className="font-mono-tabular text-[#d8e1ee]">
                {et.home} – {et.away}
              </dd>
            </div>
          )}
          {pens && pens.home != null && pens.away != null && (
            <div className="flex justify-between gap-2">
              <dt className="font-medium text-[#5ca0ff]">Penalty Shootout</dt>
              <dd className="font-mono-tabular font-semibold text-[#5ca0ff]">
                {pens.home} – {pens.away}
              </dd>
            </div>
          )}
          {match.score.isScoreAmbiguous && (
            <div className="pt-1 text-amber-300">
              {match.score.ambiguityNote ?? 'Score breakdown requires verification.'}
            </div>
          )}
        </dl>
      )}

      {/* Kickoff & Venue */}
      <dl className="mt-3 space-y-1 border-t border-[#c4d2e8]/10 pt-2.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-[#7f91ad]">Kickoff</dt>
          <dd className="font-mono-tabular text-right text-[#d8e1ee]">{kickoff.fullLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#7f91ad]">Venue</dt>
          <dd className="text-right text-[#b7c5da]">{match.venue ?? 'Venue TBD'}</dd>
        </div>
      </dl>

      {match.resolutionNote && (
        <p className="mt-2.5 rounded border border-amber-400/25 bg-amber-950/30 px-2.5 py-1.5 text-xs text-amber-200">
          {match.resolutionNote}
        </p>
      )}
    </div>
  );
};

export const MatchDetailPanel: React.FC<MatchDetailPanelProps> = ({
  tie,
  match,
  snapshot,
  timezoneMode,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isOpen = Boolean(tie || match);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const leg1 = tie ? (tie.legs.find((m) => m.leg === 1) ?? tie.legs[0]) : undefined;
  const leg2 = tie
    ? (tie.legs.find((m) => m.leg === 2) ?? (tie.legs.length > 1 ? tie.legs[1] : undefined))
    : undefined;

  const headerKicker = tie
    ? `${STAGE_LABELS[tie.stage]} · ${tie.tieId}`
    : match
      ? `${STAGE_LABELS[match.stage]}${match.matchday != null ? ` · Matchday ${match.matchday}` : ''}`
      : '';

  const headerTitle = tie
    ? tie.label
    : match
      ? `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`
      : '';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#03060d]/75"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-[#c4d2e8]/20 bg-[#0d172b] p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#c4d2e8]/15 pb-4">
          <div>
            <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#5ca0ff]">
              {headerKicker}
            </p>
            <h2
              id="detail-panel-title"
              className="mt-1 font-display text-2xl font-bold text-[#f4f7fb]"
            >
              {headerTitle}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close match detail panel"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#c4d2e8]/20 bg-[#070d19] text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tie Overview & Aggregate (when inspecting a Knockout Tie) */}
        {tie ? (
          <>
            <div className="mt-5 rounded-md border border-[#c4d2e8]/15 bg-[#070d19] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <TeamMonogram
                    team={tie.teamA}
                    size="md"
                    isWinner={
                      tie.advancement.status === 'CONFIRMED' &&
                      tie.advancement.winnerTeamId === tie.teamA.id
                    }
                  />
                  <span className="truncate text-sm font-semibold text-[#f4f7fb]">
                    {tie.teamA.name}
                  </span>
                </div>
                <span className="font-mono-tabular text-lg font-bold text-[#f4f7fb]">
                  {tie.aggregate.teamAScore != null ? tie.aggregate.teamAScore : '—'}
                </span>
              </div>

              <div className="my-2 h-px bg-[#c4d2e8]/10" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <TeamMonogram
                    team={tie.teamB}
                    size="md"
                    isWinner={
                      tie.advancement.status === 'CONFIRMED' &&
                      tie.advancement.winnerTeamId === tie.teamB.id
                    }
                  />
                  <span className="truncate text-sm font-semibold text-[#f4f7fb]">
                    {tie.teamB.name}
                  </span>
                </div>
                <span className="font-mono-tabular text-lg font-bold text-[#f4f7fb]">
                  {tie.aggregate.teamBScore != null ? tie.aggregate.teamBScore : '—'}
                </span>
              </div>

              <div className="mt-3 border-t border-[#c4d2e8]/10 pt-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#7f91ad]">Advancement Status</span>
                  <span
                    className={`font-medium ${
                      tie.advancement.status === 'CONFIRMED'
                        ? 'text-[#5ca0ff]'
                        : tie.advancement.status === 'UNRESOLVED'
                          ? 'text-amber-300'
                          : 'text-[#d8e1ee]'
                    }`}
                  >
                    {tie.advancement.status === 'CONFIRMED'
                      ? `Confirmed (${tie.advancement.winnerName})`
                      : tie.advancement.status === 'UNRESOLVED'
                        ? 'Unresolved'
                        : 'Undecided'}
                  </span>
                </div>

                {tie.aggregate.decidedByPenalties && tie.aggregate.penaltyScore && (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[#7f91ad]">Shootout Result</span>
                    <span className="font-mono-tabular font-semibold text-[#5ca0ff]">
                      {tie.teamA.shortName} {tie.aggregate.penaltyScore.teamA} –{' '}
                      {tie.aggregate.penaltyScore.teamB} {tie.teamB.shortName}
                    </span>
                  </div>
                )}

                <p className="mt-2 leading-relaxed text-[#b7c5da]">{tie.advancement.explanation}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-medium tracking-[0.12em] uppercase text-[#7f91ad]">
                {tie.isTwoLegged ? 'Two-Legged Tie Breakdown' : 'Single-Match Final'}
              </h3>

              {tie.isTwoLegged ? (
                <>
                  <LegCard
                    legNumberLabel="First Leg"
                    match={leg1}
                    timezoneMode={timezoneMode}
                    fallbackDescription="First-leg participants, venue, and kickoff time remain TBD pending verified competition data."
                  />
                  <LegCard
                    legNumberLabel="Second Leg (Reversed Home / Away)"
                    match={leg2}
                    timezoneMode={timezoneMode}
                    fallbackDescription="Second-leg fixture awaits verified draw or confirmation of the preceding knockout leg."
                  />
                </>
              ) : (
                <LegCard
                  legNumberLabel="Final Match"
                  match={leg1}
                  timezoneMode={timezoneMode}
                  fallbackDescription="Final participants and kickoff details remain TBD until Semi-final ties are conclusively decided."
                />
              )}
            </div>
          </>
        ) : match ? (
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-medium tracking-[0.12em] uppercase text-[#7f91ad]">
              Match Breakdown
            </h3>
            <LegCard
              legNumberLabel={
                match.matchday != null
                  ? `${STAGE_LABELS[match.stage]} · Matchday ${match.matchday}`
                  : STAGE_LABELS[match.stage]
              }
              match={match}
              timezoneMode={timezoneMode}
              fallbackDescription="Fixture details unavailable."
            />
          </div>
        ) : null}

        {/* Source Freshness */}
        <div className="mt-6 rounded-md border border-[#c4d2e8]/12 bg-[#070d19] p-4 text-xs text-[#7f91ad]">
          <p className="font-medium text-[#d8e1ee]">Source &amp; Snapshot Freshness</p>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between gap-2">
              <dt>Data Provider</dt>
              <dd className="text-[#b7c5da]">{snapshot.sourceName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Source Updated</dt>
              <dd className="font-mono-tabular text-[#b7c5da]">
                {formatUtcTimestamp(snapshot.sourceLastUpdatedUtc)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Snapshot Ingested</dt>
              <dd className="font-mono-tabular text-[#b7c5da]">
                {formatUtcTimestamp(snapshot.ingestedAtUtc)}
              </dd>
            </div>
          </dl>
          <p className="mt-2.5 leading-relaxed">
            Scores and schedules derive from delayed hourly snapshots. Free-tier updates do not
            provide instantaneous live goal-by-goal coverage.
          </p>
        </div>
      </aside>
    </div>
  );
};
