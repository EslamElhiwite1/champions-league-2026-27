import {COMPETITION_CONFIG, type TimezoneMode} from '../config/competition';
import type {
  AggregateSummary,
  CompetitionStage,
  KnockoutBracketStage,
  KnockoutMatch,
  KnockoutSnapshot,
  KnockoutTie,
  MatchStatus,
  NormalizedScore,
  RawFootballDataScore,
  ScoreDuration,
  ScorePair,
  TeamRef,
  TieAdvancement,
} from '../types/knockout';
import {getArabicClubDisplayName} from './arabicClubs';

export const STAGE_ORDER: KnockoutBracketStage[] = [
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINAL',
];

export const ALL_STAGE_ORDER: CompetitionStage[] = [
  'LEAGUE_STAGE',
  'PLAYOFFS',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'FINAL',
  'QUALIFICATION',
  'PRELIMINARY_ROUND',
  'OTHER',
];

export const STAGE_LABELS: Record<CompetitionStage, string> = {
  LEAGUE_STAGE: 'مرحلة الدوري',
  PLAYOFFS: 'ملحق الأدوار الإقصائية',
  ROUND_OF_16: 'دور الـ16',
  QUARTER_FINALS: 'ربع النهائي',
  SEMI_FINALS: 'نصف النهائي',
  FINAL: 'النهائي',
  QUALIFICATION: 'التصفيات',
  PRELIMINARY_ROUND: 'الدور التمهيدي',
  OTHER: 'مرحلة أخرى',
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'مجدولة',
  TIMED: 'تحدّد موعد الانطلاق',
  IN_PLAY: 'جارية الآن',
  PAUSED: 'استراحة / متوقفة مؤقتًا',
  FINISHED: 'انتهت',
  POSTPONED: 'مؤجلة',
  SUSPENDED: 'معلقة',
  CANCELLED: 'ملغاة',
  AWARDED: 'معتمدة بقرار إداري',
  UNKNOWN: 'بانتظار التحديد',
};

export interface BracketSlotBlueprint {
  tieId: string;
  stage: KnockoutBracketStage;
  bracketSide: 'LEFT' | 'RIGHT' | 'CENTER';
  slotIndex: number;
  label: string;
  isTwoLegged: boolean;
  feedsIntoTieId: string | null;
}

export const BRACKET_BLUEPRINT: BracketSlotBlueprint[] = [
  // Left side Round of 16
  {tieId: 'R16-1', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 0, label: 'دور الـ16 · المواجهة 1', isTwoLegged: true, feedsIntoTieId: 'QF-1'},
  {tieId: 'R16-2', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 1, label: 'دور الـ16 · المواجهة 2', isTwoLegged: true, feedsIntoTieId: 'QF-1'},
  {tieId: 'R16-3', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 2, label: 'دور الـ16 · المواجهة 3', isTwoLegged: true, feedsIntoTieId: 'QF-2'},
  {tieId: 'R16-4', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 3, label: 'دور الـ16 · المواجهة 4', isTwoLegged: true, feedsIntoTieId: 'QF-2'},
  // Right side Round of 16
  {tieId: 'R16-5', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 4, label: 'دور الـ16 · المواجهة 5', isTwoLegged: true, feedsIntoTieId: 'QF-3'},
  {tieId: 'R16-6', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 5, label: 'دور الـ16 · المواجهة 6', isTwoLegged: true, feedsIntoTieId: 'QF-3'},
  {tieId: 'R16-7', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 6, label: 'دور الـ16 · المواجهة 7', isTwoLegged: true, feedsIntoTieId: 'QF-4'},
  {tieId: 'R16-8', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 7, label: 'دور الـ16 · المواجهة 8', isTwoLegged: true, feedsIntoTieId: 'QF-4'},
  // Left side Quarter-finals
  {tieId: 'QF-1', stage: 'QUARTER_FINALS', bracketSide: 'LEFT', slotIndex: 0, label: 'ربع النهائي · المواجهة 1', isTwoLegged: true, feedsIntoTieId: 'SF-1'},
  {tieId: 'QF-2', stage: 'QUARTER_FINALS', bracketSide: 'LEFT', slotIndex: 1, label: 'ربع النهائي · المواجهة 2', isTwoLegged: true, feedsIntoTieId: 'SF-1'},
  // Right side Quarter-finals
  {tieId: 'QF-3', stage: 'QUARTER_FINALS', bracketSide: 'RIGHT', slotIndex: 2, label: 'ربع النهائي · المواجهة 3', isTwoLegged: true, feedsIntoTieId: 'SF-2'},
  {tieId: 'QF-4', stage: 'QUARTER_FINALS', bracketSide: 'RIGHT', slotIndex: 3, label: 'ربع النهائي · المواجهة 4', isTwoLegged: true, feedsIntoTieId: 'SF-2'},
  // Semi-finals
  {tieId: 'SF-1', stage: 'SEMI_FINALS', bracketSide: 'LEFT', slotIndex: 0, label: 'نصف النهائي 1', isTwoLegged: true, feedsIntoTieId: 'FINAL-1'},
  {tieId: 'SF-2', stage: 'SEMI_FINALS', bracketSide: 'RIGHT', slotIndex: 1, label: 'نصف النهائي 2', isTwoLegged: true, feedsIntoTieId: 'FINAL-1'},
  // Final
  {tieId: 'FINAL-1', stage: 'FINAL', bracketSide: 'CENTER', slotIndex: 0, label: 'نهائي 2026/27', isTwoLegged: false, feedsIntoTieId: null},
];

