import type {KnockoutMatch} from '../types/knockout';

export interface VerifiedBroadcasterEntry {
  /** Egypt (Africa/Cairo) calendar date YYYY-MM-DD */
  readonly date: string;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  /** Verified provider matchId when known from the competition feed */
  readonly matchId?: string;
  /** Exact official TV guide fixture title for auditability */
  readonly matchLabel: string;
  readonly channelName: string;
  readonly channelLogoUrl: string;
  /** ISO calendar date YYYY-MM-DD when the official TV guide was checked */
  readonly checkedAt: string;
  readonly sourceUrl: string;
}

export const BROADCASTER_SCHEDULE_META = {
  networkName: 'beIN SPORTS (MENA)',
  tvGuideUrl: 'https://www.beinsports.com/en-mena/tv-guide',
  rightsAnnouncementUrl:
    'https://www.beinmediagroup.com/article/bein-media-group-extends-rights-deal-in-mena-and-asia-to-broadcast-uefa-club-competitions-until-2027/',
  checkedAt: '2026-11-23',
  coveredDates: ['2026-11-24', '2026-11-25'] as const,
} as const;

const TV_GUIDE_URL = BROADCASTER_SCHEDULE_META.tvGuideUrl;
const CHECKED_AT = BROADCASTER_SCHEDULE_META.checkedAt;

const BEIN_CHANNEL_LOGOS = {
  'beIN SPORTS 1':
    'https://prod-media.beinsports.com/image/f50c7035e532c49a0f6993d988e2e843.3840.png?ver=03-06-2025',
  'beIN SPORTS 2':
    'https://prod-media.beinsports.com/image/4fbe073f17f161810fdf3dab1307b30f.3840.png?ver=03-06-2025',
  'beIN SPORTS 3':
    'https://prod-media.beinsports.com/image/94130ea17023c4837f0dcdda95034b65.3840.png?ver=03-06-2025',
  'beIN SPORTS 4':
    'https://prod-media.beinsports.com/image/e92b755eb0d8800175a02a35c2bf44fe.3840.png?ver=03-06-2025',
  'beIN SPORTS 5':
    'https://prod-media.beinsports.com/image/0a5052334511e344f15ae0bfafd47a67.3840.png?ver=03-06-2025',
  'beIN SPORTS 6':
    'https://prod-media.beinsports.com/image/1aa4de654d4e502b4ef4136466b13fcc.3840.png?ver=03-06-2025',
  'beIN SPORTS 8':
    'https://prod-media.beinsports.com/image/a9dd7e3c6ee87a48cb35b729caf61eb5.3840.png?ver=03-06-2025',
  'beIN SPORTS 9':
    'https://prod-media.beinsports.com/image/de9d96171258bf940fc7b77c09b1cde4.3840.png?ver=03-06-2025',
} as const;

/**
 * Maintainable registry of verified Egypt/MENA LIVE broadcast channel assignments.
 * Future verified matchdays can append entries here without changing card components.
 * Never infer or extrapolate channel numbers for unverified dates or matchups.
 */
