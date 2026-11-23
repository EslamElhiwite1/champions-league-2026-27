import {useMemo, useState} from 'react';
import {type ActiveAppView, BottomNav} from './components/BottomNav';
import {BracketView} from './components/BracketView';
import {FixturesTable} from './components/FixturesTable';
import {Footer} from './components/Footer';
import {Header} from './components/Header';
import {MatchDetailPanel} from './components/MatchDetailPanel';
import {TournamentOverview} from './components/TournamentOverview';
import type {TimezoneMode} from './config/competition';
import {useKnockoutSnapshot} from './data/snapshotService';
import {
  computeOverviewStats,
  createInitialTruthfulSnapshot,
} from './domain/knockoutEngine';
import type {KnockoutMatch, KnockoutSnapshot, KnockoutTie} from './types/knockout';

interface AppProps {
  initialSnapshot?: KnockoutSnapshot;
  nowMs?: number;
}

export default function App({initialSnapshot, nowMs}: AppProps) {
  const {
    snapshot,
    isLoading,
    isRefreshing,
    lastCheckedAtUtc,
    recheckError,
    isRetainedFallback,
    recheckNow,
  } = useKnockoutSnapshot(initialSnapshot);

  const [activeView, setActiveView] = useState<ActiveAppView>('matches');
  const [timezoneMode, setTimezoneMode] = useState<TimezoneMode>('cairo');
  const [selectedTieId, setSelectedTieId] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const activeSnapshot = useMemo(
    () => snapshot ?? createInitialTruthfulSnapshot(),
    [snapshot],
  );

  const stats = useMemo(
    () => computeOverviewStats(activeSnapshot, nowMs),
    [activeSnapshot, nowMs],
  );

  const selectedTie: KnockoutTie | null = useMemo(() => {
    if (!selectedTieId) return null;
    return activeSnapshot.ties.find((t) => t.tieId === selectedTieId) ?? null;
  }, [activeSnapshot.ties, selectedTieId]);

  const selectedMatch: KnockoutMatch | null = useMemo(() => {
    if (!selectedMatchId) return null;
    return activeSnapshot.matches.find((m) => m.matchId === selectedMatchId) ?? null;
  }, [activeSnapshot.matches, selectedMatchId]);

  const handleSelectView = (view: ActiveAppView) => {
    setActiveView(view);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth'});
    }
  };

  const handleSelectTie = (tie: KnockoutTie) => {
    setSelectedMatchId(null);
    setSelectedTieId(tie.tieId);
  };

  const handleSelectMatch = (match: KnockoutMatch) => {
    if (match.tieId) {
      setSelectedMatchId(null);
      setSelectedTieId(match.tieId);
    } else {
      setSelectedTieId(null);
      setSelectedMatchId(match.matchId);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d19] pb-24 text-[#f4f7fb]" dir="rtl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-50 focus:rounded focus:bg-[#2f7bff] focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-white"
      >
        تخطي إلى المحتوى الرئيسي
      </a>

      <Header
        snapshot={activeSnapshot}
        activeView={activeView}
        onSelectView={handleSelectView}
        isRefreshing={isRefreshing}
        isRetainedFallback={isRetainedFallback}
        onRecheck={recheckNow}
      />

      <main id="main-content">
        {isLoading && !snapshot ? (
          <div className="mx-auto max-w-[1400px] px-4 py-16 text-center text-sm text-[#b7c5da]">
            جاري تحميل لقطة دوري أبطال أوروبا 2026/27…
          </div>
        ) : activeView === 'matches' ? (
          <>
            <TournamentOverview
              snapshot={activeSnapshot}
              timezoneMode={timezoneMode}
              onTimezoneChange={setTimezoneMode}
              lastCheckedAtUtc={lastCheckedAtUtc}
              recheckError={recheckError}
              isRetainedFallback={isRetainedFallback}
              onSelectMatch={handleSelectMatch}
              onOpenKnockoutView={() => handleSelectView('knockout')}
              nowMs={nowMs}
            />

            <FixturesTable
              snapshot={activeSnapshot}
              timezoneMode={timezoneMode}
              onSelectTie={handleSelectTie}
              onSelectMatch={handleSelectMatch}
              onOpenKnockoutView={() => handleSelectView('knockout')}
              nowMs={nowMs}
            />
          </>
        ) : (
          <BracketView
            snapshot={activeSnapshot}
            timezoneMode={timezoneMode}
            selectedTieId={selectedTieId}
            onSelectTie={handleSelectTie}
          />
        )}
      </main>

      <Footer snapshot={activeSnapshot} />

      <BottomNav
        activeView={activeView}
        onSelectView={handleSelectView}
        confirmedTiesCount={stats.tiesWithConfirmedParticipants}
        totalTiesCount={stats.totalTies}
      />

      <MatchDetailPanel
        tie={selectedTie}
        match={selectedMatch}
        snapshot={activeSnapshot}
        timezoneMode={timezoneMode}
        onClose={() => {
          setSelectedTieId(null);
          setSelectedMatchId(null);
        }}
      />
    </div>
  );
}
