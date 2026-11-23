import {COMPETITION_CONFIG} from '../config/competition';
import {
  BRACKET_BLUEPRINT,
  createEmptyBracketSkeleton,
  createTbdTeam,
  deriveMonogram,
  evaluateTieProgression,
  propagateVerifiedAdvancement,
  resolveNormalizedScore,
  STAGE_ORDER,
} from '../domain/knockoutEngine';
import type {
  CompetitionStage,
  KnockoutBracketStage,
  KnockoutMatch,
  KnockoutSnapshot,
  KnockoutTie,
  MatchStatus,
  RawFootballDataCompetitionMatchesResponse,
  RawFootballDataMatch,
  RawFootballDataTeam,
  TeamRef,
} from '../types/knockout';

export class ProviderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderValidationError';
  }
}

export class SeasonMismatchError extends ProviderValidationError {
  constructor(expectedYear: number, actualStartDate?: string, actualFilterSeason?: string | number) {
    super(
      `Season mismatch: expected ${expectedYear}/${String(expectedYear + 1).slice(-2)}, received startDate="${actualStartDate ?? 'unknown'}" (filter="${actualFilterSeason ?? 'unknown'}").`,
    );
    this.name = 'SeasonMismatchError';
  }
}

const KNOCKOUT_BRACKET_STAGES = new Set<KnockoutBracketStage>([
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINAL',
]);

const STAGE_ALIASES: Record<string, CompetitionStage> = {
  LEAGUE_STAGE: 'LEAGUE_STAGE',
  GROUP_STAGE: 'LEAGUE_STAGE',
  PLAYOFFS: 'PLAYOFFS',
  KNOCKOUT_ROUND_PLAY_OFFS: 'PLAYOFFS',
  ROUND_OF_16: 'ROUND_OF_16',
  LAST_16: 'ROUND_OF_16',
  QUARTER_FINALS: 'QUARTER_FINALS',
  QUARTER_FINAL: 'QUARTER_FINALS',
  SEMI_FINALS: 'SEMI_FINALS',
  SEMI_FINAL: 'SEMI_FINALS',
  FINAL: 'FINAL',
  PRELIMINARY_ROUND: 'PRELIMINARY_ROUND',
  QUALIFICATION: 'QUALIFICATION',
  QUALIFICATION_ROUND_1: 'QUALIFICATION',
  QUALIFICATION_ROUND_2: 'QUALIFICATION',
  QUALIFICATION_ROUND_3: 'QUALIFICATION',
};

const VALID_STATUSES = new Set<MatchStatus>([
  'SCHEDULED',
  'TIMED',
  'IN_PLAY',
  'PAUSED',
  'FINISHED',
  'POSTPONED',
  'SUSPENDED',
  'CANCELLED',
  'AWARDED',
]);

function normalizeStage(rawStage: string | null | undefined): CompetitionStage {
  if (!rawStage) return 'OTHER';
  const key = rawStage.trim().toUpperCase();
  return STAGE_ALIASES[key] ?? 'OTHER';
}

function isKnockoutBracketStage(stage: CompetitionStage): stage is KnockoutBracketStage {
  return KNOCKOUT_BRACKET_STAGES.has(stage as KnockoutBracketStage);
}

function normalizeStatus(rawStatus: string | null | undefined): MatchStatus {
  if (!rawStatus) return 'UNKNOWN';
  const upper = rawStatus.trim().toUpperCase() as MatchStatus;
  return VALID_STATUSES.has(upper) ? upper : 'UNKNOWN';
}

function sanitizeCrestUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeTeam(rawTeam: RawFootballDataTeam | null | undefined): TeamRef {
  if (!rawTeam || rawTeam.id == null || !rawTeam.name || rawTeam.name.trim().toUpperCase() === 'TBD') {
    return createTbdTeam('طرف المواجهة بانتظار القرعة أو حسم الدور السابق.');
  }
  const cleanName = rawTeam.name.trim();
  const cleanShort = (rawTeam.shortName ?? cleanName).trim() || cleanName;
  const cleanTla = (rawTeam.tla ?? deriveMonogram(cleanShort)).trim().toUpperCase();
  return {
    id: rawTeam.id,
    name: cleanName,
    shortName: cleanShort,
    tla: cleanTla,
    monogram: deriveMonogram(cleanShort, cleanTla),
    crestUrl: sanitizeCrestUrl(rawTeam.crest),
    isTbd: false,
  };
}

