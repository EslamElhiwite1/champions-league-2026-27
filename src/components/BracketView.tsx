import React, {useState} from 'react';
import {
  computeOverviewStats,
  formatKickoffTime,
  STAGE_LABELS,
  STAGE_ORDER,
} from '../domain/knockoutEngine';
import type {TimezoneMode} from '../config/competition';
import type {KnockoutBracketStage, KnockoutSnapshot, KnockoutTie} from '../types/knockout';
import {TeamMonogram} from './TeamMonogram';
import {TrophyIllustration} from './TrophyIllustration';

interface BracketViewProps {
  snapshot: KnockoutSnapshot;
  timezoneMode: TimezoneMode;
  selectedTieId: string | null;
  onSelectTie: (tie: KnockoutTie) => void;
}

interface TieCardProps {
  tie: KnockoutTie;
  timezoneMode: TimezoneMode;
  isSelected: boolean;
  onSelect: (tie: KnockoutTie) => void;
  compact?: boolean;
}

const TieCard: React.FC<TieCardProps> = ({
  tie,
  timezoneMode,
  isSelected,
  onSelect,
  compact = false,
}) => {
  const isFinal = tie.stage === 'FINAL';
  const winnerId =
    tie.advancement.status === 'CONFIRMED' ? tie.advancement.winnerTeamId : null;

  const isTeamAWinner = winnerId !== null && winnerId === tie.teamA.id;
  const isTeamBWinner = winnerId !== null && winnerId === tie.teamB.id;

  const firstScheduledLeg = tie.legs.find((m) => m.utcDate != null);
  const kickoffInfo = firstScheduledLeg
    ? formatKickoffTime(firstScheduledLeg.utcDate, timezoneMode)
    : null;

  const statusFooter = (() => {
    if (tie.advancement.status === 'CONFIRMED') {
      if (tie.advancement.method === 'PENALTIES' && tie.aggregate.penaltyScore) {
        return `Penalties (${tie.aggregate.penaltyScore.teamA}–${tie.aggregate.penaltyScore.teamB})`;
      }
      if (tie.advancement.method === 'EXTRA_TIME') {
        return 'After extra time';
      }
      if (tie.advancement.method === 'AWARDED') {
        return 'Awarded';
      }
      return isFinal ? 'Champion confirmed' : 'Aggregate confirmed';
    }
    if (tie.advancement.status === 'UNRESOLVED') {
      return 'Result unresolved';
    }
    if (tie.teamA.isTbd && tie.teamB.isTbd) {
      return isFinal ? 'Single match · TBD' : '2 legs · Awaiting draw';
    }
    if (tie.legs.some((l) => l.status === 'POSTPONED')) {
      return 'Postponed fixture';
    }
    if (tie.legs.some((l) => l.status === 'IN_PLAY' || l.status === 'PAUSED')) {
      return 'In progress (delayed feed)';
    }
    if (tie.legs.length === 1 && tie.isTwoLegged) {
      return '1st leg recorded · 2nd leg pending';
    }
    if (kickoffInfo) {
      return `${kickoffInfo.dateLabel} · ${kickoffInfo.timeLabel}`;
    }
    return isFinal ? 'Single match' : 'Two-legged tie';
  })();

  const scoreA =
    tie.aggregate.teamAScore != null ? String(tie.aggregate.teamAScore) : '—';
  const scoreB =
    tie.aggregate.teamBScore != null ? String(tie.aggregate.teamBScore) : '—';

  return (
    <button
      type="button"
      onClick={() => onSelect(tie)}
      aria-label={`Inspect ${tie.label}: ${tie.teamA.name} vs ${tie.teamB.name}, ${statusFooter}`}
      className={`group w-full rounded-md border text-left transition-colors focus-visible:outline-none ${
        compact ? 'px-2.5 py-2' : 'px-3.5 py-3'
      } ${
        isSelected
          ? 'border-[#2f7bff] bg-[#142544]'
          : 'border-[#c4d2e8]/18 bg-[#0d172b] hover:border-[#5ca0ff]/55 hover:bg-[#12203b]'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-[#7f91ad]">
        <span className="truncate font-medium">{tie.tieId}</span>
        {tie.advancement.status === 'UNRESOLVED' && (
          <span className="font-medium text-amber-300 shrink-0">Unresolved</span>
        )}
        {tie.advancement.status === 'CONFIRMED' && (
          <span className="font-medium text-[#5ca0ff] shrink-0">Confirmed</span>
        )}
      </div>

      {/* Team A Row */}
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMonogram team={tie.teamA} size="sm" isWinner={isTeamAWinner} />
          <span
            className={`truncate text-xs sm:text-[13px] ${
              tie.teamA.isTbd
                ? 'text-[#7f91ad]'
                : isTeamAWinner
                  ? 'font-semibold text-white'
                  : 'font-medium text-[#d8e1ee]'
            }`}
          >
            {compact ? tie.teamA.shortName : tie.teamA.name}
          </span>
        </div>
        <span
          className={`font-mono-tabular text-xs font-semibold shrink-0 ${
            isTeamAWinner ? 'text-[#5ca0ff]' : 'text-[#b7c5da]'
          }`}
        >
          {scoreA}
        </span>
      </div>

      <div className="my-1 h-px bg-[#c4d2e8]/10" />

      {/* Team B Row */}
      <div className="flex items-center justify-between gap-2 py-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMonogram team={tie.teamB} size="sm" isWinner={isTeamBWinner} />
          <span
            className={`truncate text-xs sm:text-[13px] ${
              tie.teamB.isTbd
                ? 'text-[#7f91ad]'
                : isTeamBWinner
                  ? 'font-semibold text-white'
                  : 'font-medium text-[#d8e1ee]'
            }`}
          >
            {compact ? tie.teamB.shortName : tie.teamB.name}
          </span>
        </div>
        <span
          className={`font-mono-tabular text-xs font-semibold shrink-0 ${
            isTeamBWinner ? 'text-[#5ca0ff]' : 'text-[#b7c5da]'
          }`}
        >
          {scoreB}
        </span>
      </div>

      <p className="mt-1.5 truncate text-[11px] text-[#7f91ad] group-hover:text-[#b7c5da]">
        {statusFooter}
      </p>
    </button>
  );
};

/**
 * SVG bracket fork connecting 2 feeder ties on the left into 1 target tie on the right.
 */
const LeftForkConnector: React.FC = () => (
  <div className="w-5 shrink-0 self-stretch" aria-hidden="true">
    <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="h-full w-full">
      <path
        d="M 0 25 H 10 V 75 H 0 M 10 50 H 20"
        fill="none"
        stroke="rgba(196, 210, 232, 0.28)"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </div>
);

/**
 * Mirrored SVG bracket fork connecting 2 feeder ties on the right into 1 target tie on the left.
 */
const RightForkConnector: React.FC = () => (
  <div className="w-5 shrink-0 self-stretch" aria-hidden="true">
    <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="h-full w-full">
      <path
        d="M 20 25 H 10 V 75 H 20 M 10 50 H 0"
        fill="none"
        stroke="rgba(196, 210, 232, 0.28)"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </div>
);

export const BracketView: React.FC<BracketViewProps> = ({
  snapshot,
  timezoneMode,
  selectedTieId,
  onSelectTie,
}) => {
  const [activeMobileStage, setActiveMobileStage] =
    useState<KnockoutBracketStage>('ROUND_OF_16');

  const stats = computeOverviewStats(snapshot);
  const byId = new Map(snapshot.ties.map((t) => [t.tieId, t]));
  const getTie = (id: string) => byId.get(id)!;

  const r16LeftTop = [getTie('R16-1'), getTie('R16-2')];
  const r16LeftBottom = [getTie('R16-3'), getTie('R16-4')];
  const r16RightTop = [getTie('R16-5'), getTie('R16-6')];
  const r16RightBottom = [getTie('R16-7'), getTie('R16-8')];

  const qf1 = getTie('QF-1');
  const qf2 = getTie('QF-2');
  const qf3 = getTie('QF-3');
  const qf4 = getTie('QF-4');
  const sf1 = getTie('SF-1');
  const sf2 = getTie('SF-2');
  const finalTie = getTie('FINAL-1');

  const mobileStageTies = snapshot.ties.filter((t) => t.stage === activeMobileStage);

  return (
    <section
      id="bracket"
      aria-labelledby="bracket-heading"
      className="border-b border-[#c4d2e8]/12 bg-[#070d19]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#5ca0ff]">
              Knockout Progression
            </p>
            <h2
              id="bracket-heading"
              className="mt-1 font-display text-2xl font-bold tracking-wide text-[#f4f7fb] sm:text-3xl"
            >
              {snapshot.seasonLabel} Tournament Bracket
            </h2>
          </div>
          <p className="text-xs text-[#7f91ad]">
            Select any tie card to inspect first and second legs, aggregate rules, and source
            freshness.
          </p>
        </div>

        {/* Desktop Inward-Flowing Bracket (xl >= 1280px) */}
        <div className="hidden xl:block">
          {/* Stage Column Headers */}
          <div className="mb-4 grid grid-cols-[1fr_20px_1fr_20px_1fr_20px_236px_20px_1fr_20px_1fr_20px_1fr] items-center text-center text-[11px] font-medium tracking-[0.12em] uppercase text-[#7f91ad]">
            <span>Round of 16</span>
            <span />
            <span>Quarter-finals</span>
            <span />
            <span>Semi-finals</span>
            <span />
            <span className="text-[#d8e1ee]">Final &amp; Trophy</span>
            <span />
            <span>Semi-finals</span>
            <span />
            <span>Quarter-finals</span>
            <span />
            <span>Round of 16</span>
          </div>

          {/* Symmetric Bracket Tree */}
          <div className="flex min-h-[560px] items-stretch">
            {/* LEFT HALF (R16-1..4 -> QF-1..2 -> SF-1) */}
            <div className="flex flex-1 items-stretch">
              {/* R16 + QF Feeder Pairs */}
              <div className="flex flex-[2.15] flex-col justify-between gap-4">
                {/* Upper Left Quadrant (R16-1, R16-2 -> QF-1) */}
                <div className="flex flex-1 items-stretch">
                  <div className="flex flex-1 flex-col justify-between">
                    {r16LeftTop.map((tie) => (
                      <div key={tie.tieId} className="flex flex-1 items-center py-1.5">
                        <TieCard
                          tie={tie}
                          timezoneMode={timezoneMode}
                          isSelected={selectedTieId === tie.tieId}
                          onSelect={onSelectTie}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                  <LeftForkConnector />
                  <div className="flex flex-1 items-center">
                    <TieCard
                      tie={qf1}
                      timezoneMode={timezoneMode}
                      isSelected={selectedTieId === qf1.tieId}
                      onSelect={onSelectTie}
                      compact
                    />
                  </div>
                </div>

                {/* Lower Left Quadrant (R16-3, R16-4 -> QF-2) */}
                <div className="flex flex-1 items-stretch">
                  <div className="flex flex-1 flex-col justify-between">
                    {r16LeftBottom.map((tie) => (
                      <div key={tie.tieId} className="flex flex-1 items-center py-1.5">
                        <TieCard
                          tie={tie}
                          timezoneMode={timezoneMode}
                          isSelected={selectedTieId === tie.tieId}
                          onSelect={onSelectTie}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                  <LeftForkConnector />
                  <div className="flex flex-1 items-center">
                    <TieCard
                      tie={qf2}
                      timezoneMode={timezoneMode}
                      isSelected={selectedTieId === qf2.tieId}
                      onSelect={onSelectTie}
                      compact
                    />
                  </div>
                </div>
              </div>

              {/* QF-1 & QF-2 -> SF-1 Connector */}
              <LeftForkConnector />

              {/* SF-1 */}
              <div className="flex flex-1 items-center">
                <TieCard
                  tie={sf1}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === sf1.tieId}
                  onSelect={onSelectTie}
                  compact
                />
              </div>
            </div>

            {/* SF-1 -> Final Horizontal Axis */}
            <div className="flex w-5 shrink-0 items-center" aria-hidden="true">
              <div className="h-px w-full bg-[#c4d2e8]/30" />
            </div>

            {/* CENTER AXIS: Trophy visually central above the Final card without obscuring connectors */}
            <div className="relative flex w-[236px] shrink-0 flex-col items-center justify-center">
              <div className="pointer-events-none absolute inset-x-0 bottom-1/2 mb-[74px] flex justify-center">
                <TrophyIllustration championName={stats.champion?.name ?? null} />
              </div>

              <div className="w-full">
                <TieCard
                  tie={finalTie}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === finalTie.tieId}
                  onSelect={onSelectTie}
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-1/2 mt-[86px] text-center">
                {stats.champion ? (
                  <div className="rounded-md border border-[#2f7bff]/40 bg-[#10203d] px-3 py-2">
                    <p className="text-[11px] font-medium tracking-wider uppercase text-[#5ca0ff]">
                      Champions
                    </p>
                    <p className="font-display text-lg font-bold text-[#f4f7fb]">
                      {stats.champion.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#7f91ad]">
                    Winner confirmed only upon Final completion
                  </p>
                )}
              </div>
            </div>

            {/* Final <- SF-2 Horizontal Axis */}
            <div className="flex w-5 shrink-0 items-center" aria-hidden="true">
              <div className="h-px w-full bg-[#c4d2e8]/30" />
            </div>

            {/* RIGHT HALF (SF-2 <- QF-3..4 <- R16-5..8) */}
            <div className="flex flex-1 items-stretch">
              {/* SF-2 */}
              <div className="flex flex-1 items-center">
                <TieCard
                  tie={sf2}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === sf2.tieId}
                  onSelect={onSelectTie}
                  compact
                />
              </div>

              {/* SF-2 <- QF-3 & QF-4 Connector */}
              <RightForkConnector />

              {/* QF + R16 Feeder Pairs */}
              <div className="flex flex-[2.15] flex-col justify-between gap-4">
                {/* Upper Right Quadrant (QF-3 <- R16-5, R16-6) */}
                <div className="flex flex-1 items-stretch">
                  <div className="flex flex-1 items-center">
                    <TieCard
                      tie={qf3}
                      timezoneMode={timezoneMode}
                      isSelected={selectedTieId === qf3.tieId}
                      onSelect={onSelectTie}
                      compact
                    />
                  </div>
                  <RightForkConnector />
                  <div className="flex flex-1 flex-col justify-between">
                    {r16RightTop.map((tie) => (
                      <div key={tie.tieId} className="flex flex-1 items-center py-1.5">
                        <TieCard
                          tie={tie}
                          timezoneMode={timezoneMode}
                          isSelected={selectedTieId === tie.tieId}
                          onSelect={onSelectTie}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lower Right Quadrant (QF-4 <- R16-7, R16-8) */}
                <div className="flex flex-1 items-stretch">
                  <div className="flex flex-1 items-center">
                    <TieCard
                      tie={qf4}
                      timezoneMode={timezoneMode}
                      isSelected={selectedTieId === qf4.tieId}
                      onSelect={onSelectTie}
                      compact
                    />
                  </div>
                  <RightForkConnector />
                  <div className="flex flex-1 flex-col justify-between">
                    {r16RightBottom.map((tie) => (
                      <div key={tie.tieId} className="flex flex-1 items-center py-1.5">
                        <TieCard
                          tie={tie}
                          timezoneMode={timezoneMode}
                          isSelected={selectedTieId === tie.tieId}
                          onSelect={onSelectTie}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Stage-by-Stage Composition (< 1280px) */}
        <div className="space-y-6 xl:hidden">
          {/* Featured Trophy & Final Spotlight */}
          <div className="grid grid-cols-1 items-center gap-6 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-5 md:grid-cols-[auto_1fr]">
            <div className="flex justify-center">
              <TrophyIllustration championName={stats.champion?.name ?? null} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium tracking-[0.12em] uppercase text-[#5ca0ff]">
                  Championship Showpiece
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-[#f4f7fb]">
                  {finalTie.label}
                </h3>
                <p className="mt-1 text-xs text-[#b7c5da]">
                  Single-match decider. Winner status remains unconfirmed until the Final concludes.
                </p>
              </div>
              <TieCard
                tie={finalTie}
                timezoneMode={timezoneMode}
                isSelected={selectedTieId === finalTie.tieId}
                onSelect={onSelectTie}
              />
            </div>
          </div>

          {/* Stage Tabs */}
          <div
            role="tablist"
            aria-label="Knockout bracket stages"
            className="grid grid-cols-2 gap-1.5 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-1 sm:grid-cols-4"
          >
            {STAGE_ORDER.map((stage) => {
              const isActive = activeMobileStage === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveMobileStage(stage)}
                  className={`min-h-[44px] rounded px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#2f7bff] text-white'
                      : 'text-[#b7c5da] hover:bg-[#12203b] hover:text-[#f4f7fb]'
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </button>
              );
            })}
          </div>

          {/* Selected Stage Cards */}
          <div role="tabpanel" aria-label={STAGE_LABELS[activeMobileStage]}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {mobileStageTies.map((tie) => (
                <TieCard
                  key={tie.tieId}
                  tie={tie}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === tie.tieId}
                  onSelect={onSelectTie}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
