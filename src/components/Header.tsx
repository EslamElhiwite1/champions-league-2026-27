import React from 'react';
import {RefreshCw} from 'lucide-react';
import {COMPETITION_CONFIG} from '../config/competition';
import {formatRelativeAge} from '../domain/knockoutEngine';
import type {KnockoutSnapshot} from '../types/knockout';
import type {ActiveAppView} from './BottomNav';

interface HeaderProps {
  snapshot: KnockoutSnapshot | null;
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  isRefreshing: boolean;
  isRetainedFallback: boolean;
  onRecheck: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  activeView,
  onSelectView,
  isRefreshing,
  isRetainedFallback,
  onRecheck,
}) => {
  const seasonLabel = snapshot?.seasonLabel ?? COMPETITION_CONFIG.seasonLabel;
  const statusText = (() => {
    if (!snapshot) return 'جاري التحميل';
    if (isRetainedFallback) {
      return `نسخة محفوظة (${formatRelativeAge(snapshot.ingestedAtUtc)})`;
    }
    if (snapshot.ingestionStatus === 'not_configured') {
      return 'بانتظار الإعداد';
    }
    if (snapshot.ingestionStatus === 'awaiting_draw') {
      return 'بانتظار المباريات';
    }
    if (snapshot.ingestionStatus === 'error') {
      return 'البيانات غير متاحة';
    }
    return `تحديث ${formatRelativeAge(snapshot.ingestedAtUtc)}`;
  })();

  return (
    <header className="border-b border-[#c4d2e8]/15 bg-[#070d19]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        {/* Zone 1: Project Title + Competition / Season context */}
        <div className="flex min-w-0 flex-col">
          <button
            type="button"
            onClick={() => onSelectView('matches')}
            className="text-start font-display text-xl font-bold text-[#f4f7fb] whitespace-nowrap hover:text-white sm:text-2xl"
          >
            {COMPETITION_CONFIG.projectTitle}
          </button>
          <p className="text-xs text-[#7f91ad] whitespace-nowrap truncate">
            {COMPETITION_CONFIG.competitionName}
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span>موسم {seasonLabel}</span>
          </p>
        </div>

        {/* Zone 2: Clean view quick links on desktop */}
        <nav aria-label="التنقل العلوي" className="hidden items-center gap-6 sm:flex">
          <button
            type="button"
            onClick={() => onSelectView('matches')}
            className={`text-sm font-medium underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'matches'
                ? 'text-[#f4f7fb] underline'
                : 'text-[#b7c5da] hover:text-[#f4f7fb] hover:underline'
            }`}
          >
            المباريات
          </button>
          <button
            type="button"
            onClick={() => onSelectView('knockout')}
            className={`text-sm font-medium underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'knockout'
                ? 'text-[#f4f7fb] underline'
                : 'text-[#b7c5da] hover:text-[#f4f7fb] hover:underline'
            }`}
          >
            الأدوار الإقصائية
          </button>
        </nav>

        {/* Zone 3: Compact Data-Status Area */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRecheck}
            disabled={isRefreshing}
            aria-label={`التحقق من آخر لقطة منشورة (${statusText})`}
            title="يتحقق من آخر لقطة JSON منشورة (تحديثات مجدولة كل ساعة ولا يتصل بالمزود مباشرة)"
            className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#c4d2e8]/20 bg-[#0d172b] px-3.5 py-2 text-xs font-medium text-[#d8e1ee] transition-colors hover:border-[#2f7bff]/60 hover:bg-[#12203b] disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#5ca0ff] ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? 'جاري التحقق…' : statusText}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
