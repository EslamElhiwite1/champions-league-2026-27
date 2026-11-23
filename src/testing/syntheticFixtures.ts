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

export const REAL_36_CL_TEAMS: readonly RawFootballDataTeam[] = [
  {id: 851, name: 'Club Brugge KV', shortName: 'Club Brugge', tla: 'BRU'},
  {id: 58, name: 'Aston Villa FC', shortName: 'Aston Villa', tla: 'AVL'},
  {id: 1899, name: 'PAE AEK', shortName: 'PAE AEK', tla: 'AEK'},
  {id: 2016, name: 'LASK Linz', shortName: 'LASK', tla: 'LIN'},
  {id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', tla: 'RMA'},
  {id: 108, name: 'FC Internazionale Milano', shortName: 'Inter', tla: 'INT'},
  {id: 503, name: 'FC Porto', shortName: 'Porto', tla: 'FCP'},
  {id: 65, name: 'Manchester City FC', shortName: 'Man City', tla: 'MCI'},
  {id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', tla: 'BVB'},
  {id: 94, name: 'Villarreal CF', shortName: 'Villarreal', tla: 'VIL'},
  {id: 521, name: 'Lille OSC', shortName: 'Lille', tla: 'LIL'},
  {id: 90, name: 'Real Betis Balompié', shortName: 'Real Betis', tla: 'BET'},
  {id: 81, name: 'FC Barcelona', shortName: 'Barça', tla: 'FCB'},
  {id: 675, name: 'Feyenoord Rotterdam', shortName: 'Feyenoord', tla: 'FEY'},
  {id: 10, name: 'VfB Stuttgart', shortName: 'Stuttgart', tla: 'VFB'},
  {id: 5720, name: 'Viking FK', shortName: 'Viking', tla: 'VIK'},
  {id: 64, name: 'Liverpool FC', shortName: 'Liverpool', tla: 'LIV'},
  {id: 78, name: 'Club Atlético de Madrid', shortName: 'Atleti', tla: 'ATL'},
  {id: 524, name: 'Paris Saint-Germain FC', shortName: 'PSG', tla: 'PSG'},
  {id: 7509, name: 'ŠK Slovan Bratislava', shortName: 'Sl. Bratislava', tla: 'SBA'},
  {id: 113, name: 'SSC Napoli', shortName: 'Napoli', tla: 'NAP'},
  {id: 57, name: 'Arsenal FC', shortName: 'Arsenal', tla: 'ARS'},
  {id: 498, name: 'Sporting Clube de Portugal', shortName: 'Sporting CP', tla: 'SPO'},
  {id: 610, name: 'Galatasaray SK', shortName: 'Galatasaray', tla: 'GAL'},
  {id: 613, name: 'Fenerbahçe SK', shortName: 'Fenerbahçe', tla: 'FEN'},
  {id: 100, name: 'AS Roma', shortName: 'Roma', tla: 'ROM'},
  {id: 674, name: 'PSV', shortName: 'PSV', tla: 'PSV'},
  {id: 1887, name: 'FK Shakhtar Donetsk', shortName: 'Shaktar', tla: 'SHD'},
  {id: 5, name: 'FC Bayern München', shortName: 'Bayern', tla: 'FCB'},
  {id: 5721, name: 'FK Bodø/Glimt', shortName: 'Bodø/Glimt', tla: 'FK'},
  {id: 66, name: 'Manchester United FC', shortName: 'Man United', tla: 'MUN'},
  {id: 10233, name: 'Sabah FK', shortName: 'Sabah FK', tla: 'SAB'},
  {id: 7397, name: 'Como 1907', shortName: 'Como 1907', tla: 'COM'},
  {id: 721, name: 'RB Leipzig', shortName: 'RB Leipzig', tla: 'RBL'},
  {id: 930, name: 'SK Slavia Praha', shortName: 'Slavia Praha', tla: 'SLP'},
  {id: 546, name: 'Racing Club de Lens', shortName: 'RC Lens', tla: 'RCL'},
];

export function buildRealNov2425ProviderPayload(): RawFootballDataCompetitionMatchesResponse {
  const byId = new Map(REAL_36_CL_TEAMS.map((t) => [t.id, t]));
  const pair = (id: number, homeId: number, awayId: number, utcDate: string) => ({
    id,
    utcDate,
    status: 'TIMED',
    stage: 'LEAGUE_STAGE',
    matchday: 5,
    homeTeam: {...byId.get(homeId)!, crest: `https://crests.football-data.org/${homeId}.png`},
    awayTeam: {...byId.get(awayId)!, crest: `https://crests.football-data.org/${awayId}.png`},
    score: {winner: null, duration: null, fullTime: {home: null, away: null}},
  });

  return {
    competition: {id: 2001, name: 'UEFA Champions League', code: 'CL'},
    filters: {season: '2026'},
    season: {id: 2026, startDate: '2026-09-15', endDate: '2027-05-29'},
    matches: [
      pair(575395, 610, 58, '2026-11-24T17:45:00Z'),
      pair(575396, 5721, 2016, '2026-11-24T17:45:00Z'),
      pair(575397, 86, 674, '2026-11-24T20:00:00Z'),
      pair(575398, 65, 113, '2026-11-24T20:00:00Z'),
      pair(575399, 57, 4, '2026-11-24T20:00:00Z'),
      pair(575400, 675, 503, '2026-11-24T20:00:00Z'),
      pair(575401, 7509, 90, '2026-11-24T20:00:00Z'),
      pair(575402, 721, 546, '2026-11-24T20:00:00Z'),
      pair(575403, 7397, 1899, '2026-11-24T20:00:00Z'),
      pair(575404, 10233, 81, '2026-11-25T17:45:00Z'),
      pair(575405, 930, 94, '2026-11-25T17:45:00Z'),
      pair(575406, 108, 10, '2026-11-25T20:00:00Z'),
      pair(575407, 78, 5720, '2026-11-25T20:00:00Z'),
      pair(575408, 524, 100, '2026-11-25T20:00:00Z'),
      pair(575409, 851, 64, '2026-11-25T20:00:00Z'),
      pair(575410, 521, 5, '2026-11-25T20:00:00Z'),
      pair(575411, 498, 66, '2026-11-25T20:00:00Z'),
      pair(575412, 1887, 613, '2026-11-25T20:00:00Z'),
    ],
  };
}

