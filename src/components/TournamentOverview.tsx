import React from 'react';
import {COMPETITION_CONFIG, type TimezoneMode} from '../config/competition';
import {getArabicClubDisplayName} from '../domain/arabicClubs';
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
  nowMs?: number;
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
  nowMs,
}) => {
  const stats = computeOverviewStats(snapshot, nowMs);
  const nextFixture = stats.nextVerifiedFixture;
  const nextKickoff = nextFixture
    ? formatKickoffTime(nextFixture.utcDate, timezoneMode)
    : null;

  const localZoneName = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'المحلي';
    } catch {
      return 'المحلي';
    }
  })();

  const statusHeadline = (() => {
    if (isRetainedFallback) {
      return 'تعذر التحقق من التحديث — يتم عرض آخر لقطة صالحة محفوظة';
    }
    switch (snapshot.ingestionStatus) {
      case 'not_configured':
        return 'بانتظار الإعداد — لم تُنشر أول لقطة موثقة بعد';
      case 'awaiting_draw':
        return 'المصدر متصل — بانتظار نشر مباريات موسم 2026/27';
      case 'error':
        return 'اللقطة المنشورة غير متاحة حاليًا';
      case 'ok':
        return 'لقطة البيانات الموثقة نشطة (تحديث تلقائي متأخر)';
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
            <p className="text-xs font-semibold tracking-wide text-[#5ca0ff]">
              {snapshot.competitionName}
              <span aria-hidden="true" className="mx-2 text-[#7f91ad]">
                ·
              </span>
              موسم {snapshot.seasonLabel}
            </p>
            <h1
              id="overview-heading"
              className="font-display text-3xl font-bold leading-[1.2] text-[#f4f7fb] sm:text-5xl"
              style={{textWrap: 'balance'}}
            >
              مباريات ونتائج دوري أبطال أوروبا {snapshot.seasonLabel}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#b7c5da] sm:text-base">
              متابعة مباريات مرحلة الدوري والأدوار الإقصائية مرتبة حسب التاريخ بتوقيت مصر (نظام 12
              ساعة). يمكنك فتح تبويب الأدوار الإقصائية من الشريط السفلي لاستعراض شجرة البطولة والكأس.
            </p>
          </div>

          {/* Explicit Egypt Time Default Switcher */}
          <div className="flex flex-col items-start gap-1.5 lg:items-end">
            <span className="text-xs font-medium text-[#7f91ad]">منطقة توقيت العرض</span>
            <div
              role="group"
              aria-label="اختيار منطقة توقيت عرض المباريات"
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
                توقيت مصر (Africa/Cairo)
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
                التوقيت المحلي ({localZoneName})
              </button>
            </div>
          </div>
        </div>

        {/* Truthful Data-Derived Ledger Strip */}
        <dl className="mt-8 grid grid-cols-1 divide-y divide-[#c4d2e8]/12 border border-[#c4d2e8]/15 bg-[#0d172b] sm:grid-cols-2 sm:divide-x sm:divide-x-reverse sm:divide-y-0 lg:grid-cols-4">
          <div className="px-5 py-4">
            <dt className="text-xs font-medium text-[#7f91ad]">مباريات الموسم</dt>
            <dd className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#f4f7fb]">
              {stats.totalFixtures === 0 ? (
                '0 منشورة'
              ) : (
                <span dir="ltr" className="inline-block">
                  {stats.completedFixtures} / {stats.totalFixtures}
                </span>
              )}
            </dd>
            <p className="mt-1 text-xs text-[#7f91ad]">
              {stats.totalFixtures === 0
                ? 'لا توجد مباريات معتمدة منشورة حتى الآن'
                : `${stats.leagueStageFixtures} مرحلة الدوري · ${stats.knockoutBracketFixtures} إقصائية`}
            </p>
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium text-[#7f91ad]">مواجهات الأدوار الإقصائية</dt>
            <dd className="mt-1.5">
              <button
                type="button"
                onClick={onOpenKnockoutView}
                className="text-start group focus-visible:outline-none"
              >
                <span className="block">
                  <span
                    dir="ltr"
                    className="inline-block font-mono-tabular text-2xl font-semibold text-[#f4f7fb] group-hover:text-[#5ca0ff]"
                  >
                    {stats.tiesWithConfirmedParticipants} / {stats.totalTies}
                  </span>
                </span>
                <span className="mt-1 block text-xs text-[#7f91ad] group-hover:text-[#b7c5da]">
                  {stats.tiesWithConfirmedParticipants === 0
                    ? 'مواجهات دور الـ16 حتى النهائي لم تُحسم بعد · فتح الشجرة'
                    : `${stats.tiesDecided} من أصل ${stats.totalTies} مواجهة محسومة · عرض الشجرة`}
                </span>
              </button>
            </dd>
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium text-[#7f91ad]">المباراة القادمة المؤكدة</dt>
            {nextFixture && nextKickoff ? (
              <dd className="mt-1.5">
                <button
                  type="button"
                  onClick={() => onSelectMatch(nextFixture)}
                  className="text-start group focus-visible:outline-none"
                >
                  <span className="block text-sm font-semibold text-[#f4f7fb] group-hover:text-[#5ca0ff]">
                    {getArabicClubDisplayName(nextFixture.homeTeam)} ضد{' '}
                    {getArabicClubDisplayName(nextFixture.awayTeam)}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#b7c5da]">
                    {STAGE_LABELS[nextFixture.stage]}
                    {nextFixture.matchday ? ` · الجولة ${nextFixture.matchday}` : ''} ·{' '}
                    {nextKickoff.dateLabel} · {nextKickoff.timeLabel}
                  </span>
                </button>
              </dd>
            ) : (
              <>
                <dd className="mt-1.5 font-display text-xl font-semibold text-[#d8e1ee]">
                  {stats.totalFixtures > 0 ? 'انتهت جميع المباريات المدرجة' : 'بانتظار البيانات'}
                </dd>
                <p className="mt-1 text-xs text-[#7f91ad]">
                  {stats.totalFixtures > 0
                    ? 'لا توجد مباريات قادمة مجدولة في اللقطة الحالية'
                    : `لم يُوثق موعد قادم لموسم ${snapshot.seasonLabel} بعد`}
                </p>
              </>
            )}
          </div>

          <div className="px-5 py-4 sm:border-t lg:border-t-0">
            <dt className="text-xs font-medium text-[#7f91ad]">حداثة البيانات</dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#f4f7fb]">
              {snapshot.ingestedAtUtc ? formatRelativeAge(snapshot.ingestedAtUtc, nowMs) : 'لم تُحدّث بعد'}
            </dd>
            <p className="mt-1 text-xs text-[#7f91ad]">
              {snapshot.ingestedAtUtc
                ? `آخر مزامنة: ${formatUtcTimestamp(snapshot.ingestedAtUtc)}`
                : 'نموذج لقطات ثابتة مجدولة كل ساعة'}
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
            <p className="font-semibold text-[#f4f7fb]">{statusHeadline}</p>
            <p className="text-[#b7c5da]">
              {isRetainedFallback && recheckError
                ? `${recheckError} يتم عرض اللقطة الصالحة السابقة بتاريخ ${formatUtcTimestamp(snapshot.ingestedAtUtc)}.`
                : snapshot.statusMessage}
            </p>
          </div>
          <div className="shrink-0 text-[#7f91ad] sm:text-end">
            <p>يتم فحص ملف اللقطة الثابتة أثناء فتح التبويب فقط</p>
            <p className="font-mono-tabular">
              المصدر: {COMPETITION_CONFIG.providerName} (تحديث مجدول متأخر)
              {lastCheckedAtUtc ? ` · آخر فحص ${formatRelativeAge(lastCheckedAtUtc, nowMs)}` : ''}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
