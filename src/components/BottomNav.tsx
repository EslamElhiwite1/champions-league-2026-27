import React from 'react';
import {CalendarDays, Trophy} from 'lucide-react';

export type ActiveAppView = 'matches' | 'knockout';

interface BottomNavProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  confirmedTiesCount: number;
  totalTiesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onSelectView,
  confirmedTiesCount,
  totalTiesCount,
}) => {
  return (
    <nav
      aria-label="التنقل الرئيسي بين الأقسام"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#c4d2e8]/20 bg-[#070d19]/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => onSelectView('matches')}
          aria-current={activeView === 'matches' ? 'page' : undefined}
          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeView === 'matches'
              ? 'border-[#2f7bff] bg-[#2f7bff]/20 text-white'
              : 'border-transparent text-[#b7c5da] hover:bg-[#12203b] hover:text-[#f4f7fb]'
          }`}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-[#5ca0ff]" aria-hidden="true" />
          <span>المباريات</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('knockout')}
          aria-current={activeView === 'knockout' ? 'page' : undefined}
          aria-label={`شجرة الأدوار الإقصائية (${confirmedTiesCount} من أصل ${totalTiesCount} مواجهة مؤكدة)`}
          className={`flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
            activeView === 'knockout'
              ? 'border-[#2f7bff] bg-[#2f7bff]/20 text-white'
              : 'border-transparent text-[#b7c5da] hover:bg-[#12203b] hover:text-[#f4f7fb]'
          }`}
        >
          <Trophy className="h-4 w-4 shrink-0 text-[#d8e1ee]" aria-hidden="true" />
          <span>الأدوار الإقصائية</span>
        </button>
      </div>
    </nav>
  );
};
