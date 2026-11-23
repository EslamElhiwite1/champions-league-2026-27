export {
  CLEARED_CLUB_CREST_REGISTRY,
  CLUB_LOGOS_COLLECTION_META,
  getClearedClubCrest,
  type ClearedClubCrestEntry,
} from './clubLogos';
export {
  BROADCASTER_SCHEDULE_META,
  getEgyptBroadcastDateKey,
  getVerifiedMatchBroadcaster,
  VERIFIED_EGYPT_BROADCASTERS,
  type VerifiedBroadcasterEntry,
} from './broadcasters';

export const COMPETITION_CONFIG = {
  projectTitle: 'سجل دوري أبطال أوروبا',
  competitionName: 'دوري أبطال أوروبا',
  competitionCode: 'CL',
  seasonStartYear: 2026,
  seasonLabel: '2026/27',
  defaultTimezone: 'Africa/Cairo',
  defaultTimezoneLabel: 'توقيت مصر (Africa/Cairo)',
  /** Relative to Vite BASE_URL so both root and GitHub Pages project subpaths resolve cleanly */
  snapshotRelativePath: 'data/knockout-snapshot.json',
  /** Expected server-side GitHub Actions refresh cadence in minutes (hourly at an off-hour minute) */
  refreshCadenceMinutes: 60,
  refreshScheduleDescription: 'تحديث مجدول كل ساعة عند الدقيقة 17 بتوقيت UTC عبر GitHub Actions',
  /** Passive client recheck of the static published JSON while the tab is visible (5 minutes) */
  clientRecheckIntervalMs: 5 * 60 * 1000,
  providerName: 'football-data.org',
  providerUrl: 'https://www.football-data.org/',
  providerPlanNote:
    'الخطة المجانية توفر جداول ونتائج متأخرة تلقائيًا؛ لا توفر بثًا فوريًا لحظة بلحظة.',
} as const;

export type TimezoneMode = 'cairo' | 'local';

/**
 * Explicit permission-gated asset policy for club graphics.
 * API access to football-data.org match data does NOT license third-party club crests/logos.
 * External provider crest URLs remain suppressed unless allowExternalCrests is explicitly
 * enabled alongside a permitted origin allowlist.
 */
export const CLUB_CREST_POLICY = {
  allowExternalCrests: false as boolean,
  permittedOriginAllowlist: [] as readonly string[],
};

export function isCrestUrlPermitted(
  url: string | null | undefined,
  policy: {allowExternalCrests: boolean; permittedOriginAllowlist: readonly string[]} = CLUB_CREST_POLICY,
): boolean {
  if (!policy.allowExternalCrests || !url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    return policy.permittedOriginAllowlist.some((allowedOrigin) => {
      const normalized = allowedOrigin.trim().toLowerCase();
      return (
        parsed.origin.toLowerCase() === normalized ||
        parsed.hostname.toLowerCase() === normalized
      );
    });
  } catch {
    return false;
  }
}
