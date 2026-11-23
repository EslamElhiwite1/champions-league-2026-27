import {adaptFootballDataMatches} from '../adapters/footballDataAdapter';
import type {
  KnockoutSnapshot,
  RawFootballDataCompetitionMatchesResponse,
  RawFootballDataTeam,
} from '../types/knockout';

export const SYNTHETIC_TEAMS: Record<string, RawFootballDataTeam> = {
  realMadrid: {
    id: 86,
    name: 'Real Madrid CF',
    shortName: 'Real Madrid',
    tla: 'RMA',
    crest: 'https://crests.example.invalid/86.png',
  },
  bayern: {
    id: 5,
    name: 'FC Bayern München',
    shortName: 'Bayern Munich',
    tla: 'FCB',
    crest: 'https://crests.example.invalid/5.png',
  },
  dortmund: {
    id: 4,
    name: 'Borussia Dortmund',
    shortName: 'Dortmund',
    tla: 'BVB',
    crest: 'https://crests.example.invalid/4.png',
  },
  inter: {
    id: 108,
    name: 'FC Internazionale Milano',
    shortName: 'Inter',
    tla: 'INT',
    crest: 'https://crests.example.invalid/108.png',
  },
  napoli: {
    id: 113,
    name: 'SSC Napoli',
    shortName: 'Napoli',
    tla: 'NAP',
    crest: 'https://crests.example.invalid/113.png',
  },
  alpha: {
    id: 101,
    name: 'Club Alpha',
    shortName: 'Alpha',
    tla: 'ALP',
    crest: 'https://crests.example.invalid/101.png',
  },
  beta: {
    id: 102,
    name: 'Club Beta',
    shortName: 'Beta',
    tla: 'BET',
    crest: 'https://crests.example.invalid/102.png',
  },
  gamma: {id: 103, name: 'Club Gamma', shortName: 'Gamma', tla: 'GAM'},
  delta: {id: 104, name: 'Club Delta', shortName: 'Delta', tla: 'DEL'},
  epsilon: {id: 105, name: 'Club Epsilon', shortName: 'Epsilon', tla: 'EPS'},
  zeta: {id: 106, name: 'Club Zeta', shortName: 'Zeta', tla: 'ZET'},
  eta: {id: 107, name: 'Club Eta', shortName: 'Eta', tla: 'ETA'},
  theta: {id: 109, name: 'Club Theta', shortName: 'Theta', tla: 'THE'},
};

/**
 * Isolated synthetic test payload covering past & upcoming LEAGUE_STAGE + knockout edge cases.
 * Strictly for automated test verification — never used in production snapshots.
 */