function getCanonicalPairKey(
  stage: KnockoutBracketStage,
  id1: number | null,
  id2: number | null,
): string | null {
  if (id1 == null || id2 == null) return null;
  const low = Math.min(id1, id2);
  const high = Math.max(id1, id2);
  return `${stage}:${low}:${high}`;
}

function buildResolutionNote(
  status: MatchStatus,
  isScoreAmbiguous: boolean,
  ambiguityNote?: string,
): string | null {
  if (status === 'POSTPONED') {
    return 'تأجلت المباراة بقرار من الجهة المنظمة وبانتظار تحديد الموعد الجديد.';
  }
  if (status === 'SUSPENDED') {
    return 'المباراة معلّقة وتبقى نتيجتها غير محسومة لحين استكمالها.';
  }
  if (status === 'CANCELLED') {
    return 'تم إلغاء هذه المباراة.';
  }
  if (isScoreAmbiguous) {
    return ambiguityNote ?? 'تفصيل النتيجة يتطلب مراجعة يدوية.';
  }
  return null;
}

export function validateProviderPayload(
  payload: RawFootballDataCompetitionMatchesResponse,
  expectedSeasonStartYear: number = COMPETITION_CONFIG.seasonStartYear,
  expectedCompetitionCode: string = COMPETITION_CONFIG.competitionCode,
): void {
  if (!payload || typeof payload !== 'object') {
    throw new ProviderValidationError('Provider payload is empty or malformed.');
  }

  // Strictly enforce Champions League (CL) and reject standings/other competition payloads
  if (!payload.competition?.code || payload.competition.code !== expectedCompetitionCode) {
    throw new ProviderValidationError(
      `Competition mismatch: expected ${expectedCompetitionCode}, received ${payload.competition?.code ?? 'missing'}.`,
    );
  }

  if (!Array.isArray(payload.matches)) {
    throw new ProviderValidationError('Provider payload missing matches array.');
  }

  const seasonStartDate = payload.season?.startDate;
  const filterSeason = payload.filters?.season;

  if (seasonStartDate) {
    const startYear = Number.parseInt(seasonStartDate.slice(0, 4), 10);
    if (startYear !== expectedSeasonStartYear) {
      throw new SeasonMismatchError(expectedSeasonStartYear, seasonStartDate, filterSeason);
    }
  } else if (filterSeason != null) {
    const parsedFilter = Number.parseInt(String(filterSeason), 10);
    if (parsedFilter !== expectedSeasonStartYear) {
      throw new SeasonMismatchError(expectedSeasonStartYear, seasonStartDate, filterSeason);
    }
  } else {
    throw new SeasonMismatchError(expectedSeasonStartYear, undefined, undefined);
  }
}

