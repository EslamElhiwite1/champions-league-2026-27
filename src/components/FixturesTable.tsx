import React, {useEffect, useMemo, useState} from 'react';
import {Calendar, ChevronLeft, ChevronRight, Search, Tv, X} from 'lucide-react';
import {
  BROADCASTER_SCHEDULE_META,
  getVerifiedMatchBroadcaster,
  type TimezoneMode,
} from '../config/competition';
import {getArabicClubDisplayName, getTeamSearchHaystack} from '../domain/arabicClubs';
import {
  ALL_STAGE_ORDER,
  formatKickoffTime,
  getCalendarDateKey,
  getTodayDateKey,
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
  nowMs?: number;
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

function getMatchScoreDisplay(match: KnockoutMatch): {
  hasScore: boolean;
  homeGoals: string;
  awayGoals: string;
  note: string | null;
} {
  if (match.score.isScoreAmbiguous) {
    return {
      hasScore: false,
      homeGoals: '—',
      awayGoals: '—',
      note: 'تفصيل النتيجة يتطلب مراجعة',
    };
  }

  const open = match.score.openPlay;
  if (!open || open.home == null || open.away == null) {
    if (match.status === 'POSTPONED') {
      return {hasScore: false, homeGoals: '—', awayGoals: '—', note: 'مؤجلة'};
    }
    if (match.status === 'CANCELLED') {
      return {hasScore: false, homeGoals: '—', awayGoals: '—', note: 'ملغاة'};
    }
    if (match.status === 'SUSPENDED') {
      return {hasScore: false, homeGoals: '—', awayGoals: '—', note: 'معلقة'};
    }
    return {hasScore: false, homeGoals: '—', awayGoals: '—', note: null};
  }

  let note: string | null = null;
  if (match.score.duration === 'PENALTY_SHOOTOUT' && match.score.penalties) {
    const p = match.score.penalties;
    note = `ركلات الترجيح ${p.home ?? '—'}–${p.away ?? '—'}`;
  } else if (match.score.duration === 'EXTRA_TIME') {
    note = 'بعد الوقت الإضافي';
  } else if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
    note = 'جارية (تحديث متأخر)';
  }

  return {
    hasScore: true,
    homeGoals: String(open.home),
    awayGoals: String(open.away),
    note,
  };
}

export interface CalendarDateGroup {
  dateKey: string;
  dateLabel: string;
  shortDateLabel: string;
  isUpcomingOrCurrent: boolean;
  matches: KnockoutMatch[];
}

/**
 * Selects the default single match calendar day:
 * 1) Today (`todayKey`) if it has at least one match
 * 2) Otherwise the nearest future match date (`dateKey > todayKey`)
 * 3) Otherwise the most recent past match date (`dateKey < todayKey`)
 * 4) Otherwise `'TBD'` if only undated matches exist
 */
export function resolveDefaultDateKey(
  groups: Pick<CalendarDateGroup, 'dateKey'>[],
  todayKey: string,
): string | null {
  if (groups.length === 0) return null;

  if (groups.some((g) => g.dateKey === todayKey)) {
    return todayKey;
  }

  const futureKeys = groups
    .map((g) => g.dateKey)
    .filter((key) => key !== 'TBD' && key > todayKey)
    .sort((a, b) => a.localeCompare(b));
  if (futureKeys.length > 0) {
    return futureKeys[0];
  }

  const pastKeys = groups
    .map((g) => g.dateKey)
    .filter((key) => key !== 'TBD' && key < todayKey)
    .sort((a, b) => b.localeCompare(a));
  if (pastKeys.length > 0) {
    return pastKeys[0];
  }

  return groups.some((g) => g.dateKey === 'TBD') ? 'TBD' : groups[0].dateKey;
}