export function buildSyntheticProviderPayload(): RawFootballDataCompetitionMatchesResponse {
  return {
    competition: {id: 2001, name: 'UEFA Champions League', code: 'CL'},
    filters: {season: '2026'},
    season: {id: 2026, startDate: '2026-09-15', endDate: '2027-05-29'},
    matches: [
      // Past LEAGUE_STAGE Matchday 1 fixtures (Sept 2026, EEST UTC+3)
      {
        id: 8001,
        utcDate: '2026-09-15T19:00:00Z',
        status: 'FINISHED',
        stage: 'LEAGUE_STAGE',
        matchday: 1,
        venue: 'Estadio Santiago Bernabéu',
        homeTeam: SYNTHETIC_TEAMS.realMadrid,
        awayTeam: SYNTHETIC_TEAMS.gamma,
        score: {
          winner: 'HOME_TEAM',
          duration: 'REGULAR',
          halfTime: {home: 1, away: 0},
          fullTime: {home: 2, away: 0},
          regularTime: {home: 2, away: 0},
        },
        lastUpdated: '2026-09-15T21:10:00Z',
      },
      {
        id: 8002,
        utcDate: '2026-09-16T08:15:00Z',
        status: 'FINISHED',
        stage: 'LEAGUE_STAGE',
        matchday: 1,
        venue: 'Beta Stadium',
        homeTeam: SYNTHETIC_TEAMS.beta,
        awayTeam: SYNTHETIC_TEAMS.delta,
        score: {
          winner: 'DRAW',
          duration: 'REGULAR',
          halfTime: {home: 0, away: 1},
          fullTime: {home: 1, away: 1},
          regularTime: {home: 1, away: 1},
        },
        lastUpdated: '2026-09-16T10:30:00Z',
      },
      // Upcoming LEAGUE_STAGE Matchday 5 fixtures (Nov 2026, EET UTC+2 -> 10:00 مساءً)
      {
        id: 8003,
        utcDate: '2026-11-24T20:00:00Z',
        status: 'TIMED',
        stage: 'LEAGUE_STAGE',
        matchday: 5,
        venue: 'Allianz Arena',
        homeTeam: SYNTHETIC_TEAMS.bayern,
        awayTeam: SYNTHETIC_TEAMS.dortmund,
        score: {
          winner: null,
          duration: null,
          fullTime: {home: null, away: null},
        },
        lastUpdated: '2026-11-20T10:00:00Z',
      },
      {
        id: 8004,
        utcDate: '2026-11-25T20:00:00Z',
        status: 'TIMED',
        stage: 'LEAGUE_STAGE',
        matchday: 5,
        venue: 'Stadio Giuseppe Meazza',
        homeTeam: SYNTHETIC_TEAMS.inter,
        awayTeam: SYNTHETIC_TEAMS.napoli,
        score: {
          winner: null,
          duration: null,
          fullTime: {home: null, away: null},
        },
        lastUpdated: '2026-11-20T10:00:00Z',
      },

      // Tie 1: Standard two-legged aggregate win (Alpha 3-2 Beta) with reversed Leg 2 home/away
      {
        id: 9001,
        utcDate: '2027-03-09T20:00:00Z',
        status: 'FINISHED',
        stage: 'ROUND_OF_16',
        venue: 'Alpha Arena',
        homeTeam: SYNTHETIC_TEAMS.alpha,
        awayTeam: SYNTHETIC_TEAMS.beta,
        score: {
          winner: 'HOME_TEAM',
          duration: 'REGULAR',
          fullTime: {home: 2, away: 1},
          regularTime: {home: 2, away: 1},
        },
        lastUpdated: '2027-03-09T22:15:00Z',
      },
      {
        id: 9002,
        utcDate: '2027-03-17T20:00:00Z',
        status: 'FINISHED',
        stage: 'ROUND_OF_16',
        venue: 'Beta Stadium',
        homeTeam: SYNTHETIC_TEAMS.beta,
        awayTeam: SYNTHETIC_TEAMS.alpha,
        score: {
          winner: 'DRAW',
          duration: 'REGULAR',
          fullTime: {home: 1, away: 1},
          regularTime: {home: 1, away: 1},
        },
        lastUpdated: '2027-03-17T22:15:00Z',
      },

      // Tie 2: Decided on penalties after Extra Time (Gamma vs Delta, 2-2 agg, 4-2 pens for Delta)
      {
        id: 9003,
        utcDate: '2027-03-10T20:00:00Z',
        status: 'FINISHED',
        stage: 'ROUND_OF_16',
        venue: 'Gamma Park',
        homeTeam: SYNTHETIC_TEAMS.gamma,
        awayTeam: SYNTHETIC_TEAMS.delta,
        score: {
          winner: 'HOME_TEAM',
          duration: 'REGULAR',
          fullTime: {home: 1, away: 0},
          regularTime: {home: 1, away: 0},
        },
        lastUpdated: '2027-03-10T22:10:00Z',
      },
      {
        id: 9004,
        utcDate: '2027-03-18T20:00:00Z',
        status: 'FINISHED',
        stage: 'ROUND_OF_16',
        venue: 'Delta Bowl',
        homeTeam: SYNTHETIC_TEAMS.delta,
        awayTeam: SYNTHETIC_TEAMS.gamma,
        score: {
          winner: 'HOME_TEAM',
          duration: 'PENALTY_SHOOTOUT',
          fullTime: {home: 6, away: 3},
          regularTime: {home: 2, away: 1},
          extraTime: {home: 0, away: 0},
          penalties: {home: 4, away: 2},
        },
        lastUpdated: '2027-03-18T23:05:00Z',
      },

      // Tie 3: First leg finished, second leg postponed -> must NOT advance!
      {
        id: 9005,
        utcDate: '2027-03-10T20:00:00Z',
        status: 'FINISHED',
        stage: 'ROUND_OF_16',
        venue: 'Epsilon Ground',
        homeTeam: SYNTHETIC_TEAMS.epsilon,
        awayTeam: SYNTHETIC_TEAMS.zeta,
        score: {
          winner: 'HOME_TEAM',
          duration: 'REGULAR',
          fullTime: {home: 3, away: 0},
          regularTime: {home: 3, away: 0},
        },
        lastUpdated: '2027-03-10T22:15:00Z',
      },
      {
        id: 9006,
        utcDate: '2027-03-18T20:00:00Z',
        status: 'POSTPONED',
        stage: 'ROUND_OF_16',
        venue: 'Zeta Dome',
        homeTeam: SYNTHETIC_TEAMS.zeta,
        awayTeam: SYNTHETIC_TEAMS.epsilon,
        score: {
          winner: null,
          duration: null,
          fullTime: {home: null, away: null},
        },
        lastUpdated: '2027-03-18T14:00:00Z',
      },

      // Tie 4: Scheduled upcoming tie (TIMED)
      {
        id: 9007,
        utcDate: '2027-07-06T19:00:00Z',
        status: 'TIMED',
        stage: 'ROUND_OF_16',
        venue: 'Eta Field',
        homeTeam: SYNTHETIC_TEAMS.eta,
        awayTeam: SYNTHETIC_TEAMS.theta,
        score: {
          winner: null,
          duration: null,
          fullTime: {home: null, away: null},
        },
        lastUpdated: '2027-03-01T12:00:00Z',
      },
    ],
  };
}

