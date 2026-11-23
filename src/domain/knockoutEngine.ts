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
  LEAGUE_STAGE: 'League Stage',
  PLAYOFFS: 'Knockout Play-offs',
  ROUND_OF_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-finals',
  SEMI_FINALS: 'Semi-finals',
  FINAL: 'Final',
  QUALIFICATION: 'Qualification',
  PRELIMINARY_ROUND: 'Preliminary Round',
  OTHER: 'Other Stage',
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  SCHEDULED: 'Scheduled',
  TIMED: 'Kickoff Set',
  IN_PLAY: 'In Progress',
  PAUSED: 'Half-time / Paused',
  FINISHED: 'Finished',
  POSTPONED: 'Postponed',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
  AWARDED: 'Awarded',
  UNKNOWN: 'Awaiting Fixture',
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
  {tieId: 'R16-1', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 0, label: 'Round of 16 · Tie 1', isTwoLegged: true, feedsIntoTieId: 'QF-1'},
  {tieId: 'R16-2', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 1, label: 'Round of 16 · Tie 2', isTwoLegged: true, feedsIntoTieId: 'QF-1'},
  {tieId: 'R16-3', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 2, label: 'Round of 16 · Tie 3', isTwoLegged: true, feedsIntoTieId: 'QF-2'},
  {tieId: 'R16-4', stage: 'ROUND_OF_16', bracketSide: 'LEFT', slotIndex: 3, label: 'Round of 16 · Tie 4', isTwoLegged: true, feedsIntoTieId: 'QF-2'},
  // Right side Round of 16
  {tieId: 'R16-5', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 4, label: 'Round of 16 · Tie 5', isTwoLegged: true, feedsIntoTieId: 'QF-3'},
  {tieId: 'R16-6', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 5, label: 'Round of 16 · Tie 6', isTwoLegged: true, feedsIntoTieId: 'QF-3'},
  {tieId: 'R16-7', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 6, label: 'Round of 16 · Tie 7', isTwoLegged: true, feedsIntoTieId: 'QF-4'},
  {tieId: 'R16-8', stage: 'ROUND_OF_16', bracketSide: 'RIGHT', slotIndex: 7, label: 'Round of 16 · Tie 8', isTwoLegged: true, feedsIntoTieId: 'QF-4'},
  // Left side Quarter-finals
  {tieId: 'QF-1', stage: 'QUARTER_FINALS', bracketSide: 'LEFT', slotIndex: 0, label: 'Quarter-final 1', isTwoLegged: true, feedsIntoTieId: 'SF-1'},
  {tieId: 'QF-2', stage: 'QUARTER_FINALS', bracketSide: 'LEFT', slotIndex: 1, label: 'Quarter-final 2', isTwoLegged: true, feedsIntoTieId: 'SF-1'},
  // Right side Quarter-finals
  {tieId: 'QF-3', stage: 'QUARTER_FINALS', bracketSide: 'RIGHT', slotIndex: 2, label: 'Quarter-final 3', isTwoLegged: true, feedsIntoTieId: 'SF-2'},
  {tieId: 'QF-4', stage: 'QUARTER_FINALS', bracketSide: 'RIGHT', slotIndex: 3, label: 'Quarter-final 4', isTwoLegged: true, feedsIntoTieId: 'SF-2'},
  // Semi-finals
  {tieId: 'SF-1', stage: 'SEMI_FINALS', bracketSide: 'LEFT', slotIndex: 0, label: 'Semi-final 1', isTwoLegged: true, feedsIntoTieId: 'FINAL-1'},
  {tieId: 'SF-2', stage: 'SEMI_FINALS', bracketSide: 'RIGHT', slotIndex: 1, label: 'Semi-final 2', isTwoLegged: true, feedsIntoTieId: 'FINAL-1'},
  // Final
  {tieId: 'FINAL-1', stage: 'FINAL', bracketSide: 'CENTER', slotIndex: 0, label: '2026/27 Final', isTwoLegged: false, feedsIntoTieId: null},
];

