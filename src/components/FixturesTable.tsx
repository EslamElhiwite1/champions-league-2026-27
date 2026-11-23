import React, {useMemo, useState} from 'react';
import {Search, X} from 'lucide-react';
import type {TimezoneMode} from '../config/competition';
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

type DateScope = 'upcoming' | 'past' | 'all';

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

interface CalendarDateGroup {
  dateKey: string;
  dateLabel: string;
  shortDateLabel: string;
  isUpcomingOrCurrent: boolean;
  matches: KnockoutMatch[];
}

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
  const [userDateScope, setUserDateScope] = useState<DateScope | null>(null);

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

  const hasAnyActiveFilter =
    hasSearchOrAttributeFilter || selectedDateKey !== null || userDateScope !== null;

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

    const upcoming = Array.from(groupsMap.values())
      .filter((g) => g.isUpcomingOrCurrent && g.dateKey !== 'TBD')
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const past = Array.from(groupsMap.values())
      .filter((g) => !g.isUpcomingOrCurrent)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    const tbd = groupsMap.get('TBD');

    return [...upcoming, ...past, ...(tbd ? [tbd] : [])];
  }, [filteredMatches, timezoneMode, todayKey]);

  const upcomingGroups = useMemo(
    () => allDateGroups.filter((g) => g.isUpcomingOrCurrent),
    [allDateGroups],
  );
  const pastGroups = useMemo(
    () => allDateGroups.filter((g) => !g.isUpcomingOrCurrent),
    [allDateGroups],
  );

  const effectiveDateScope: DateScope = useMemo(() => {
    if (userDateScope) return userDateScope;
    if (hasSearchOrAttributeFilter || selectedDateKey) return 'all';
    return upcomingGroups.length > 0 ? 'upcoming' : 'all';
  }, [userDateScope, hasSearchOrAttributeFilter, selectedDateKey, upcomingGroups.length]);

  const visibleDateGroups = useMemo(() => {
    if (selectedDateKey) {
      return allDateGroups.filter((g) => g.dateKey === selectedDateKey);
    }
    if (effectiveDateScope === 'upcoming') {
      return upcomingGroups;
    }
    if (effectiveDateScope === 'past') {
      return pastGroups;
    }
    return allDateGroups;
  }, [allDateGroups, upcomingGroups, pastGroups, effectiveDateScope, selectedDateKey]);

  const visibleMatchesCount = useMemo(
    () => visibleDateGroups.reduce((sum, g) => sum + g.matches.length, 0),
    [visibleDateGroups],
  );

  const resetFilters = () => {
    setStageFilter('ALL');
    setMatchdayFilter('ALL');
    setStatusFilter('ALL');
    setTeamSearch('');
    setSelectedDateKey(null);
    setUserDateScope(null);
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
            عرض {visibleMatchesCount} من أصل {snapshot.matches.length} مباراة موثقة ·{' '}
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

        {/* Immediately Visible Date Navigation Strip */}
        {snapshot.matches.length > 0 && (
          <div
            aria-label="التنقل السريع حسب تواريخ المباريات"
            className="mb-8 space-y-3 rounded-md border border-[#c4d2e8]/15 bg-[#0d172b]/80 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="نطاق التواريخ المعروضة"
                className="inline-flex flex-wrap gap-1.5 rounded-md border border-[#c4d2e8]/15 bg-[#070d19] p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(null);
                    setUserDateScope('upcoming');
                  }}
                  aria-pressed={effectiveDateScope === 'upcoming' && selectedDateKey === null}
                  disabled={upcomingGroups.length === 0}
                  className={`min-h-[40px] rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-45 ${
                    effectiveDateScope === 'upcoming' && selectedDateKey === null
                      ? 'bg-[#2f7bff] text-white'
                      : 'text-[#b7c5da] hover:text-[#f4f7fb]'
                  }`}
                >
                  القادمة والحالية ({upcomingGroups.reduce((s, g) => s + g.matches.length, 0)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(null);
                    setUserDateScope('past');
                  }}
                  aria-pressed={effectiveDateScope === 'past' && selectedDateKey === null}
                  disabled={pastGroups.length === 0}
                  className={`min-h-[40px] rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap disabled:opacity-45 ${
                    effectiveDateScope === 'past' && selectedDateKey === null
                      ? 'bg-[#2f7bff] text-white'
                      : 'text-[#b7c5da] hover:text-[#f4f7fb]'
                  }`}
                >
                  النتائج السابقة ({pastGroups.reduce((s, g) => s + g.matches.length, 0)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(null);
                    setUserDateScope('all');
                  }}
                  aria-pressed={effectiveDateScope === 'all' && selectedDateKey === null}
                  className={`min-h-[40px] rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    effectiveDateScope === 'all' && selectedDateKey === null
                      ? 'bg-[#2f7bff] text-white'
                      : 'text-[#b7c5da] hover:text-[#f4f7fb]'
                  }`}
                >
                  جميع التواريخ ({filteredMatches.length})
                </button>
              </div>

              {selectedDateKey && (
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(null)}
                  className="min-h-[40px] rounded border border-[#c4d2e8]/20 bg-[#12203b] px-3 py-1.5 text-xs font-medium text-[#f4f7fb] hover:border-[#2f7bff]"
                >
                  إظهار كل تواريخ النطاق
                </button>
              )}
            </div>

            {allDateGroups.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="shrink-0 text-xs font-medium text-[#7f91ad]">انتقال لتاريخ:</span>
                {allDateGroups.map((group) => {
                  const isActiveDate = selectedDateKey === group.dateKey;
                  return (
                    <button
                      key={group.dateKey}
                      type="button"
                      onClick={() =>
                        setSelectedDateKey(isActiveDate ? null : group.dateKey)
                      }
                      aria-pressed={isActiveDate}
                      className={`min-h-[38px] shrink-0 rounded border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        isActiveDate
                          ? 'border-[#2f7bff] bg-[#2f7bff] text-white'
                          : group.isUpcomingOrCurrent
                            ? 'border-[#5ca0ff]/35 bg-[#12203b] text-[#f4f7fb] hover:border-[#2f7bff]'
                            : 'border-[#c4d2e8]/15 bg-[#070d19] text-[#b7c5da] hover:border-[#5ca0ff]/50 hover:text-white'
                      }`}
                    >
                      {group.shortDateLabel}
                    </button>
                  );
                })}
              </div>
            )}
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
        ) : visibleDateGroups.length === 0 ? (
          <div className="rounded-md border border-[#c4d2e8]/15 bg-[#0d172b] px-6 py-10 text-center">
            <h3 className="font-display text-xl font-semibold text-[#f4f7fb]">
              لا توجد مباريات مطابقة للبحث أو التصفية الحالية
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-[#b7c5da]">
              جرّب مسح البحث أو التبديل إلى جميع التواريخ أو إعادة تعيين الفلاتر.
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
            {visibleDateGroups.map((group) => (
              <section
                key={group.dateKey}
                aria-label={`مباريات ${group.dateLabel}`}
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
                      {group.dateLabel}
                    </h3>
                    <span className="rounded border border-[#2f7bff]/40 bg-[#10203d] px-2 py-0.5 text-[11px] font-medium text-[#8dc0ff]">
                      {group.isUpcomingOrCurrent ? 'قادمة / جارية' : 'نتائج سابقة'}
                    </span>
                  </div>
                  <span className="font-mono-tabular text-xs font-medium text-[#b7c5da]">
                    {group.matches.length}{' '}
                    {group.matches.length === 1
                      ? 'مباراة'
                      : group.matches.length === 2
                        ? 'مباراتان'
                        : group.matches.length <= 10
                          ? 'مباريات'
                          : 'مباراة'}
                  </span>
                </div>

                {/* Unified Facing-Off Daily Fixture Cards for Both Mobile (1 col) and Desktop (2-3 cols) */}
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
                  {group.matches.map((match) => {
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

                        {/* Compact Details Action Bar (Min 44px touch target) */}
                        <div className="flex items-center justify-between gap-2 border-t border-[#c4d2e8]/10 px-3.5 py-2">
                          <span className="min-w-0 text-[11px] leading-tight text-[#7f91ad]">
                            {kickoff.dateLabel}
                          </span>
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
