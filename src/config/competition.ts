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

export interface ClearedClubCrestEntry {
  readonly teamId: number;
  readonly clubName: string;
  readonly arabicClubName: string;
  readonly imageUrl: string;
  readonly sourcePageUrl: string;
  readonly sourceCredit: string;
  readonly creator: string;
  readonly licenseLabel: string;
  readonly arabicLicenseNote: string;
}

/**
 * Strict team-ID whitelist of individually cleared current club logos (9 clubs only).
 * Only Wikimedia Commons PD-textlogo / PD-Turkey SVG files verified from individual
 * file pages are listed here; all other clubs remain text/monogram-only.
 */
export const CLEARED_CLUB_CREST_REGISTRY: Readonly<Record<number, ClearedClubCrestEntry>> = {
  4: {
    teamId: 4,
    clubName: 'Borussia Dortmund',
    arabicClubName: 'بوروسيا دورتموند',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Borussia_Dortmund_logo.svg',
    sourceCredit: 'Wikimedia Commons · File:Borussia_Dortmund_logo.svg',
    creator: 'Borussia Dortmund (SVG: User:Lispir)',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'الشعار الحالي في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  5: {
    teamId: 5,
    clubName: 'FC Bayern München',
    arabicClubName: 'بايرن ميونخ',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg',
    sourcePageUrl:
      'https://commons.wikimedia.org/wiki/File:FC_Bayern_M%C3%BCnchen_logo_(2024).svg',
    sourceCredit: 'fcbayern.com via Wikimedia Commons · File:FC_Bayern_München_logo_(2024).svg',
    creator: 'FC Bayern München',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'شعار 2024 الحالي في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  108: {
    teamId: 108,
    clubName: 'FC Internazionale Milano',
    arabicClubName: 'إنتر ميلان',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:FC_Internazionale_Milano_2021.svg',
    sourceCredit: 'im.inter.it via Wikimedia Commons · File:FC_Internazionale_Milano_2021.svg',
    creator: 'FC Internazionale Milano S.p.A. / Bureau Borsche',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'شعار 2021 الحالي في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  113: {
    teamId: 113,
    clubName: 'SSC Napoli',
    arabicClubName: 'نابولي',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
    sourcePageUrl:
      'https://commons.wikimedia.org/wiki/File:SSC_Napoli_2024_(deep_blue_navy).svg',
    sourceCredit: 'Wikimedia Commons · File:SSC_Napoli_2024_(deep_blue_navy).svg',
    creator: 'SSC Napoli S.p.A. (Upload: User:The White Lion)',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'شعار 2024 الحالي باللون الأزرق الداكن في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  610: {
    teamId: 610,
    clubName: 'Galatasaray SK',
    arabicClubName: 'غلطة سراي',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Galatasaray_Sports_Club_Logo.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Galatasaray_Sports_Club_Logo.svg',
    sourceCredit: 'Wikimedia Commons · File:Galatasaray_Sports_Club_Logo.svg',
    creator: 'Ayet Emin (Vector: User:SAİT71)',
    licenseLabel: 'Public domain (PD-textlogo & PD-Turkey — base club badge, not kit-star variant)',
    arabicLicenseNote:
      'الشعار الأساسي للنادي دون نجوم البطولات الموسمية على القميص (الملكية العامة التركية والتصميم النصي البسيط)؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  675: {
    teamId: 675,
    clubName: 'Feyenoord',
    arabicClubName: 'فينورد',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Feyenoord_logo_since_2024.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Feyenoord_logo_since_2024.svg',
    sourceCredit: 'feyenoord.com via Wikimedia Commons · File:Feyenoord_logo_since_2024.svg',
    creator: 'Feyenoord Rotterdam N.V.',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'الشعار الحالي المعتمد منذ 2024 في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  930: {
    teamId: 930,
    clubName: 'SK Slavia Praha',
    arabicClubName: 'سلافيا براغ',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/SK_Slavia_Praha_full_logo.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:SK_Slavia_Praha_full_logo.svg',
    sourceCredit: 'slavia.cz via Wikimedia Commons · File:SK_Slavia_Praha_full_logo.svg',
    creator: 'SK Slavia Praha / eSports.cz, s.r.o. / JT Design',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'الشعار الكامل المعتمد منذ 2022 في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  7397: {
    teamId: 7397,
    clubName: 'Como 1907',
    arabicClubName: 'كومو',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg',
    sourcePageUrl:
      'https://commons.wikimedia.org/wiki/File:Calcio_Como_-_logo_(Italy,_2019-).svg',
    sourceCredit: 'Wikimedia Commons · File:Calcio_Como_-_logo_(Italy,_2019-).svg',
    creator: 'Como 1907 srl',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'الشعار الحالي المعتمد منذ 2019 في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
  7509: {
    teamId: 7509,
    clubName: 'ŠK Slovan Bratislava',
    arabicClubName: 'سلوفان براتيسلافا',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/01/SK_Slovan_Bratislava_logo.svg',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:SK_Slovan_Bratislava_logo.svg',
    sourceCredit: 'skslovan.com via Wikimedia Commons · File:SK_Slovan_Bratislava_logo.svg',
    creator: 'ŠK Slovan Bratislava',
    licenseLabel: 'Public domain (PD-textlogo / simple geometric text design)',
    arabicLicenseNote:
      'الشعار الرسمي الحالي في الملكية العامة لتصميمه الهندسي/النصي البسيط؛ العلامة التجارية محمية ومملوكة للنادي دون أي رعاية رسمية.',
  },
} as const;

export function getClearedClubCrest(
  teamId: number | null | undefined,
): ClearedClubCrestEntry | null {
  if (typeof teamId !== 'number' || !Number.isFinite(teamId)) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(CLEARED_CLUB_CREST_REGISTRY, teamId)
    ? CLEARED_CLUB_CREST_REGISTRY[teamId]
    : null;
}