const BroadcasterSlot: React.FC<{match: KnockoutMatch}> = ({match}) => {
  const broadcaster = getVerifiedMatchBroadcaster(match);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [broadcaster?.channelLogoUrl]);

  if (!broadcaster) {
    return (
      <span
        data-slot="broadcaster"
        className="inline-flex min-w-0 items-center gap-1.5 text-[11px] leading-tight text-[#7f91ad]"
      >
        <Tv className="h-3.5 w-3.5 shrink-0 text-[#7f91ad]" aria-hidden="true" />
        <span className="truncate">القناة لم تُؤكد بعد</span>
      </span>
    );
  }

  return (
    <span
      data-slot="broadcaster"
      className="inline-flex min-w-0 items-center gap-2 text-[11px] leading-tight text-[#d8e1ee]"
    >
      {!logoFailed ? (
        <span className="inline-flex h-6 shrink-0 items-center justify-center rounded bg-white px-1.5 py-0.5 ring-1 ring-[#c4d2e8]/30">
          <img
            src={broadcaster.channelLogoUrl}
            alt={`شعار ${broadcaster.channelName}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setLogoFailed(true)}
            className="h-3.5 w-auto object-contain"
          />
        </span>
      ) : (
        <Tv className="h-3.5 w-3.5 shrink-0 text-[#8dc0ff]" aria-hidden="true" />
      )}
      <span dir="ltr" className="truncate font-medium text-[#d8e1ee]">
        {broadcaster.channelName}
      </span>
    </span>
  );
};

export const FixturesTable: React.FC<FixturesTableProps> = ({
  snapshot,
  timezoneMode,
  onSelectTie,
  onSelectMatch,
  onOpenKnockoutView,
  nowMs,
}) => {
  const [stageFilter, setStageFilter] = useState<'ALL' | CompetitionStage>('ALL');
  const [matchdayFilter, setMatchdayFilter] = useState<'ALL' | number>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MatchStatus>('ALL');
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const tieMap = useMemo(
    () => new Map(snapshot.ties.map((tie) => [tie.tieId, tie])),
    [snapshot.ties],
  );

  const todayKey = useMemo(
    () => getTodayDateKey(timezoneMode, nowMs),
    [timezoneMode, nowMs],
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

  const hasSearchOrAttributeFilter =
    stageFilter !== 'ALL' ||
    matchdayFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    teamSearch.trim() !== '';

  const filteredMatches = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    return snapshot.matches.filter((match) => {
      if (stageFilter !== 'ALL' && match.stage !== stageFilter) return false;
      if (matchdayFilter !== 'ALL' && match.matchday !== matchdayFilter) return false;
      if (statusFilter !== 'ALL' && match.status !== statusFilter) return false;
      if (q) {
        const homeHaystack = getTeamSearchHaystack(match.homeTeam);
        const awayHaystack = getTeamSearchHaystack(match.awayTeam);
        if (!homeHaystack.includes(q) && !awayHaystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [snapshot.matches, stageFilter, matchdayFilter, statusFilter, teamSearch]);

  // Chronological calendar days available after filtering (dated ascending, TBD last)
  const allDateGroups = useMemo<CalendarDateGroup[]>(() => {
    const groupsMap = new Map<string, CalendarDateGroup>();

    for (const match of filteredMatches) {
      const dateKey = getCalendarDateKey(match.utcDate, timezoneMode);
      const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
      const existing = groupsMap.get(dateKey);
      if (existing) {
        existing.matches.push(match);
      } else {
        groupsMap.set(dateKey, {
          dateKey,
          dateLabel: dateKey === 'TBD' ? 'التاريخ يُحدد لاحقًا' : kickoff.dateLabel,
          shortDateLabel: dateKey === 'TBD' ? 'يُحدد لاحقًا' : kickoff.shortDateLabel,
          isUpcomingOrCurrent: dateKey === 'TBD' || dateKey >= todayKey,
          matches: [match],
        });
      }
    }

    const dated = Array.from(groupsMap.values())
      .filter((g) => g.dateKey !== 'TBD')
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const tbd = groupsMap.get('TBD');
    return tbd ? [...dated, tbd] : dated;
  }, [filteredMatches, timezoneMode, todayKey]);

  const defaultDateKey = useMemo(
    () => resolveDefaultDateKey(allDateGroups, todayKey),
    [allDateGroups, todayKey],
  );

  // Enforce strictly ONE selected calendar day rendered at any time
  const effectiveSelectedDateKey = useMemo(() => {
    if (allDateGroups.length === 0) return null;
    if (selectedDateKey && allDateGroups.some((g) => g.dateKey === selectedDateKey)) {
      return selectedDateKey;
    }
    return defaultDateKey;
  }, [allDateGroups, selectedDateKey, defaultDateKey]);

  const activeDateGroup = useMemo(() => {
    if (!effectiveSelectedDateKey) return null;
    return allDateGroups.find((g) => g.dateKey === effectiveSelectedDateKey) ?? null;
  }, [allDateGroups, effectiveSelectedDateKey]);

  const activeDateIndex = useMemo(() => {
    if (!activeDateGroup) return -1;
    return allDateGroups.findIndex((g) => g.dateKey === activeDateGroup.dateKey);
  }, [allDateGroups, activeDateGroup]);

  const hasCustomDateSelection =
    effectiveSelectedDateKey !== null && effectiveSelectedDateKey !== defaultDateKey;

  const hasAnyActiveFilter = hasSearchOrAttributeFilter || hasCustomDateSelection;

  const resetFilters = () => {
    setStageFilter('ALL');
    setMatchdayFilter('ALL');
    setStatusFilter('ALL');
    setTeamSearch('');
    setSelectedDateKey(null);
  };

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
      className="overflow-x-hidden border-b border-[#c4d2e8]/12 bg-[#070d19]"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5ca0ff]">جدول الموسم والنتائج</p>
            <h2
              id="matches-heading"
              className="mt-1 font-display text-2xl font-bold text-[#f4f7fb] sm:text-3xl"
            >
              المباريات حسب التاريخ
            </h2>
          </div>
          <p className="font-mono-tabular text-xs text-[#7f91ad]">
            عرض {activeDateGroup ? activeDateGroup.matches.length : 0} من أصل{' '}
            {snapshot.matches.length} مباراة موثقة ·{' '}
            {timezoneMode === 'cairo' ? 'توقيت مصر (نظام 12 ساعة)' : 'التوقيت المحلي (نظام 12 ساعة)'}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] p-4 md:grid-cols-[1fr_180px_150px_170px_auto] md:items-end">
          <div>
            <label htmlFor="team-search-input" className="block text-xs font-medium text-[#b7c5da]">
              البحث باسم النادي
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-[#7f91ad]"
                aria-hidden="true"
              />
              <input
                id="team-search-input"
                type="search"
                value={teamSearch}
                onChange={(e) => {
                  setTeamSearch(e.target.value);
                  setSelectedDateKey(null);
                }}
                placeholder="ابحث بالعربية أو بالإنجليزية أو الرمز…"
                className="min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] py-2 ps-9 pe-3 text-sm text-[#f4f7fb] placeholder:text-[#7f91ad] focus:border-[#2f7bff] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stage-filter-select" className="block text-xs font-medium text-[#b7c5da]">
              المرحلة
            </label>
            <select
              id="stage-filter-select"
              value={stageFilter}
              onChange={(e) => {
                setStageFilter(e.target.value as 'ALL' | CompetitionStage);
                setSelectedDateKey(null);
              }}
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">جميع المراحل</option>
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
              الجولة
            </label>
            <select
              id="matchday-filter-select"
              value={matchdayFilter === 'ALL' ? 'ALL' : String(matchdayFilter)}
              onChange={(e) => {
                setMatchdayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                setSelectedDateKey(null);
              }}
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">جميع الجولات</option>
              {availableMatchdays.map((md) => (
                <option key={md} value={String(md)}>
                  الجولة {md}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="status-filter-select"
              className="block text-xs font-medium text-[#b7c5da]"
            >
              حالة المباراة
            </label>
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'ALL' | MatchStatus);
                setSelectedDateKey(null);
              }}
              className="mt-1.5 min-h-[44px] w-full rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-2 text-sm text-[#f4f7fb] focus:border-[#2f7bff] focus:outline-none"
            >
              <option value="ALL">جميع الحالات</option>
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
            disabled={!hasAnyActiveFilter}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded border border-[#c4d2e8]/20 bg-[#12203b] px-4 py-2 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>إعادة تعيين الفلاتر</span>
          </button>
        </div>

        {/* Prominent Single-Day Chooser Above Cards */}
        {snapshot.matches.length > 0 && allDateGroups.length > 0 && (
          <div
            role="region"
            aria-label="اختيار يوم المباريات"
            className="mb-7 space-y-3 rounded-lg border border-[#2f7bff]/30 bg-[#0d172b] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#f4f7fb]">
                <Calendar className="h-4 w-4 shrink-0 text-[#5ca0ff]" aria-hidden="true" />
                <span>اختر يوم المباريات</span>
                <span className="font-mono-tabular font-normal text-[#7f91ad]">
                  ({allDateGroups.length}{' '}
                  {allDateGroups.length === 1 ? 'يوم متاح' : allDateGroups.length <= 10 ? 'أيام متاحة' : 'يومًا متاحًا'})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDateIndex > 0) {
                      setSelectedDateKey(allDateGroups[activeDateIndex - 1].dateKey);
                    }
                  }}
                  disabled={activeDateIndex <= 0}
                  aria-label="اليوم السابق"
                  className="inline-flex min-h-[40px] items-center gap-1 rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-1.5 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>اليوم السابق</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeDateIndex >= 0 && activeDateIndex < allDateGroups.length - 1) {
                      setSelectedDateKey(allDateGroups[activeDateIndex + 1].dateKey);
                    }
                  }}
                  disabled={activeDateIndex < 0 || activeDateIndex >= allDateGroups.length - 1}
                  aria-label="اليوم التالي"
                  className="inline-flex min-h-[40px] items-center gap-1 rounded border border-[#c4d2e8]/20 bg-[#070d19] px-3 py-1.5 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>اليوم التالي</span>
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <label className="block text-xs text-[#b7c5da]">
              اليوم المعروض
              <select
                aria-label="اليوم المعروض"
                value={effectiveSelectedDateKey ?? ''}
                onChange={(event) => setSelectedDateKey(event.target.value)}
                className="mt-2 min-h-[44px] w-full rounded border border-[#2f7bff]/40 bg-[#070d19] px-3 py-2 text-sm text-white"
              >
                {allDateGroups.map((group) => (
                  <option key={group.dateKey} value={group.dateKey}>
                    {group.dateLabel} · {group.matches.length} مباريات
                  </option>
                ))}
              </select>
            </label>

            <div
              role="group"
              aria-label="قائمة تواريخ المباريات المتاحة"
              className="flex items-center gap-2 overflow-x-auto pb-1"
            >
              {allDateGroups.map((group) => {
                const isSelected = group.dateKey === activeDateGroup?.dateKey;
                const isToday = group.dateKey === todayKey;
                const dayStatusTag = isToday
                  ? 'اليوم'
                  : !group.isUpcomingOrCurrent
                    ? 'سابق'
                    : null;

                return (
                  <button
                    key={group.dateKey}
                    type="button"
                    data-date-key={group.dateKey}
                    onClick={() => setSelectedDateKey(group.dateKey)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-md border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'border-[#2f7bff] bg-[#2f7bff] text-white'
                        : group.isUpcomingOrCurrent
                          ? 'border-[#5ca0ff]/35 bg-[#12203b] text-[#f4f7fb] hover:border-[#2f7bff]'
                          : 'border-[#c4d2e8]/18 bg-[#070d19] text-[#b7c5da] hover:border-[#5ca0ff]/50 hover:text-white'
                    }`}
                  >
                    <span>{group.shortDateLabel}</span>
                    {dayStatusTag && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#10203d] text-[#8dc0ff]'
                        }`}
                      >
                        {dayStatusTag}
                      </span>
                    )}
                    <span
                      dir="ltr"
                      className={`rounded px-1.5 py-0.5 font-mono-tabular text-[11px] ${
                        isSelected
                          ? 'bg-black/20 text-white'
                          : 'bg-[#070d19]/75 text-[#8dc0ff]'
                      }`}
                    >
                      {group.matches.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Truthful Empty States */}
        {snapshot.matches.length === 0 ? (
          <div className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-[#f4f7fb]">
              لا توجد مباريات منشورة لموسم {snapshot.seasonLabel} بعد
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#b7c5da]">
              {snapshot.ingestionStatus === 'not_configured'
                ? 'لم تُنفذ أول مزامنة موثقة بعد. فور نشر لقطة بيانات دوري أبطال أوروبا 2026/27، ستظهر جميع مباريات مرحلة الدوري والأدوار الإقصائية مرتبة حسب التاريخ بتوقيت مصر.'
                : 'لا تتوفر مباريات منشورة في اللقطة الموثقة الحالية حتى الآن.'}
            </p>
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onOpenKnockoutView}
                className="inline-flex min-h-[44px] items-center rounded border border-[#2f7bff]/60 bg-[#2f7bff]/15 px-4 py-2 text-xs font-medium text-[#f4f7fb] transition-colors hover:bg-[#2f7bff]/25"
              >
                فتح شجرة الأدوار الإقصائية
              </button>
            </div>
          </div>
        ) : !activeDateGroup ? (
          <div className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-[#f4f7fb]">
              لا توجد مباريات مطابقة للبحث أو التصفية الحالية
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#b7c5da]">
              جرّب مسح البحث أو تغيير الفلاتر أو إعادة تعيين الفلاتر للعودة إلى يوم المباريات الافتراضي.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-[44px] items-center rounded bg-[#2f7bff] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#4188ff]"
              >
                إعادة تعيين جميع الفلاتر
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-9">
            <section
              key={activeDateGroup.dateKey}
              data-testid="active-date-group"
              data-date-key={activeDateGroup.dateKey}
              aria-label={`مباريات ${activeDateGroup.dateLabel}`}
              className="space-y-4"
            >
              {/* Unmissable Full Arabic Weekday + Date Heading with Blue Date Separator */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#2f7bff] pb-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[#2f7bff]"
                  />
                  <h3 className="font-display text-xl font-bold text-[#f4f7fb] sm:text-2xl">
                    {activeDateGroup.dateLabel}
                  </h3>
                  <span className="rounded border border-[#2f7bff]/40 bg-[#10203d] px-2 py-0.5 text-[11px] font-medium text-[#8dc0ff]">
                    {activeDateGroup.dateKey === todayKey
                      ? 'اليوم'
                      : activeDateGroup.isUpcomingOrCurrent
                        ? 'قادمة / جارية'
                        : 'نتائج سابقة'}
                  </span>
                </div>
                <span className="font-mono-tabular text-xs font-medium text-[#b7c5da]">
                  {activeDateGroup.matches.length}{' '}
                  {activeDateGroup.matches.length === 1
                    ? 'مباراة'
                    : activeDateGroup.matches.length === 2
                      ? 'مباراتان'
                      : activeDateGroup.matches.length <= 10
                        ? 'مباريات'
                        : 'مباراة'}
                </span>
              </div>

              {/* Unified Facing-Off Daily Fixture Cards for Both Mobile (1 col) and Desktop (2-3 cols) */}
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                {activeDateGroup.matches.map((match) => {
                    const kickoff = formatKickoffTime(match.utcDate, timezoneMode);
                    const scoreInfo = getMatchScoreDisplay(match);
                    const homeName = getArabicClubDisplayName(match.homeTeam);
                    const awayName = getArabicClubDisplayName(match.awayTeam);
                    const contextLabel = match.tieId
                      ? match.isSingleMatch
                        ? 'مباراة نهائية'
                        : `${match.leg === 1 ? 'الذهاب' : 'الإياب'} · ${match.tieId}`
                      : match.matchday != null
                        ? `الجولة ${match.matchday}`
                        : 'مباراة موسمية';

                    return (
                      <article
                        key={match.matchId}
                        data-testid={`fixture-card-${match.matchId}`}
                        className="flex min-w-0 flex-col justify-between rounded-lg border border-[#c4d2e8]/16 bg-[#0d172b] transition-colors hover:border-[#2f7bff]/50"
                      >
                        {/* Compact Competition / Matchday / Status Top Strip */}
                        <div className="flex items-center justify-between gap-2 border-b border-[#c4d2e8]/10 bg-[#101c34]/80 px-3.5 py-2 text-[11px]">
                          <span className="min-w-0 font-medium text-[#8dc0ff]">
                            {STAGE_LABELS[match.stage]} · {contextLabel}
                          </span>
                          <span
                            className={`shrink-0 font-semibold ${
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
                        </div>

                        {/* 3-Column Facing Matchup Grid (RTL: Col 1 Right = Home, Col 2 Center = VS/Score + Time, Col 3 Left = Away) */}
                        <div
                          data-slot="matchup-grid"
                          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 px-3 py-4 sm:px-4"
                        >
                          {/* HOME TEAM (Right in RTL) */}
                          <div
                            data-slot="home-team"
                            className="flex min-w-0 flex-col items-center gap-2 text-center"
                          >
                            <TeamMonogram team={match.homeTeam} size="card" />
                            <span
                              className={`w-full text-center text-xs font-semibold leading-snug break-words sm:text-sm ${
                                match.homeTeam.isTbd ? 'text-[#7f91ad]' : 'text-[#f4f7fb]'
                              }`}
                            >
                              {homeName}
                            </span>
                          </div>

                          {/* CENTER: VS / Score + 12-Hour Kickoff Time Directly Below */}
                          <div
                            data-slot="match-center"
                            className="flex shrink-0 flex-col items-center justify-center gap-1 px-1.5 text-center"
                          >
                            {scoreInfo.hasScore ? (
                              <div
                                className="flex items-center gap-1.5 rounded border border-[#c4d2e8]/15 bg-[#070d19] px-2.5 py-1 font-mono-tabular text-base font-bold text-[#f4f7fb] sm:text-lg"
                                aria-label={`النتيجة ${scoreInfo.homeGoals} مقابل ${scoreInfo.awayGoals}`}
                              >
                                <span>{scoreInfo.homeGoals}</span>
                                <span className="text-[#5ca0ff]">–</span>
                                <span>{scoreInfo.awayGoals}</span>
                              </div>
                            ) : (
                              <span
                                className="inline-flex min-w-[44px] items-center justify-center rounded border border-[#c4d2e8]/18 bg-[#070d19] px-2.5 py-1 font-mono-tabular text-xs font-bold tracking-wider text-[#8dc0ff]"
                                dir="ltr"
                              >
                                VS
                              </span>
                            )}

                            <span className="mt-0.5 text-xs font-semibold text-[#f4f7fb] whitespace-nowrap">
                              {kickoff.timeLabel}
                            </span>
                            <span className="text-[10px] text-[#7f91ad] whitespace-nowrap">
                              {kickoff.tzLabel}
                            </span>

                            {scoreInfo.note && (
                              <span className="mt-0.5 max-w-[120px] text-[10px] leading-tight text-[#b7c5da]">
                                {scoreInfo.note}
                              </span>
                            )}
                          </div>

                          {/* AWAY TEAM (Left in RTL) */}
                          <div
                            data-slot="away-team"
                            className="flex min-w-0 flex-col items-center gap-2 text-center"
                          >
                            <TeamMonogram team={match.awayTeam} size="card" />
                            <span
                              className={`w-full text-center text-xs font-semibold leading-snug break-words sm:text-sm ${
                                match.awayTeam.isTbd ? 'text-[#7f91ad]' : 'text-[#f4f7fb]'
                              }`}
                            >
                              {awayName}
                            </span>
                          </div>
                        </div>

                        {/* Compact Broadcaster & Details Action Bar (Min 44px touch target) */}
                        <div className="flex items-center justify-between gap-2 border-t border-[#c4d2e8]/10 px-3.5 py-2">
                          <BroadcasterSlot match={match} />
                          <button
                            type="button"
                            onClick={() => handleInspect(match)}
                            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded border border-[#c4d2e8]/20 bg-[#12203b] px-3.5 py-2 text-xs font-medium text-[#f4f7fb] transition-colors hover:border-[#2f7bff] hover:bg-[#17294b] whitespace-nowrap"
                          >
                            {match.tieId ? 'تفاصيل المواجهة' : 'تفاصيل المباراة'}
                          </button>
                        </div>
                      </article>
                    );
                })}
              </div>
            </section>

            {/* Expandable Source / Check-Date Note for Egypt Broadcaster Schedule */}
            <details className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b]/80 px-4 py-3 text-xs text-[#9fb1ca]">
              <summary className="cursor-pointer font-medium text-[#d8e1ee] hover:text-white">
                مصدر جدول القنوات الناقلة في مصر (تاريخ التحقق:{' '}
                <span dir="ltr" className="font-mono-tabular">
                  {BROADCASTER_SCHEDULE_META.checkedAt}
                </span>
                )
              </summary>
              <div className="mt-2.5 space-y-1.5 leading-relaxed">
                <p>
                  أرقام القنوات المعروضة تخص البث المباشر فقط وتم التحقق منها من دليل{' '}
                  <a
                    href={BROADCASTER_SCHEDULE_META.tvGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8dc0ff] underline underline-offset-4 hover:text-white"
                  >
                    beIN SPORTS MENA الرسمي
                  </a>{' '}
                  بتاريخ{' '}
                  <span dir="ltr" className="font-mono-tabular">
                    {BROADCASTER_SCHEDULE_META.checkedAt}
                  </span>{' '}
                  ليومي 24 و25 نوفمبر 2026، وهو جدول موثق بتاريخ الفحص وليس تغذية آلية حية للقنوات.
                </p>
                <p>
                  المباريات الأخرى (التاريخية أو المستقبلية غير المدرجة في الدليل المحقق) تعرض «القناة
                  لم تُؤكد بعد» دون تخمين رقم القناة من الحقوق العامة. يؤكد{' '}
                  <a
                    href={BROADCASTER_SCHEDULE_META.rightsAnnouncementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8dc0ff] underline underline-offset-4 hover:text-white"
                  >
                    بيان حقوق البث حتى 2027
                  </a>{' '}
                  حقوق الشبكة في المنطقة دون تحديد قنوات المباريات الفردية. تُستخدم شعارات القنوات
                  الرسمية للتعريف التحريري فقط دون أي رعاية أو اعتماد رسمي.
                </p>
              </div>
            </details>
          </div>
        )}
      </div>
    </section>
  );
};