export const VERIFIED_EGYPT_BROADCASTERS: readonly VerifiedBroadcasterEntry[] = [
  // Tuesday 2026-11-24 (MD5)
  {
    date: '2026-11-24',
    homeTeamId: 610,
    awayTeamId: 58,
    matchId: 'cl-2026-575395',
    matchLabel: 'Galatasaray vs Aston Villa - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 3',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 3'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 5721,
    awayTeamId: 2016,
    matchId: 'cl-2026-575396',
    matchLabel: 'Bodo/Glimt vs Lask - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 4',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 4'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 86,
    awayTeamId: 674,
    matchId: 'cl-2026-575397',
    matchLabel: 'Real Madrid vs PSV Eindhoven - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 1',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 1'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 65,
    awayTeamId: 113,
    matchId: 'cl-2026-575398',
    matchLabel: 'Manchester City vs Napoli - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 3',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 3'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 57,
    awayTeamId: 4,
    matchId: 'cl-2026-575399',
    matchLabel: 'Arsenal vs Borussia Dortmund - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 4',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 4'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 675,
    awayTeamId: 503,
    matchId: 'cl-2026-575400',
    matchLabel: 'Feyenoord vs Porto - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 6',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 6'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 7509,
    awayTeamId: 90,
    matchId: 'cl-2026-575401',
    matchLabel: 'S.Bratislava vs Betis - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 9',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 9'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 721,
    awayTeamId: 546,
    matchId: 'cl-2026-575402',
    matchLabel: 'Leipzig vs Lens - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 8',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 8'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-24',
    homeTeamId: 7397,
    awayTeamId: 1899,
    matchId: 'cl-2026-575403',
    matchLabel: 'Como vs Aek Athens - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 5',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 5'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },

  // Wednesday 2026-11-25 (MD5)
  {
    date: '2026-11-25',
    homeTeamId: 10233,
    awayTeamId: 81,
    matchId: 'cl-2026-575404',
    matchLabel: 'Sabah vs Barcelona - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 2',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 2'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 930,
    awayTeamId: 94,
    matchId: 'cl-2026-575405',
    matchLabel: 'Slavia Praha vs Villarreal - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 4',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 4'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 108,
    awayTeamId: 10,
    matchId: 'cl-2026-575406',
    matchLabel: 'Inter vs Stuttgart - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 4',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 4'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 78,
    awayTeamId: 5720,
    matchId: 'cl-2026-575407',
    matchLabel: 'Atletico Madrid vs Viking - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 6',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 6'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 524,
    awayTeamId: 100,
    matchId: 'cl-2026-575408',
    matchLabel: 'PSG vs Roma - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 1',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 1'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 851,
    awayTeamId: 64,
    matchId: 'cl-2026-575409',
    matchLabel: 'Club Brugge vs Liverpool - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 3',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 3'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 521,
    awayTeamId: 5,
    matchId: 'cl-2026-575410',
    matchLabel: 'Lille vs Bayern Munich - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 5',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 5'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 498,
    awayTeamId: 66,
    matchId: 'cl-2026-575411',
    matchLabel: 'Sporting CP vs Manchester United - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 2',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 2'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
  {
    date: '2026-11-25',
    homeTeamId: 1887,
    awayTeamId: 613,
    matchId: 'cl-2026-575412',
    matchLabel: 'Shakhtar Donetsk vs Fenerbahce - UEFA Champions League MD5',
    channelName: 'beIN SPORTS 8',
    channelLogoUrl: BEIN_CHANNEL_LOGOS['beIN SPORTS 8'],
    checkedAt: CHECKED_AT,
    sourceUrl: TV_GUIDE_URL,
  },
] as const;

export function getEgyptBroadcastDateKey(utcDate: string | null): string | null {
  if (!utcDate) return null;
  const parsed = new Date(utcDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

/**
 * Resolves an Egypt-relevant broadcast channel strictly by verified Africa/Cairo
 * calendar date + exact homeTeamId + exact awayTeamId. Never swaps home/away
 * and never guesses channel numbers outside verified schedule entries.
 */
export function getVerifiedMatchBroadcaster(
  match: Pick<KnockoutMatch, 'matchId' | 'utcDate' | 'homeTeam' | 'awayTeam'>,
  registry: readonly VerifiedBroadcasterEntry[] = VERIFIED_EGYPT_BROADCASTERS,
): VerifiedBroadcasterEntry | null {
  if (
    match.homeTeam.isTbd ||
    match.awayTeam.isTbd ||
    match.homeTeam.id == null ||
    match.awayTeam.id == null
  ) {
    return null;
  }

  const cairoDate = getEgyptBroadcastDateKey(match.utcDate);
  if (!cairoDate) {
    return null;
  }

  return (
    registry.find(
      (entry) =>
        entry.date === cairoDate &&
        entry.homeTeamId === match.homeTeam.id &&
        entry.awayTeamId === match.awayTeam.id,
    ) ?? null
  );
}
