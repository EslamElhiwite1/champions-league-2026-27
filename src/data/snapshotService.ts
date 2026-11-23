import {useCallback, useEffect, useRef, useState} from 'react';
import {COMPETITION_CONFIG} from '../config/competition';
import {createInitialTruthfulSnapshot} from '../domain/knockoutEngine';
import type {KnockoutSnapshot, SnapshotLoadState} from '../types/knockout';

export function getSnapshotUrl(): string {
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${COMPETITION_CONFIG.snapshotRelativePath}`;
}

export function validateSnapshotSchema(data: unknown): data is KnockoutSnapshot {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<KnockoutSnapshot>;
  if (candidate.schemaVersion !== 1) return false;
  if (candidate.competitionCode !== COMPETITION_CONFIG.competitionCode) return false;
  if (candidate.seasonStartYear !== COMPETITION_CONFIG.seasonStartYear) return false;
  if (typeof candidate.seasonLabel !== 'string' || !candidate.seasonLabel) return false;
  if (!Array.isArray(candidate.ties) || candidate.ties.length === 0) return false;
  if (!Array.isArray(candidate.matches)) return false;
  // Guard against accidental synthetic data leaking into production snapshot
  if (candidate.isSyntheticDemo === true) return false;
  return true;
}

export async function fetchPublishedSnapshot(signal?: AbortSignal): Promise<KnockoutSnapshot> {
  const url = getSnapshotUrl();
  const response = await fetch(url, {
    method: 'GET',
    headers: {Accept: 'application/json'},
    cache: 'no-cache',
    signal,
  });

  if (!response.ok) {
    throw new Error(`تعذر الوصول إلى ملف اللقطة المنشورة (HTTP ${response.status}).`);
  }

  const json: unknown = await response.json();
  if (!validateSnapshotSchema(json)) {
    throw new Error(
      `فشل التحقق من بنية اللقطة أو موسم ${COMPETITION_CONFIG.seasonLabel}.`,
    );
  }

  return json;
}

export function useKnockoutSnapshot(initialSnapshot?: KnockoutSnapshot) {
  const [state, setState] = useState<SnapshotLoadState>(() => ({
    snapshot: initialSnapshot ?? null,
    isLoading: !initialSnapshot,
    isRefreshing: false,
    lastCheckedAtUtc: null,
    recheckError: null,
    isRetainedFallback: false,
  }));

  const snapshotRef = useRef<KnockoutSnapshot | null>(initialSnapshot ?? null);
  snapshotRef.current = state.snapshot;

  const checkSnapshot = useCallback(async (isInitial = false) => {
    setState((prev) => ({
      ...prev,
      isLoading: isInitial && !prev.snapshot,
      isRefreshing: !isInitial,
    }));

    try {
      const fresh = await fetchPublishedSnapshot();
      setState({
        snapshot: fresh,
        isLoading: false,
        isRefreshing: false,
        lastCheckedAtUtc: new Date().toISOString(),
        recheckError: null,
        isRetainedFallback: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'تعذر استرداد لقطة البيانات المنشورة.';

      setState((prev) => {
        if (prev.snapshot) {
          // Retain last valid snapshot; never overwrite valid data with empty results
          return {
            ...prev,
            isLoading: false,
            isRefreshing: false,
            lastCheckedAtUtc: new Date().toISOString(),
            recheckError: message,
            isRetainedFallback: true,
          };
        }
        // No validated snapshot has been fetched yet; show honest unavailable/setup state
        const fallback = createInitialTruthfulSnapshot();
        fallback.ingestionStatus = 'error';
        fallback.statusMessage = `تعذر تحميل لقطة موثقة صالحة (${message}).`;
        return {
          snapshot: fallback,
          isLoading: false,
          isRefreshing: false,
          lastCheckedAtUtc: new Date().toISOString(),
          recheckError: message,
          isRetainedFallback: false,
        };
      });
    }
  }, []);

  useEffect(() => {
    if (initialSnapshot) return;

    void checkSnapshot(true);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void checkSnapshot(false);
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void checkSnapshot(false);
      }
    }, COMPETITION_CONFIG.clientRecheckIntervalMs);

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [checkSnapshot, initialSnapshot]);

  return {
    ...state,
    recheckNow: () => checkSnapshot(false),
  };
}