export function createTbdTeam(reason = 'Awaiting verified draw and qualification'): TeamRef {
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

  // Penalty shootout: open-play must strictly exclude shootout goals
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
          'Open-play score omitted regularTime breakdown alongside penalty shootout; refusing to guess whether fullTime includes shootout kicks.',
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

  // Extra time without penalties
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
        ambiguityNote:
          'Provider fullTime, regularTime, and extraTime values could not be reconciled cleanly.',
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

  // Regular time (or partial in-progress score)
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
        explanation: 'Participants are not yet confirmed for this tie.',
      },
    };
  }

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
          explanation: 'Final fixture is awaiting verified schedule data.',
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
          explanation: `Final status is ${STATUS_LABELS[match.status]}. Champion is confirmed only after completion.`,
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
            explanation: 'Final was marked Awarded without an identifiable winning club.',
          },
        };
      }
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
          winnerName: awardedWinner.name,
          method: 'AWARDED',
          explanation: `${awardedWinner.name} awarded victory in the Final.`,
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
          explanation: match.score.ambiguityNote ?? 'Final score breakdown could not be validated safely.',
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
          explanation: 'Final is marked Finished, but validated numeric scores are missing.',
        },
      };
    }

    const includesExtraTime =
      match.score.duration === 'EXTRA_TIME' || match.score.duration === 'PENALTY_SHOOTOUT';

    if (aGoals !== bGoals) {
      const winner = aGoals > bGoals ? tie.teamA : tie.teamB;
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
            explanation: 'Provider winner field conflicts with Final scoreline; holding result as unresolved.',
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
          winnerName: winner.name,
          method: includesExtraTime ? 'EXTRA_TIME' : 'SINGLE_MATCH',
          explanation: `${winner.name} won the Final ${Math.max(aGoals, bGoals)}–${Math.min(aGoals, bGoals)}${includesExtraTime ? ' after extra time' : ''}.`,
        },
      };
    }

    const penA = getPenaltyScoreForTeam(match, tie.teamA.id);
    if (match.score.duration === 'PENALTY_SHOOTOUT' && penA && penA.scored !== penA.conceded) {
      const winner = penA.scored > penA.conceded ? tie.teamA : tie.teamB;
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
            explanation: 'Provider winner disagrees with penalty shootout scores.',
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
          winnerName: winner.name,
          method: 'PENALTIES',
          explanation: `${winner.name} won the Final on penalties (${Math.max(penA.scored, penA.conceded)}–${Math.min(penA.scored, penA.conceded)}).`,
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
        explanation: 'Final score is level without a verified penalty shootout outcome.',
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
            ? 'First leg complete; second leg pending. Advancement requires both legs.'
            : 'Awaiting completion of both legs.',
      },
    };
  }

  if (!isMatchConcluded(leg1.status) || !isMatchConcluded(leg2.status)) {
    const partialA = isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamA.id).scored : null;
    const partialB = isMatchConcluded(leg1.status) ? getGoalsForTeam(leg1, tie.teamB.id).scored : null;
    const blockingStatus = !isMatchConcluded(leg1.status) ? leg1.status : leg2.status;
    const blockingLeg = !isMatchConcluded(leg1.status) ? 'First leg' : 'Second leg';
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
        explanation: `${blockingLeg} is ${STATUS_LABELS[blockingStatus]}. Advancement cannot be confirmed from incomplete legs.`,
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
        return {
          aggregate: {...emptyAgg, isComplete: true},
          advancement: {
            status: 'CONFIRMED',
            winnerTeamId: w1.id,
            winnerName: w1.name,
            method: 'AWARDED',
            explanation: `${w1.name} advanced via awarded match decision.`,
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
          explanation: 'Both legs marked Awarded without a consistent single tie winner.',
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
              winnerName: winner.name,
              method: 'AWARDED',
              explanation: `${winner.name} advances ${Math.max(totA, totB)}–${Math.min(totA, totB)} on aggregate (includes awarded fixture).`,
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
          explanation: 'One leg was marked Awarded and aggregate could not be verified across both legs.',
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
          'Score breakdown on a concluded leg was ambiguous.',
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
        explanation: 'Both legs are marked Finished, but valid numeric scores are missing.',
      },
    };
  }

  const totalA = l1A + l2A;
  const totalB = l1B + l2B;
  const includesExtraTime =
    leg2.score.duration === 'EXTRA_TIME' || leg2.score.duration === 'PENALTY_SHOOTOUT';

  if (totalA !== totalB) {
    const winner = totalA > totalB ? tie.teamA : tie.teamB;
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
        winnerName: winner.name,
        method: includesExtraTime ? 'EXTRA_TIME' : 'AGGREGATE',
        explanation: `${winner.name} advances ${Math.max(totalA, totalB)}–${Math.min(totalA, totalB)} on aggregate${includesExtraTime ? ' after extra time' : ''}.`,
      },
    };
  }

  const penA = getPenaltyScoreForTeam(leg2, tie.teamA.id);
  if (leg2.score.duration === 'PENALTY_SHOOTOUT' && penA && penA.scored !== penA.conceded) {
    const winner = penA.scored > penA.conceded ? tie.teamA : tie.teamB;
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
          explanation: 'Penalty shootout score conflicts with provider winner field.',
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
        winnerName: winner.name,
        method: 'PENALTIES',
        explanation: `${winner.name} advances on penalties (${Math.max(penA.scored, penA.conceded)}–${Math.min(penA.scored, penA.conceded)}) after ${totalA}–${totalB} aggregate.`,
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
      explanation: `Aggregate is level at ${totalA}–${totalB}; away-goals rule does not apply and no verified penalty shootout winner is present.`,
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
  tbdReason = '2026/27 knockout draw has not yet confirmed participants.',
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
      'Awaiting first authenticated snapshot sync. Once published, all 2026/27 League Stage and Knockout fixtures appear here.',
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

export function formatKickoffTime(
  utcDate: string | null,
  timezoneMode: TimezoneMode,
): {dateLabel: string; timeLabel: string; tzLabel: string; fullLabel: string} {
  if (!utcDate) {
    return {
      dateLabel: 'Date TBD',
      timeLabel: 'Kickoff TBD',
      tzLabel: timezoneMode === 'cairo' ? 'Egypt time' : 'Local time',
      fullLabel: 'Kickoff time TBD',
    };
  }

  const parsed = new Date(utcDate);
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateLabel: 'Date unavailable',
      timeLabel: 'Kickoff unavailable',
      tzLabel: timezoneMode === 'cairo' ? 'Egypt time' : 'Local time',
      fullLabel: 'Kickoff time unavailable',
    };
  }

  const targetZone = timezoneMode === 'cairo' ? COMPETITION_CONFIG.defaultTimezone : undefined;

  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);

  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  }).formatToParts(parsed);

  const hour = timeParts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = timeParts.find((p) => p.type === 'minute')?.value ?? '00';
  const tzName =
    timeParts.find((p) => p.type === 'timeZoneName')?.value ??
    (timezoneMode === 'cairo' ? 'Africa/Cairo' : 'Local');

  const timeLabel = `${hour}:${minute}`;
  const tzLabel =
    timezoneMode === 'cairo'
      ? `Egypt time (${tzName})`
      : `Local time (${tzName})`;

  return {
    dateLabel,
    timeLabel,
    tzLabel,
    fullLabel: `${dateLabel} · ${timeLabel} ${tzLabel}`,
  };
}

export function formatRelativeAge(isoTimestamp: string | null, nowMs = Date.now()): string {
  if (!isoTimestamp) return 'Never synced';
  const ts = Date.parse(isoTimestamp);
  if (Number.isNaN(ts)) return 'Unknown age';
  const diffMinutes = Math.max(0, Math.round((nowMs - ts) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatUtcTimestamp(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Not available yet';
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return 'Not available yet';
  return (
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d) + ' UTC'
  );
}