export function createTbdTeam(reason = 'بانتظار إجراء القرعة وتأكيد المتأهلين'): TeamRef {
  return {
    id: null,
    name: 'TBD',
    shortName: 'TBD',
    tla: 'TBD',
    monogram: '—',
    crestUrl: null,
    isTbd: true,
    tbdReason: reason,
  };
}

export function deriveMonogram(name: string, tla?: string | null): string {
  const cleanTla = (tla ?? '').trim().toUpperCase();
  if (cleanTla.length >= 2 && cleanTla.length <= 4 && cleanTla !== 'TBD') {
    return cleanTla.slice(0, 3);
  }
  const words = name
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function isValidPair(pair: ScorePair | null | undefined): pair is {home: number; away: number} {
  return (
    pair != null &&
    typeof pair.home === 'number' &&
    Number.isFinite(pair.home) &&
    typeof pair.away === 'number' &&
    Number.isFinite(pair.away)
  );
}

function pairsEqual(a: {home: number; away: number}, b: {home: number; away: number}): boolean {
  return a.home === b.home && a.away === b.away;
}

function addPairs(
  a: {home: number; away: number},
  b: {home: number; away: number},
): {home: number; away: number} {
  return {home: a.home + b.home, away: a.away + b.away};
}

function subtractPairs(
  a: {home: number; away: number},
  b: {home: number; away: number},
): {home: number; away: number} {
  return {home: a.home - b.home, away: a.away - b.away};
}

export function normalizeDuration(rawDuration: string | null | undefined): ScoreDuration | null {
  if (rawDuration === 'REGULAR' || rawDuration === 'EXTRA_TIME' || rawDuration === 'PENALTY_SHOOTOUT') {
    return rawDuration;
  }
  return null;
}

/**
 * Normalizes provider score breakdown while guaranteeing extra time and penalties
 * are never double-counted or mixed into open-play aggregate totals.
 */
export function resolveNormalizedScore(rawScore: RawFootballDataScore | null | undefined): NormalizedScore {
  if (!rawScore) {
    return {
      duration: null,
      openPlay: null,
      halfTime: null,
      regularTime: null,
      extraTime: null,
      penalties: null,
      winnerSide: null,
      isScoreAmbiguous: false,
    };
  }

  const duration = normalizeDuration(rawScore.duration);
  const fullTime = isValidPair(rawScore.fullTime) ? {home: rawScore.fullTime.home, away: rawScore.fullTime.away} : null;
  const halfTime = isValidPair(rawScore.halfTime) ? {home: rawScore.halfTime.home, away: rawScore.halfTime.away} : null;
  const regularTime = isValidPair(rawScore.regularTime)
    ? {home: rawScore.regularTime.home, away: rawScore.regularTime.away}
    : null;
  const extraTime = isValidPair(rawScore.extraTime)
    ? {home: rawScore.extraTime.home, away: rawScore.extraTime.away}
    : null;
  const penalties = isValidPair(rawScore.penalties)
    ? {home: rawScore.penalties.home, away: rawScore.penalties.away}
    : null;
  const winnerSide =
    rawScore.winner === 'HOME_TEAM' || rawScore.winner === 'AWAY_TEAM' || rawScore.winner === 'DRAW'
      ? rawScore.winner
      : null;

  if (duration === 'PENALTY_SHOOTOUT' || penalties != null) {
    if (regularTime && extraTime) {
      const regPlusEt = addPairs(regularTime, extraTime);
      if (fullTime && pairsEqual(fullTime, extraTime)) {
        return {
          duration: duration ?? 'PENALTY_SHOOTOUT',
          openPlay: extraTime,
          halfTime,
          regularTime,
          extraTime: subtractPairs(extraTime, regularTime),
          penalties,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      if (
        fullTime &&
        penalties &&
        pairsEqual(fullTime, addPairs(extraTime, penalties)) &&
        extraTime.home >= regularTime.home &&
        extraTime.away >= regularTime.away
      ) {
        return {
          duration: duration ?? 'PENALTY_SHOOTOUT',
          openPlay: extraTime,
          halfTime,
          regularTime,
          extraTime: subtractPairs(extraTime, regularTime),
          penalties,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      return {
        duration: duration ?? 'PENALTY_SHOOTOUT',
        openPlay: regPlusEt,
        halfTime,
        regularTime,
        extraTime,
        penalties,
        winnerSide,
        isScoreAmbiguous: false,
      };
    }

    if (regularTime && !extraTime) {
      if (fullTime && penalties && pairsEqual(fullTime, addPairs(regularTime, penalties))) {
        return {
          duration: duration ?? 'PENALTY_SHOOTOUT',
          openPlay: regularTime,
          halfTime,
          regularTime,
          extraTime: null,
          penalties,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      if (fullTime && pairsEqual(fullTime, regularTime)) {
        return {
          duration: duration ?? 'PENALTY_SHOOTOUT',
          openPlay: regularTime,
          halfTime,
          regularTime,
          extraTime: null,
          penalties,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      if (!fullTime) {
        return {
          duration: duration ?? 'PENALTY_SHOOTOUT',
          openPlay: regularTime,
          halfTime,
          regularTime,
          extraTime: null,
          penalties,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
    }

    if (!regularTime && fullTime && penalties) {
      return {
        duration: duration ?? 'PENALTY_SHOOTOUT',
        openPlay: null,
        halfTime,
        regularTime: null,
        extraTime,
        penalties,
        winnerSide,
        isScoreAmbiguous: true,
        ambiguityNote:
          'بيانات النتيجة تفتقر لتفصيل الوقت الأصلي بجانب ركلات الترجيح؛ تم تعليق المجموع تفاديًا للازدواجية.',
      };
    }

    return {
      duration: duration ?? 'PENALTY_SHOOTOUT',
      openPlay: regularTime ?? fullTime,
      halfTime,
      regularTime,
      extraTime,
      penalties,
      winnerSide,
      isScoreAmbiguous: false,
    };
  }

  if (duration === 'EXTRA_TIME' || extraTime != null) {
    if (regularTime && extraTime) {
      const regPlusEt = addPairs(regularTime, extraTime);
      if (fullTime && pairsEqual(fullTime, regPlusEt)) {
        return {
          duration: duration ?? 'EXTRA_TIME',
          openPlay: regPlusEt,
          halfTime,
          regularTime,
          extraTime,
          penalties: null,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      if (fullTime && pairsEqual(fullTime, extraTime)) {
        return {
          duration: duration ?? 'EXTRA_TIME',
          openPlay: extraTime,
          halfTime,
          regularTime,
          extraTime: subtractPairs(extraTime, regularTime),
          penalties: null,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      if (!fullTime) {
        return {
          duration: duration ?? 'EXTRA_TIME',
          openPlay: regPlusEt,
          halfTime,
          regularTime,
          extraTime,
          penalties: null,
          winnerSide,
          isScoreAmbiguous: false,
        };
      }
      return {
        duration: duration ?? 'EXTRA_TIME',
        openPlay: null,
        halfTime,
        regularTime,
        extraTime,
        penalties: null,
        winnerSide,
        isScoreAmbiguous: true,
        ambiguityNote: 'تعذّر التوفيق بين أهداف الوقت الأصلي والوقت الإضافي في بيانات المصدر.',
      };
    }

    return {
      duration: duration ?? 'EXTRA_TIME',
      openPlay: fullTime ?? regularTime,
      halfTime,
      regularTime,
      extraTime,
      penalties: null,
      winnerSide,
      isScoreAmbiguous: false,
    };
  }

  const resolvedOpenPlay = fullTime ?? regularTime;
  return {
    duration: duration ?? (resolvedOpenPlay ? 'REGULAR' : null),
    openPlay: resolvedOpenPlay,
    halfTime,
    regularTime: regularTime ?? fullTime,
    extraTime: null,
    penalties: null,
    winnerSide,
    isScoreAmbiguous: false,
  };
}

export function isMatchConcluded(status: MatchStatus): boolean {
  return status === 'FINISHED' || status === 'AWARDED';
}

function getGoalsForTeam(
  match: KnockoutMatch,
  teamId: number,
): {scored: number | null; conceded: number | null} {
  if (!match.score.openPlay || match.score.isScoreAmbiguous) {
    return {scored: null, conceded: null};
  }
  if (match.homeTeam.id === teamId) {
    return {scored: match.score.openPlay.home, conceded: match.score.openPlay.away};
  }
  if (match.awayTeam.id === teamId) {
    return {scored: match.score.openPlay.away, conceded: match.score.openPlay.home};
  }
  return {scored: null, conceded: null};
}

function getPenaltyScoreForTeam(
  match: KnockoutMatch,
  teamId: number,
): {scored: number; conceded: number} | null {
  if (!match.score.penalties) return null;
  if (match.score.penalties.home == null || match.score.penalties.away == null) return null;
  if (match.homeTeam.id === teamId) {
    return {scored: match.score.penalties.home, conceded: match.score.penalties.away};
  }
  if (match.awayTeam.id === teamId) {
    return {scored: match.score.penalties.away, conceded: match.score.penalties.home};
  }
  return null;
}

function getWinnerTeamFromSide(match: KnockoutMatch): TeamRef | null {
  if (match.score.winnerSide === 'HOME_TEAM' && !match.homeTeam.isTbd) return match.homeTeam;
  if (match.score.winnerSide === 'AWAY_TEAM' && !match.awayTeam.isTbd) return match.awayTeam;
  return null;
}

export function evaluateTieProgression(tie: Omit<KnockoutTie, 'aggregate' | 'advancement'>): {
  aggregate: AggregateSummary;
  advancement: TieAdvancement;
} {
  const emptyAgg: AggregateSummary = {
    teamAScore: null,
    teamBScore: null,
    includesExtraTime: false,
    decidedByPenalties: false,
    penaltyScore: null,
    isComplete: false,
  };

  if (tie.teamA.isTbd || tie.teamB.isTbd || tie.teamA.id == null || tie.teamB.id == null) {
    return {
      aggregate: emptyAgg,
      advancement: {
        status: 'UNDECIDED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation: 'لم يتم تأكيد طرفي هذه المواجهة بعد.',
      },
    };
  }

  const teamADisplay = getArabicClubDisplayName(tie.teamA);
  const teamBDisplay = getArabicClubDisplayName(tie.teamB);

  // Single-leg Final
  if (!tie.isTwoLegged) {
    const match = tie.legs[0];
    if (!match) {
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNDECIDED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: 'مباراة النهائي بانتظار بيانات الجدول المؤكدة.',
        },
      };
    }

    if (!isMatchConcluded(match.status)) {
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNDECIDED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: `حالة النهائي: ${STATUS_LABELS[match.status]}. يتأكد البطل بعد انتهاء المباراة فقط.`,
        },
      };
    }

    if (match.status === 'AWARDED') {
      const awardedWinner = getWinnerTeamFromSide(match);
      if (!awardedWinner) {
        return {
          aggregate: emptyAgg,
          advancement: {
            status: 'UNRESOLVED',
            winnerTeamId: null,
            winnerName: null,
            method: null,
            explanation: 'سُجل النهائي بقرار إداري دون تحديد النادي الفائز.',
          },
        };
      }
      const winnerAr = getArabicClubDisplayName(awardedWinner);
      return {
        aggregate: {
          ...emptyAgg,
          teamAScore: getGoalsForTeam(match, tie.teamA.id).scored,
          teamBScore: getGoalsForTeam(match, tie.teamB.id).scored,
          isComplete: true,
        },
        advancement: {
          status: 'CONFIRMED',
          winnerTeamId: awardedWinner.id,
          winnerName: winnerAr,
          method: 'AWARDED',
          explanation: `حُسم النهائي بقرار إداري لصالح ${winnerAr}.`,
        },
      };
    }

    if (match.score.isScoreAmbiguous) {
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNRESOLVED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: match.score.ambiguityNote ?? 'تعذر التحقق من نتيجة النهائي بشكل آمن.',
        },
      };
    }

    const aGoals = getGoalsForTeam(match, tie.teamA.id).scored;
    const bGoals = getGoalsForTeam(match, tie.teamB.id).scored;

    if (aGoals == null || bGoals == null) {
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNRESOLVED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: 'النهائي مُسجل كمنتهٍ لكن الأهداف الرقمية المؤكدة مفقودة.',
        },
      };
    }

    const includesExtraTime =
      match.score.duration === 'EXTRA_TIME' || match.score.duration === 'PENALTY_SHOOTOUT';

    if (aGoals !== bGoals) {
      const winner = aGoals > bGoals ? tie.teamA : tie.teamB;
      const winnerAr = winner.id === tie.teamA.id ? teamADisplay : teamBDisplay;
      const providerWinner = getWinnerTeamFromSide(match);
      if (providerWinner && providerWinner.id !== winner.id) {
        return {
          aggregate: {
            teamAScore: aGoals,
            teamBScore: bGoals,
            includesExtraTime,
            decidedByPenalties: false,
            penaltyScore: null,
            isComplete: false,
          },
          advancement: {
            status: 'UNRESOLVED',
            winnerTeamId: null,
            winnerName: null,
            method: null,
            explanation: 'تضارب بين الفائز المسجل ونتيجة النهائي؛ النتيجة معلّقة.',
          },
        };
      }

      return {
        aggregate: {
          teamAScore: aGoals,
          teamBScore: bGoals,
          includesExtraTime,
          decidedByPenalties: false,
          penaltyScore: null,
          isComplete: true,
        },
        advancement: {
          status: 'CONFIRMED',
          winnerTeamId: winner.id,
          winnerName: winnerAr,
          method: includesExtraTime ? 'EXTRA_TIME' : 'SINGLE_MATCH',
          explanation: `فاز ${winnerAr} بالنهائي بنتيجة ${Math.max(aGoals, bGoals)}–${Math.min(aGoals, bGoals)}${includesExtraTime ? ' بعد الوقت الإضافي' : ''}.`,
        },
      };
    }

    const penA = getPenaltyScoreForTeam(match, tie.teamA.id);
    if (match.score.duration === 'PENALTY_SHOOTOUT' && penA && penA.scored !== penA.conceded) {
      const winner = penA.scored > penA.conceded ? tie.teamA : tie.teamB;
      const winnerAr = winner.id === tie.teamA.id ? teamADisplay : teamBDisplay;
      const providerWinner = getWinnerTeamFromSide(match);
      if (providerWinner && providerWinner.id !== winner.id) {
        return {
          aggregate: {
            teamAScore: aGoals,
            teamBScore: bGoals,
            includesExtraTime: true,
            decidedByPenalties: true,
            penaltyScore: {teamA: penA.scored, teamB: penA.conceded},
            isComplete: false,
          },
          advancement: {
            status: 'UNRESOLVED',
            winnerTeamId: null,
            winnerName: null,
            method: null,
            explanation: 'تضارب بين حقل الفائز ونتيجة ركلات الترجيح.',
          },
        };
      }
      return {
        aggregate: {
          teamAScore: aGoals,
          teamBScore: bGoals,
          includesExtraTime: true,
          decidedByPenalties: true,
          penaltyScore: {teamA: penA.scored, teamB: penA.conceded},
          isComplete: true,
        },
        advancement: {
          status: 'CONFIRMED',
          winnerTeamId: winner.id,
          winnerName: winnerAr,
          method: 'PENALTIES',
          explanation: `حسم ${winnerAr} النهائي بركلات الترجيح (${Math.max(penA.scored, penA.conceded)}–${Math.min(penA.scored, penA.conceded)}).`,
        },
      };
    }

    return {
      aggregate: {
        teamAScore: aGoals,
        teamBScore: bGoals,
        includesExtraTime,
        decidedByPenalties: false,
        penaltyScore: null,
        isComplete: false,
      },
      advancement: {
        status: 'UNRESOLVED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation: 'تعادل في النهائي دون توثيق ركلات ترجيح حاسمة.',
      },
    };
  }

  // Two-legged tie evaluation
  const leg1 = tie.legs.find((m) => m.leg === 1) ?? tie.legs[0];
  const leg2 = tie.legs.find((m) => m.leg === 2) ?? (tie.legs.length > 1 ? tie.legs[1] : undefined);

  if (!leg1 || !leg2) {
    const partialA = leg1 && isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamA.id).scored : null;
    const partialB = leg1 && isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamB.id).scored : null;
    return {
      aggregate: {
        teamAScore: partialA,
        teamBScore: partialB,
        includesExtraTime: false,
        decidedByPenalties: false,
        penaltyScore: null,
        isComplete: false,
      },
      advancement: {
        status: 'UNDECIDED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation:
          leg1 && isMatchConcluded(leg1.status)
            ? 'اكتملت مباراة الذهاب وبانتظار الإياب. لا يتأهل أي فريق قبل حسم المباراتين.'
            : 'بانتظار استكمال مباراتي الذهاب والإياب.',
      },
    };
  }

  if (!isMatchConcluded(leg1.status) || !isMatchConcluded(leg2.status)) {
    const partialA = isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamA.id).scored : null;
    const partialB = isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamB.id).scored : null;
    const blockingStatus = !isMatchConcluded(leg1.status) ? leg1.status : leg2.status;
    const blockingLeg = !isMatchConcluded(leg1.status) ? 'مباراة الذهاب' : 'مباراة الإياب';
    return {
      aggregate: {
        teamAScore: partialA,
        teamBScore: partialB,
        includesExtraTime: false,
        decidedByPenalties: false,
        penaltyScore: null,
        isComplete: false,
      },
      advancement: {
        status: 'UNDECIDED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation: `${blockingLeg} بحالة (${STATUS_LABELS[blockingStatus]}). لا يمكن تأكيد المتأهل قبل اكتمال المواجهتين.`,
      },
    };
  }

  if (leg1.status === 'AWARDED' || leg2.status === 'AWARDED') {
    const awardedLeg = leg2.status === 'AWARDED' ? leg2 : leg1;
    const awardedWinner = getWinnerTeamFromSide(awardedLeg);
    if (leg1.status === 'AWARDED' && leg2.status === 'AWARDED') {
      const w1 = getWinnerTeamFromSide(leg1);
      const w2 = getWinnerTeamFromSide(leg2);
      if (w1 && w2 && w1.id === w2.id) {
        const winnerAr = getArabicClubDisplayName(w1);
        return {
          aggregate: {...emptyAgg, isComplete: true},
          advancement: {
            status: 'CONFIRMED',
            winnerTeamId: w1.id,
            winnerName: winnerAr,
            method: 'AWARDED',
            explanation: `تأهل ${winnerAr} بقرار إداري معتمد.`,
          },
        };
      }
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNRESOLVED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: 'سُجلت المباراتان بقرار إداري دون اتساق في تحديد الفائز.',
        },
      };
    }
    if (awardedWinner) {
      const l1A = getGoalsForTeam(leg1, tie.teamA.id).scored;
      const l1B = getGoalsForTeam(leg1, tie.teamB.id).scored;
      const l2A = getGoalsForTeam(leg2, tie.teamA.id).scored;
      const l2B = getGoalsForTeam(leg2, tie.teamB.id).scored;
      if (l1A != null && l1B != null && l2A != null && l2B != null) {
        const totA = l1A + l2A;
        const totB = l1B + l2B;
        if (totA !== totB) {
          const winner = totA > totB ? tie.teamA : tie.teamB;
          const winnerAr = winner.id === tie.teamA.id ? teamADisplay : teamBDisplay;
          return {
            aggregate: {
              teamAScore: totA,
              teamBScore: totB,
              includesExtraTime: false,
              decidedByPenalties: false,
              penaltyScore: null,
              isComplete: true,
            },
            advancement: {
              status: 'CONFIRMED',
              winnerTeamId: winner.id,
              winnerName: winnerAr,
              method: 'AWARDED',
              explanation: `تأهل ${winnerAr} بمجموع ${Math.max(totA, totB)}–${Math.min(totA, totB)} (يتضمن قرارًا إداريًا).`,
            },
          };
        }
      }
      return {
        aggregate: emptyAgg,
        advancement: {
          status: 'UNRESOLVED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: 'تتضمن المواجهة قرارًا إداريًا وتعذّر التحقق من المجموع الكلي.',
        },
      };
    }
  }

  if (leg1.score.isScoreAmbiguous || leg2.score.isScoreAmbiguous) {
    return {
      aggregate: emptyAgg,
      advancement: {
        status: 'UNRESOLVED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation:
          leg2.score.ambiguityNote ??
          leg1.score.ambiguityNote ??
          'تفصيل النتيجة في إحدى المباراتين غير واضح.',
      },
    };
  }

  const l1A = getGoalsForTeam(leg1, tie.teamA.id).scored;
  const l1B = getGoalsForTeam(leg1, tie.teamB.id).scored;
  const l2A = getGoalsForTeam(leg2, tie.teamA.id).scored;
  const l2B = getGoalsForTeam(leg2, tie.teamB.id).scored;

  if (l1A == null || l1B == null || l2A == null || l2B == null) {
    return {
      aggregate: emptyAgg,
      advancement: {
        status: 'UNRESOLVED',
        winnerTeamId: null,
        winnerName: null,
        method: null,
        explanation: 'المباراتان مُسجلتان كمنتهيتين لكن الأهداف الرقمية غير مكتملة.',
      },
    };
  }

  const totalA = l1A + l2A;
  const totalB = l1B + l2B;
  const includesExtraTime =
    leg2.score.duration === 'EXTRA_TIME' || leg2.score.duration === 'PENALTY_SHOOTOUT';

  if (totalA !== totalB) {
    const winner = totalA > totalB ? tie.teamA : tie.teamB;
    const winnerAr = winner.id === tie.teamA.id ? teamADisplay : teamBDisplay;
    return {
      aggregate: {
        teamAScore: totalA,
        teamBScore: totalB,
        includesExtraTime,
        decidedByPenalties: false,
        penaltyScore: null,
        isComplete: true,
      },
      advancement: {
        status: 'CONFIRMED',
        winnerTeamId: winner.id,
        winnerName: winnerAr,
        method: includesExtraTime ? 'EXTRA_TIME' : 'AGGREGATE',
        explanation: `تأهل ${winnerAr} بمجموع المباراتين ${Math.max(totalA, totalB)}–${Math.min(totalA, totalB)}${includesExtraTime ? ' بعد الوقت الإضافي' : ''}.`,
      },
    };
  }

  const penA = getPenaltyScoreForTeam(leg2, tie.teamA.id);
  if (leg2.score.duration === 'PENALTY_SHOOTOUT' && penA && penA.scored !== penA.conceded) {
    const winner = penA.scored > penA.conceded ? tie.teamA : tie.teamB;
    const winnerAr = winner.id === tie.teamA.id ? teamADisplay : teamBDisplay;
    const providerWinner = getWinnerTeamFromSide(leg2);
    if (providerWinner && providerWinner.id !== winner.id) {
      return {
        aggregate: {
          teamAScore: totalA,
          teamBScore: totalB,
          includesExtraTime: true,
          decidedByPenalties: true,
          penaltyScore: {teamA: penA.scored, teamB: penA.conceded},
          isComplete: false,
        },
        advancement: {
          status: 'UNRESOLVED',
          winnerTeamId: null,
          winnerName: null,
          method: null,
          explanation: 'تضارب بين نتيجة ركلات الترجيح وحقل الفائز في المصدر.',
        },
      };
    }

    return {
      aggregate: {
        teamAScore: totalA,
        teamBScore: totalB,
        includesExtraTime: true,
        decidedByPenalties: true,
        penaltyScore: {teamA: penA.scored, teamB: penA.conceded},
        isComplete: true,
      },
      advancement: {
        status: 'CONFIRMED',
        winnerTeamId: winner.id,
        winnerName: winnerAr,
        method: 'PENALTIES',
        explanation: `تأهل ${winnerAr} بركلات الترجيح (${Math.max(penA.scored, penA.conceded)}–${Math.min(penA.scored, penA.conceded)}) بعد التعادل ${totalA}–${totalB} في المجموع.`,
      },
    };
  }

  return {
    aggregate: {
      teamAScore: totalA,
      teamBScore: totalB,
      includesExtraTime,
      decidedByPenalties: false,
      penaltyScore: null,
      isComplete: false,
    },
    advancement: {
      status: 'UNRESOLVED',
      winnerTeamId: null,
      winnerName: null,
      method: null,
      explanation: `المجموع متعادل (${totalA}–${totalB})؛ لا يُعمل بقاعدة الهدف خارج الأرض ولم يُسجل حسم بالوقت الإضافي أو ركلات الترجيح.`,
    },
  };
}

export function propagateVerifiedAdvancement(ties: KnockoutTie[]): KnockoutTie[] {
  const cloned = ties.map((t) => ({
    ...t,
    teamA: {...t.teamA},
    teamB: {...t.teamB},
    legs: [...t.legs],
    aggregate: {...t.aggregate},
    advancement: {...t.advancement},
  }));

  const byId = new Map(cloned.map((t) => [t.tieId, t]));

  for (const stage of ['ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS'] as KnockoutBracketStage[]) {
    const stageTies = cloned.filter((t) => t.stage === stage);
    for (const sourceTie of stageTies) {
      if (!sourceTie.feedsIntoTieId) continue;
      const targetTie = byId.get(sourceTie.feedsIntoTieId);
      if (!targetTie) continue;

      if (sourceTie.advancement.status !== 'CONFIRMED' || sourceTie.advancement.winnerTeamId == null) {
        continue;
      }

      const winnerTeam =
        sourceTie.teamA.id === sourceTie.advancement.winnerTeamId ? sourceTie.teamA : sourceTie.teamB;

      const isUpperFeeder = sourceTie.slotIndex % 2 === 0;
      if (isUpperFeeder && targetTie.teamA.isTbd) {
        targetTie.teamA = {...winnerTeam};
      } else if (!isUpperFeeder && targetTie.teamB.isTbd) {
        targetTie.teamB = {...winnerTeam};
      }
    }
  }

  return cloned;
}

export function createEmptyBracketSkeleton(
  tbdReason = 'لم تُحسم قرعة الأدوار الإقصائية لموسم 2026/27 بعد.',
): KnockoutTie[] {
  return BRACKET_BLUEPRINT.map((slot) => {
    const base: Omit<KnockoutTie, 'aggregate' | 'advancement'> = {
      tieId: slot.tieId,
      stage: slot.stage,
      bracketSide: slot.bracketSide,
      slotIndex: slot.slotIndex,
      label: slot.label,
      isTwoLegged: slot.isTwoLegged,
      teamA: createTbdTeam(tbdReason),
      teamB: createTbdTeam(tbdReason),
      legs: [],
      feedsIntoTieId: slot.feedsIntoTieId,
    };
    const evaluated = evaluateTieProgression(base);
    return {
      ...base,
      ...evaluated,
    };
  });
}

export function createInitialTruthfulSnapshot(): KnockoutSnapshot {
  return {
    schemaVersion: 1,
    competitionCode: COMPETITION_CONFIG.competitionCode,
    competitionName: COMPETITION_CONFIG.competitionName,
    seasonStartYear: COMPETITION_CONFIG.seasonStartYear,
    seasonLabel: COMPETITION_CONFIG.seasonLabel,
    ingestionStatus: 'not_configured',
    statusMessage:
      'بانتظار أول مزامنة موثقة للبيانات. عند نشر اللقطة المحدّثة ستظهر هنا جميع مباريات مرحلة الدوري والأدوار الإقصائية لموسم 2026/27.',
    sourceName: COMPETITION_CONFIG.providerName,
    sourceLastUpdatedUtc: null,
    ingestedAtUtc: null,
    ties: createEmptyBracketSkeleton(),
    matches: [],
  };
}

export interface OverviewStats {
  totalTies: number;
  tiesWithConfirmedParticipants: number;
  tiesDecided: number;
  totalFixtures: number;
  completedFixtures: number;
  leagueStageFixtures: number;
  knockoutBracketFixtures: number;
  nextVerifiedFixture: KnockoutMatch | null;
  champion: TeamRef | null;
}

export function computeOverviewStats(snapshot: KnockoutSnapshot, nowMs = Date.now()): OverviewStats {
  const totalTies = snapshot.ties.length;
  const tiesWithConfirmedParticipants = snapshot.ties.filter(
    (t) => !t.teamA.isTbd && !t.teamB.isTbd,
  ).length;
  const tiesDecided = snapshot.ties.filter((t) => t.advancement.status === 'CONFIRMED').length;

  const totalFixtures = snapshot.matches.length;
  const completedFixtures = snapshot.matches.filter((m) => isMatchConcluded(m.status)).length;
  const leagueStageFixtures = snapshot.matches.filter((m) => m.stage === 'LEAGUE_STAGE').length;
  const knockoutBracketFixtures = snapshot.matches.filter((m) => m.isKnockoutBracketStage).length;

  const upcoming = snapshot.matches
    .filter(
      (m) =>
        m.utcDate != null &&
        !isMatchConcluded(m.status) &&
        m.status !== 'CANCELLED' &&
        (!m.homeTeam.isTbd || !m.awayTeam.isTbd) &&
        Date.parse(m.utcDate) >= nowMs - 2 * 60 * 60 * 1000,
    )
    .sort((a, b) => Date.parse(a.utcDate!) - Date.parse(b.utcDate!));

  const finalTie = snapshot.ties.find((t) => t.stage === 'FINAL');
  let champion: TeamRef | null = null;
  if (finalTie && finalTie.advancement.status === 'CONFIRMED' && finalTie.advancement.winnerTeamId != null) {
    champion =
      finalTie.teamA.id === finalTie.advancement.winnerTeamId ? finalTie.teamA : finalTie.teamB;
  }

  return {
    totalTies,
    tiesWithConfirmedParticipants,
    tiesDecided,
    totalFixtures,
    completedFixtures,
    leagueStageFixtures,
    knockoutBracketFixtures,
    nextVerifiedFixture: upcoming[0] ?? null,
    champion,
  };
}

export function getCalendarDateKey(utcDate: string | null, timezoneMode: TimezoneMode): string {
  if (!utcDate) return 'TBD';
  const parsed = new Date(utcDate);
  if (Number.isNaN(parsed.getTime())) return 'TBD';
  const targetZone = timezoneMode === 'cairo' ? COMPETITION_CONFIG.defaultTimezone : undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: targetZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

export function getTodayDateKey(timezoneMode: TimezoneMode, nowMs = Date.now()): string {
  const targetZone = timezoneMode === 'cairo' ? COMPETITION_CONFIG.defaultTimezone : undefined;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: targetZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(nowMs));
}

/**
 * Formats kickoff date and 12-hour time with explicit صباحًا / مساءً in Arabic.
 * Uses Africa/Cairo IANA rules (automatically honoring Egypt DST) when timezoneMode === 'cairo'.
 */
export function formatKickoffTime(
  utcDate: string | null,
  timezoneMode: TimezoneMode,
): {
  dateLabel: string;
  shortDateLabel: string;
  timeLabel: string;
  tzLabel: string;
  fullLabel: string;
} {
  const tzBase = timezoneMode === 'cairo' ? 'توقيت مصر' : 'التوقيت المحلي';

  if (!utcDate) {
    return {
      dateLabel: 'التاريخ يُحدد لاحقًا',
      shortDateLabel: 'يُحدد لاحقًا',
      timeLabel: 'الوقت يُحدد لاحقًا',
      tzLabel: tzBase,
      fullLabel: 'موعد الانطلاق يُحدد لاحقًا',
    };
  }

  const parsed = new Date(utcDate);
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateLabel: 'التاريخ غير متاح',
      shortDateLabel: 'غير متاح',
      timeLabel: 'الوقت غير متاح',
      tzLabel: tzBase,
      fullLabel: 'موعد الانطلاق غير متاح',
    };
  }

  const targetZone = timezoneMode === 'cairo' ? COMPETITION_CONFIG.defaultTimezone : undefined;

  const dateLabel = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    timeZone: targetZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);

  const shortDateLabel = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    timeZone: targetZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parsed);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).formatToParts(parsed);

  const rawHour24 = Number.parseInt(timeParts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = timeParts.find((p) => p.type === 'minute')?.value ?? '00';
  const tzName =
    timeParts.find((p) => p.type === 'timeZoneName')?.value ??
    (timezoneMode === 'cairo' ? 'Africa/Cairo' : 'Local');

  const isEvening = rawHour24 >= 12;
  const hour12 = rawHour24 % 12 === 0 ? 12 : rawHour24 % 12;
  const periodLabel = isEvening ? 'مساءً' : 'صباحًا';

  const timeLabel = `${hour12}:${minute} ${periodLabel}`;
  const tzLabel = `${tzBase} (${tzName})`;

  return {
    dateLabel,
    shortDateLabel,
    timeLabel,
    tzLabel,
    fullLabel: `${dateLabel} · ${timeLabel} · ${tzLabel}`,
  };
}

export function formatRelativeAge(isoTimestamp: string | null, nowMs = Date.now()): string {
  if (!isoTimestamp) return 'لم تُحدّث بعد';
  const ts = Date.parse(isoTimestamp);
  if (Number.isNaN(ts)) return 'توقيت غير معروف';
  const diffMinutes = Math.max(0, Math.round((nowMs - ts) / 60000));
  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} د`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} س ${diffMinutes % 60} د`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

export function formatUtcTimestamp(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'غير متوفر بعد';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return 'غير متوفر بعد';
  return (
    new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d) + ' UTC'
  );
}
