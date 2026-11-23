import React, {useState} from 'react';
import type {TimezoneMode} from '../config/competition';
import {getArabicClubDisplayName} from '../domain/arabicClubs';
import {
  computeOverviewStats,
  formatKickoffTime,
  STAGE_LABELS,
  STAGE_ORDER,
} from '../domain/knockoutEngine';
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

  const teamADisplay = getArabicClubDisplayName(tie.teamA);
  const teamBDisplay = getArabicClubDisplayName(tie.teamB);

  const firstScheduledLeg = tie.legs.find((m) => m.utcDate != null);
  const kickoffInfo = firstScheduledLeg
    ? formatKickoffTime(firstScheduledLeg.utcDate, timezoneMode)
    : null;

  const statusFooter = (() => {
    if (tie.advancement.status === 'CONFIRMED') {
      if (tie.advancement.method === 'PENALTIES' && tie.aggregate.penaltyScore) {
        return `ركلات الترجيح (${tie.aggregate.penaltyScore.teamA}–${tie.aggregate.penaltyScore.teamB})`;
      }
      if (tie.advancement.method === 'EXTRA_TIME') {
        return 'بعد الوقت الإضافي';
      }
      if (tie.advancement.method === 'AWARDED') {
        return 'قرار إداري';
      }
      return isFinal ? 'تأكّد البطل' : 'تأهل مؤكد بالمجموع';
    }
    if (tie.advancement.status === 'UNRESOLVED') {
      return 'النتيجة غير محسومة';
    }
    if (tie.teamA.isTbd && tie.teamB.isTbd) {
      return isFinal ? 'مباراة واحدة · بانتظار القرعة' : 'ذهاب وإياب · بانتظار القرعة';
    }
    if (tie.legs.some((l) => l.status === 'POSTPONED')) {
      return 'مباراة مؤجلة';
    }
    if (tie.legs.some((l) => l.status === 'IN_PLAY' || l.status === 'PAUSED')) {
      return 'جارية الآن (تحديث متأخر)';
    }
    if (tie.legs.length === 1 && tie.isTwoLegged) {
      return 'أُقيم الذهاب · بانتظار الإياب';
    }
    if (kickoffInfo) {
      return `${kickoffInfo.shortDateLabel} · ${kickoffInfo.timeLabel}`;
    }
    return isFinal ? 'مباراة واحدة' : 'مواجهة ذهاب وإياب';
  })();

  const scoreA =
    tie.aggregate.teamAScore != null ? String(tie.aggregate.teamAScore) : '—';
  const scoreB =
    tie.aggregate.teamBScore != null ? String(tie.aggregate.teamBScore) : '—';

  return (
    <button
      type="button"
      dir="rtl"
      onClick={() => onSelect(tie)}
      aria-label={`استعراض ${tie.label}: ${teamADisplay} ضد ${teamBDisplay}، ${statusFooter}`}
      className={`group w-full rounded-md border text-start transition-colors focus-visible:outline-none ${
        compact ? 'px-2.5 py-2' : 'px-3.5 py-3'
      } ${
        isSelected
          ? 'border-[#2f7bff] bg-[#142544]'
          : 'border-[#c4d2e8]/18 bg-[#0d172b] hover:border-[#5ca0ff]/55 hover:bg-[#12203b]'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-[#7f91ad]">
        <span className="truncate font-mono-tabular font-medium" dir="ltr">
          {tie.tieId}
        </span>
        {tie.advancement.status === 'UNRESOLVED' && (
          <span className="font-medium text-amber-300 shrink-0">غير محسوم</span>
        )}
        {tie.advancement.status === 'CONFIRMED' && (
          <span className="font-medium text-[#5ca0ff] shrink-0">مؤكد</span>
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
            {teamADisplay}
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
            {teamBDisplay}
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
  const championDisplay = stats.champion ? getArabicClubDisplayName(stats.champion) : null;

  return (
    <section
      id="bracket"
      aria-labelledby="bracket-heading"
      className="border-b border-[#c4d2e8]/12 bg-[#070d19]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5ca0ff]">مسار الأدوار الإقصائية</p>
            <h1
              id="bracket-heading"
              className="mt-1 font-display text-2xl font-bold text-[#f4f7fb] sm:text-3xl"
            >
              شجرة بطولة {snapshot.seasonLabel}
            </h1>
          </div>
          <p className="text-xs text-[#7f91ad]">
            اختر أي مواجهة لاستعراض تفاصيل الذهاب والإياب والمجموع وحداثة المصدر.
          </p>
        </div>

        {/* Desktop Inward-Flowing Bracket (xl >= 1280px) with explicit dir="ltr" spatial isolation */}
        <div className="hidden xl:block" dir="ltr">
          <div className="mb-4 grid grid-cols-[1fr_20px_1fr_20px_1fr_20px_236px_20px_1fr_20px_1fr_20px_1fr] items-center text-center text-xs font-medium text-[#7f91ad]">
            <span>{STAGE_LABELS.ROUND_OF_16}</span>
            <span />
            <span>{STAGE_LABELS.QUARTER_FINALS}</span>
            <span />
            <span>{STAGE_LABELS.SEMI_FINALS}</span>
            <span />
            <span className="text-[#d8e1ee]">النهائي والكأس</span>
            <span />
            <span>{STAGE_LABELS.SEMI_FINALS}</span>
            <span />
            <span>{STAGE_LABELS.QUARTER_FINALS}</span>
            <span />
            <span>{STAGE_LABELS.ROUND_OF_16}</span>
          </div>

          <div className="flex min-h-[560px] items-stretch">
            {/* LEFT HALF */}
            <div className="flex flex-1 items-stretch">
              <div className="flex flex-[2.15] flex-col justify-between gap-4">
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

              <LeftForkConnector />

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

            <div className="flex w-5 shrink-0 items-center" aria-hidden="true">
              <div className="h-px w-full bg-[#c4d2e8]/30" />
            </div>

            {/* CENTER AXIS */}
            <div className="relative flex w-[236px] shrink-0 flex-col items-center justify-center">
              <div className="pointer-events-none absolute inset-x-0 bottom-1/2 mb-[74px] flex justify-center">
                <TrophyIllustration champion={stats.champion} />
              </div>

              <div className="w-full">
                <TieCard
                  tie={finalTie}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === finalTie.tieId}
                  onSelect={onSelectTie}
                />
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 top-1/2 mt-[86px] text-center"
                dir="rtl"
              >
                {championDisplay ? (
                  <div className="rounded-md border border-[#2f7bff]/40 bg-[#10203d] px-3 py-2">
                    <p className="text-[11px] font-medium text-[#5ca0ff]">البطل</p>
                    <p className="font-display text-lg font-bold text-[#f4f7fb]">
                      {championDisplay}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#7f91ad]">يتحدد البطل بعد نهاية المباراة النهائية</p>
                )}
              </div>
            </div>

            <div className="flex w-5 shrink-0 items-center" aria-hidden="true">
              <div className="h-px w-full bg-[#c4d2e8]/30" />
            </div>

            {/* RIGHT HALF */}
            <div className="flex flex-1 items-stretch">
              <div className="flex flex-1 items-center">
                <TieCard
                  tie={sf2}
                  timezoneMode={timezoneMode}
                  isSelected={selectedTieId === sf2.tieId}
                  onSelect={onSelectTie}
                  compact
                />
              </div>

              <RightForkConnector />

              <div className="flex flex-[2.15] flex-col justify-between gap-4">
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
          <div className="grid grid-cols-1 items-center gap-6 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-5 md:grid-cols-[auto_1fr]">
            <div className="flex justify-center">
              <TrophyIllustration champion={stats.champion} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#5ca0ff]">واجهة اللقب</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-[#f4f7fb]">
                  {finalTie.label}
                </h2>
                <p className="mt-1 text-xs text-[#b7c5da]">
                  مباراة واحدة حاسمة. لا يُعتمد البطل إلا بعد صافرة النهاية وتوثيق النتيجة.
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

          <div
            role="tablist"
            aria-label="مراحل الأدوار الإقصائية"
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