export function adaptFootballDataMatches(
  payload: RawFootballDataCompetitionMatchesResponse,
  options?: {
    expectedSeasonStartYear?: number;
    ingestedAtUtc?: string;
  },
): KnockoutSnapshot {
  const expectedSeasonStartYear =
    options?.expectedSeasonStartYear ?? COMPETITION_CONFIG.seasonStartYear;
  const ingestedAtUtc = options?.ingestedAtUtc ?? new Date().toISOString();

  validateProviderPayload(payload, expectedSeasonStartYear, COMPETITION_CONFIG.competitionCode);

  const rawMatches = payload.matches ?? [];

  // Deduplicate by match ID across all CL season matches
  const dedupedById = new Map<number, RawFootballDataMatch>();
  for (const m of rawMatches) {
    if (!m || typeof m.id !== 'number') continue;
    const existing = dedupedById.get(m.id);
    if (!existing) {
      dedupedById.set(m.id, m);
    } else {
      const existingTs = existing.lastUpdated ? Date.parse(existing.lastUpdated) : 0;
      const candidateTs = m.lastUpdated ? Date.parse(m.lastUpdated) : 0;
      if (candidateTs >= existingTs) {
        dedupedById.set(m.id, m);
      }
    }
  }

  const sortedAllRaw = Array.from(dedupedById.values()).sort((a, b) => {
    const da = a.utcDate ? Date.parse(a.utcDate) : Number.MAX_SAFE_INTEGER;
    const db = b.utcDate ? Date.parse(b.utcDate) : Number.MAX_SAFE_INTEGER;
    if (da !== db) return da - db;
    return a.id - b.id;
  });

  let latestSourceTs = 0;
  for (const raw of sortedAllRaw) {
    if (raw.lastUpdated) {
      const ts = Date.parse(raw.lastUpdated);
      if (!Number.isNaN(ts) && ts > latestSourceTs) {
        latestSourceTs = ts;
      }
    }
  }

  const seasonLabel = `${expectedSeasonStartYear}/${String(expectedSeasonStartYear + 1).slice(-2)}`;

  if (sortedAllRaw.length === 0) {
    return {
      schemaVersion: 1,
      competitionCode: COMPETITION_CONFIG.competitionCode,
      competitionName: COMPETITION_CONFIG.competitionName,
      seasonStartYear: expectedSeasonStartYear,
      seasonLabel,
      ingestionStatus: 'awaiting_draw',
      statusMessage: `تم الاتصال بمصدر ${COMPETITION_CONFIG.providerName} لموسم ${seasonLabel}، ولا توجد مباريات منشورة حتى الآن.`,
      sourceName: COMPETITION_CONFIG.providerName,
      sourceLastUpdatedUtc: latestSourceTs > 0 ? new Date(latestSourceTs).toISOString() : null,
      ingestedAtUtc,
      ties: createEmptyBracketSkeleton(
        'مواجهات الأدوار الإقصائية غير منشورة في خلاصة البطولة بعد.',
      ),
      matches: [],
    };
  }

  // Separate knockout-bracket matches (R16, QF, SF, Final) to assemble the 15-tie bracket
  const knockoutRaw = sortedAllRaw
    .map((raw) => ({raw, stage: normalizeStage(raw.stage)}))
    .filter((item): item is {raw: RawFootballDataMatch; stage: KnockoutBracketStage} =>
      isKnockoutBracketStage(item.stage),
    );

  const skeleton = createEmptyBracketSkeleton();
  const skeletonByStage = new Map<KnockoutBracketStage, KnockoutTie[]>();
  for (const stage of STAGE_ORDER) {
    skeletonByStage.set(
      stage,
      skeleton.filter((t) => t.stage === stage),
    );
  }

  const tieByPairKey = new Map<string, KnockoutTie>();
  const legsByTieId = new Map<string, RawFootballDataMatch[]>();
  const tieIdByProviderMatchId = new Map<number, {tieId: string; leg: 1 | 2 | null; isSingleMatch: boolean}>();

  for (const {raw, stage} of knockoutRaw) {
    const home = normalizeTeam(raw.homeTeam);
    const away = normalizeTeam(raw.awayTeam);
    const pairKey = getCanonicalPairKey(stage, home.id, away.id);
    const stageSlots = skeletonByStage.get(stage) ?? [];

    let targetTie: KnockoutTie | undefined;
    if (pairKey && tieByPairKey.has(pairKey)) {
      targetTie = tieByPairKey.get(pairKey);
    } else {
      targetTie = stageSlots.find((slot) => (legsByTieId.get(slot.tieId)?.length ?? 0) === 0);
      if (targetTie && pairKey) {
        tieByPairKey.set(pairKey, targetTie);
      }
    }

    if (!targetTie) continue;

    const existingLegs = legsByTieId.get(targetTie.tieId) ?? [];
    existingLegs.push(raw);
    legsByTieId.set(targetTie.tieId, existingLegs);
  }

  const populatedTies: KnockoutTie[] = BRACKET_BLUEPRINT.map((blueprint) => {
    const rawLegs = (legsByTieId.get(blueprint.tieId) ?? []).sort((a, b) => {
      const da = a.utcDate ? Date.parse(a.utcDate) : Number.MAX_SAFE_INTEGER;
      const db = b.utcDate ? Date.parse(b.utcDate) : Number.MAX_SAFE_INTEGER;
      if (da !== db) return da - db;
      return a.id - b.id;
    });

    if (rawLegs.length === 0) {
      const emptyBase: Omit<KnockoutTie, 'aggregate' | 'advancement'> = {
        tieId: blueprint.tieId,
        stage: blueprint.stage,
        bracketSide: blueprint.bracketSide,
        slotIndex: blueprint.slotIndex,
        label: blueprint.label,
        isTwoLegged: blueprint.isTwoLegged,
        teamA: createTbdTeam('لم يتحدد الطرف الأول بعد.'),
        teamB: createTbdTeam('لم يتحدد الطرف الثاني بعد.'),
        legs: [],
        feedsIntoTieId: blueprint.feedsIntoTieId,
      };
      return {
        ...emptyBase,
        ...evaluateTieProgression(emptyBase),
      };
    }

    const firstLeg = rawLegs[0];
    const teamA = normalizeTeam(firstLeg.homeTeam);
    const teamB = normalizeTeam(firstLeg.awayTeam);

    const normalizedLegs: KnockoutMatch[] = rawLegs
      .slice(0, blueprint.isTwoLegged ? 2 : 1)
      .map((raw, idx) => {
        const legNumber = blueprint.isTwoLegged ? ((idx + 1) as 1 | 2) : null;
        tieIdByProviderMatchId.set(raw.id, {
          tieId: blueprint.tieId,
          leg: legNumber,
          isSingleMatch: !blueprint.isTwoLegged,
        });

        const status = normalizeStatus(raw.status);
        const score = resolveNormalizedScore(raw.score);
        const homeTeam = normalizeTeam(raw.homeTeam);
        const awayTeam = normalizeTeam(raw.awayTeam);

        return {
          matchId: `cl-${expectedSeasonStartYear}-${raw.id}`,
          providerMatchId: raw.id,
          tieId: blueprint.tieId,
          stage: blueprint.stage,
          rawStageLabel: raw.stage ?? null,
          matchday: typeof raw.matchday === 'number' ? raw.matchday : null,
          leg: legNumber,
          isSingleMatch: !blueprint.isTwoLegged,
          isKnockoutBracketStage: true,
          utcDate: raw.utcDate ?? null,
          status,
          homeTeam,
          awayTeam,
          venue: raw.venue ?? null,
          score,
          resolutionNote: buildResolutionNote(status, score.isScoreAmbiguous, score.ambiguityNote),
        };
      });

    const tieBase: Omit<KnockoutTie, 'aggregate' | 'advancement'> = {
      tieId: blueprint.tieId,
      stage: blueprint.stage,
      bracketSide: blueprint.bracketSide,
      slotIndex: blueprint.slotIndex,
      label: blueprint.label,
      isTwoLegged: blueprint.isTwoLegged,
      teamA,
      teamB,
      legs: normalizedLegs,
      feedsIntoTieId: blueprint.feedsIntoTieId,
    };

    return {
      ...tieBase,
      ...evaluateTieProgression(tieBase),
    };
  });

  const finalTies = propagateVerifiedAdvancement(populatedTies);

  // Build complete season matches array (LEAGUE_STAGE + PLAYOFFS + Knockout Bracket rounds)
  const allMatches: KnockoutMatch[] = sortedAllRaw.map((raw) => {
    const stage = normalizeStage(raw.stage);
    const bracketMeta = tieIdByProviderMatchId.get(raw.id);
    const status = normalizeStatus(raw.status);
    const score = resolveNormalizedScore(raw.score);

    return {
      matchId: `cl-${expectedSeasonStartYear}-${raw.id}`,
      providerMatchId: raw.id,
      tieId: bracketMeta?.tieId ?? null,
      stage,
      rawStageLabel: raw.stage ?? null,
      matchday: typeof raw.matchday === 'number' ? raw.matchday : null,
      leg: bracketMeta?.leg ?? null,
      isSingleMatch: bracketMeta ? bracketMeta.isSingleMatch : stage === 'LEAGUE_STAGE' || stage === 'FINAL',
      isKnockoutBracketStage: isKnockoutBracketStage(stage),
      utcDate: raw.utcDate ?? null,
      status,
      homeTeam: normalizeTeam(raw.homeTeam),
      awayTeam: normalizeTeam(raw.awayTeam),
      venue: raw.venue ?? null,
      score,
      resolutionNote: buildResolutionNote(status, score.isScoreAmbiguous, score.ambiguityNote),
    };
  });

  const knockoutCount = knockoutRaw.length;
  const statusMessage =
    knockoutCount === 0
      ? `تمت مزامنة ${allMatches.length} مباراة في دوري أبطال أوروبا ${seasonLabel}. مواجهات دور الـ16 حتى النهائي لا تزال بانتظار القرعة والتأهل.`
      : `تمت مزامنة ${allMatches.length} مباراة في دوري أبطال أوروبا ${seasonLabel}، من بينها ${knockoutCount} مباراة في الأدوار الإقصائية.`;

  return {
    schemaVersion: 1,
    competitionCode: COMPETITION_CONFIG.competitionCode,
    competitionName: COMPETITION_CONFIG.competitionName,
    seasonStartYear: expectedSeasonStartYear,
    seasonLabel,
    ingestionStatus: 'ok',
    statusMessage,
    sourceName: COMPETITION_CONFIG.providerName,
    sourceLastUpdatedUtc: latestSourceTs > 0 ? new Date(latestSourceTs).toISOString() : ingestedAtUtc,
    ingestedAtUtc,
    ties: finalTies,
    matches: allMatches,
  };
}