export function buildSyntheticSnapshot(): KnockoutSnapshot {
  const snapshot = adaptFootballDataMatches(buildSyntheticProviderPayload(), {
    expectedSeasonStartYear: 2026,
    ingestedAtUtc: '2026-11-23T08:17:00Z',
  });
  return {
    ...snapshot,
    isSyntheticDemo: true,
  };
}

/**
 * Simulates a LEAGUE_STAGE-only response (144 matches, 0 knockout matches).
 */
export function buildLeagueStageOnlyProviderPayload(
  count = 144,
): RawFootballDataCompetitionMatchesResponse {
  const matches = Array.from({length: count}, (_, i) => ({
    id: 7000 + i,
    utcDate: `2026-09-${String(15 + (i % 15)).padStart(2, '0')}T19:00:00Z`,
    status: i < 18 ? 'FINISHED' : 'SCHEDULED',
    stage: 'LEAGUE_STAGE',
    matchday: (i % 8) + 1,
    venue: `Venue ${i + 1}`,
    homeTeam: i % 2 === 0 ? SYNTHETIC_TEAMS.alpha : SYNTHETIC_TEAMS.gamma,
    awayTeam: i % 2 === 0 ? SYNTHETIC_TEAMS.beta : SYNTHETIC_TEAMS.delta,
    score:
      i < 18
        ? {
            winner: 'HOME_TEAM' as const,
            duration: 'REGULAR',
            halfTime: {home: 1, away: 0},
            fullTime: {home: 2, away: 1},
          }
        : {
            winner: null,
            duration: null,
            fullTime: {home: null, away: null},
          },
    lastUpdated: '2026-09-18T22:00:00Z',
  }));

  return {
    competition: {id: 2001, name: 'UEFA Champions League', code: 'CL'},
    filters: {season: '2026'},
    season: {id: 2026, startDate: '2026-09-15', endDate: '2027-05-29'},
    matches,
  };
}
