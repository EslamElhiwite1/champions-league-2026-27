export const COMPETITION_CONFIG = {
  projectTitle: 'European Match & Knockout Ledger',
  competitionName: 'UEFA Champions League',
  competitionCode: 'CL',
  seasonStartYear: 2026,
  seasonLabel: '2026/27',
  defaultTimezone: 'Africa/Cairo',
  defaultTimezoneLabel: 'Egypt time (Africa/Cairo)',
  /** Relative to Vite BASE_URL so both root and GitHub Pages project subpaths resolve cleanly */
  snapshotRelativePath: 'data/knockout-snapshot.json',
  /** Expected server-side GitHub Actions refresh cadence in minutes (hourly at an off-hour minute) */
  refreshCadenceMinutes: 60,
  refreshScheduleDescription: 'Hourly at minute 17 UTC via scheduled GitHub Actions workflow',
  /** Passive client recheck of the static published JSON while the tab is visible (5 minutes) */
  clientRecheckIntervalMs: 5 * 60 * 1000,
  providerName: 'football-data.org',
  providerUrl: 'https://www.football-data.org/',
  providerPlanNote:
    'Verified free plan provides delayed competition schedules and match scores; instantaneous live goal-by-goal feeds are not promised.',
} as const;

export type TimezoneMode = 'cairo' | 'local';

/**
 * Explicit permission-gated asset policy for club graphics.
 * API access to football-data.org match data does NOT license third-party club crests/logos.
 * External crest URLs are suppressed unless allowExternalCrests is explicitly enabled
 * alongside an approved permitted origin allowlist.
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
