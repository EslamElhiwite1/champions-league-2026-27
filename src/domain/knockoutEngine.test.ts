import {describe, expect, it} from 'vitest';
import {
  adaptFootballDataMatches,
  ProviderValidationError,
  SeasonMismatchError,
} from '../adapters/footballDataAdapter';
import {CLUB_CREST_POLICY, isCrestUrlPermitted} from '../config/competition';
import {
  buildLeagueStageOnlyProviderPayload,
  SYNTHETIC_TEAMS,
} from '../testing/syntheticFixtures';
import type {RawFootballDataCompetitionMatchesResponse} from '../types/knockout';
import {formatKickoffTime, resolveNormalizedScore} from './knockoutEngine';

function makePayload(
  matches: RawFootballDataCompetitionMatchesResponse['matches'],
  overrides?: Partial<RawFootballDataCompetitionMatchesResponse>,
): RawFootballDataCompetitionMatchesResponse {
  return {
    competition: {id: 2001, name: 'UEFA Champions League', code: 'CL'},
    filters: {season: '2026'},
    season: {id: 2026, startDate: '2026-09-15', endDate: '2027-05-29'},
    matches,
    ...overrides,
  };
}

describe('knockoutEngine & footballDataAdapter', () => {
  it('retains all 144 LEAGUE_STAGE CL fixtures while keeping knockout bracket ties strictly TBD when no knockout matches exist', () => {
    const payload = buildLeagueStageOnlyProviderPayload(144);
    const snapshot = adaptFootballDataMatches(payload);

    expect(snapshot.matches).toHaveLength(144);
    expect(snapshot.matches.every((m) => m.stage === 'LEAGUE_STAGE')).toBe(true);
    expect(snapshot.matches.every((m) => m.isKnockoutBracketStage === false)).toBe(true);
    expect(snapshot.ties).toHaveLength(15);
    expect(snapshot.ties.every((t) => t.teamA.isTbd && t.teamB.isTbd)).toBe(true);
    expect(snapshot.ties.every((t) => t.advancement.status === 'UNDECIDED')).toBe(true);
  });

  it('stores sanitized crestUrl fields while blocking unpermitted third-party logos under CLUB_CREST_POLICY', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 5,
          utcDate: '2026-09-15T19:00:00Z',
          status: 'TIMED',
          stage: 'LEAGUE_STAGE',
          matchday: 1,
          homeTeam: {...SYNTHETIC_TEAMS.alpha, crest: 'https://crests.example.invalid/101.png'},
          awayTeam: {...SYNTHETIC_TEAMS.beta, crest: 'javascript:alert(1)'},
          score: {winner: null, duration: null, fullTime: {home: null, away: null}},
        },
      ]),
    );

    const m = snapshot.matches[0];
    expect(m.homeTeam.crestUrl).toBe('https://crests.example.invalid/101.png');
    expect(m.awayTeam.crestUrl).toBeNull();
    // Default policy suppresses external crests
    expect(CLUB_CREST_POLICY.allowExternalCrests).toBe(false);
    expect(isCrestUrlPermitted(m.homeTeam.crestUrl)).toBe(false);

    // Explicitly permitted origin allowlist allows matching HTTPS origin only
    const permittedPolicy = {
      allowExternalCrests: true,
      permittedOriginAllowlist: ['https://licensed-crests.example'],
    };
    expect(
      isCrestUrlPermitted('https://licensed-crests.example/club.svg', permittedPolicy),
    ).toBe(true);
    expect(isCrestUrlPermitted('http://licensed-crests.example/club.svg', permittedPolicy)).toBe(
      false,
    );
    expect(isCrestUrlPermitted(m.homeTeam.crestUrl, permittedPolicy)).toBe(false);
  });

  it('never advances a team from a first-leg-only tie', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 1,
          utcDate: '2027-03-09T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.alpha,
          awayTeam: SYNTHETIC_TEAMS.beta,
          score: {
            winner: 'HOME_TEAM',
            duration: 'REGULAR',
            fullTime: {home: 4, away: 0},
          },
        },
      ]),
    );

    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.advancement.status).toBe('UNDECIDED');
    expect(tie.advancement.winnerTeamId).toBeNull();
    expect(tie.aggregate.isComplete).toBe(false);

    const qf1 = snapshot.ties.find((t) => t.tieId === 'QF-1')!;
    expect(qf1.teamA.isTbd).toBe(true);
  });

  it('handles reversed home/away legs accurately and advances aggregate winner into QF', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 10,
          utcDate: '2027-03-09T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.alpha,
          awayTeam: SYNTHETIC_TEAMS.beta,
          score: {
            winner: 'HOME_TEAM',
            duration: 'REGULAR',
            fullTime: {home: 2, away: 0},
          },
        },
        {
          id: 11,
          utcDate: '2027-03-17T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.beta,
          awayTeam: SYNTHETIC_TEAMS.alpha,
          score: {
            winner: 'HOME_TEAM',
            duration: 'REGULAR',
            fullTime: {home: 1, away: 0},
          },
        },
      ]),
    );

    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.aggregate.teamAScore).toBe(2);
    expect(tie.aggregate.teamBScore).toBe(1);
    expect(tie.advancement.status).toBe('CONFIRMED');
    expect(tie.advancement.winnerTeamId).toBe(SYNTHETIC_TEAMS.alpha.id);
    expect(tie.advancement.method).toBe('AGGREGATE');

    const qf1 = snapshot.ties.find((t) => t.tieId === 'QF-1')!;
    expect(qf1.teamA.isTbd).toBe(false);
    expect(qf1.teamA.id).toBe(SYNTHETIC_TEAMS.alpha.id);
  });

  it('does NOT apply an away-goals tiebreaker on level aggregate without ET/penalties', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 20,
          utcDate: '2027-03-09T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.alpha,
          awayTeam: SYNTHETIC_TEAMS.beta,
          score: {winner: 'AWAY_TEAM', duration: 'REGULAR', fullTime: {home: 1, away: 2}},
        },
        {
          id: 21,
          utcDate: '2027-03-17T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.beta,
          awayTeam: SYNTHETIC_TEAMS.alpha,
          score: {winner: 'AWAY_TEAM', duration: 'REGULAR', fullTime: {home: 0, away: 1}},
        },
      ]),
    );

    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.aggregate.teamAScore).toBe(2);
    expect(tie.aggregate.teamBScore).toBe(2);
    expect(tie.advancement.status).toBe('UNRESOLVED');
    expect(tie.advancement.winnerTeamId).toBeNull();
  });

  it('handles Extra Time without double-counting regularTime + extraTime', () => {
    const incremental = resolveNormalizedScore({
      winner: 'HOME_TEAM',
      duration: 'EXTRA_TIME',
      regularTime: {home: 1, away: 1},
      extraTime: {home: 1, away: 0},
      fullTime: {home: 2, away: 1},
    });
    expect(incremental.openPlay).toEqual({home: 2, away: 1});
    expect(incremental.isScoreAmbiguous).toBe(false);

    const cumulative = resolveNormalizedScore({
      winner: 'HOME_TEAM',
      duration: 'EXTRA_TIME',
      regularTime: {home: 1, away: 1},
      extraTime: {home: 2, away: 1},
      fullTime: {home: 2, away: 1},
    });
    expect(cumulative.openPlay).toEqual({home: 2, away: 1});
    expect(cumulative.extraTime).toEqual({home: 1, away: 0});
    expect(cumulative.isScoreAmbiguous).toBe(false);
  });

  it('handles Penalty Shootouts cleanly without adding shootout kicks to aggregate goals', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 30,
          utcDate: '2027-03-10T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.gamma,
          awayTeam: SYNTHETIC_TEAMS.delta,
          score: {
            winner: 'HOME_TEAM',
            duration: 'REGULAR',
            fullTime: {home: 1, away: 0},
            regularTime: {home: 1, away: 0},
          },
        },
        {
          id: 31,
          utcDate: '2027-03-18T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
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
        },
      ]),
    );

    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.aggregate.teamAScore).toBe(2);
    expect(tie.aggregate.teamBScore).toBe(2);
    expect(tie.aggregate.decidedByPenalties).toBe(true);
    expect(tie.aggregate.penaltyScore).toEqual({teamA: 2, teamB: 4});
    expect(tie.advancement.status).toBe('CONFIRMED');
    expect(tie.advancement.method).toBe('PENALTIES');
    expect(tie.advancement.winnerTeamId).toBe(SYNTHETIC_TEAMS.delta.id);
  });

  it('preserves null scores as unknown rather than zero and holds FINISHED null scores as UNRESOLVED', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 40,
          utcDate: '2027-03-10T20:00:00Z',
          status: 'SCHEDULED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.alpha,
          awayTeam: SYNTHETIC_TEAMS.beta,
          score: {winner: null, duration: null, fullTime: {home: null, away: null}},
        },
        {
          id: 41,
          utcDate: '2027-03-18T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.beta,
          awayTeam: SYNTHETIC_TEAMS.alpha,
          score: {winner: null, duration: 'REGULAR', fullTime: {home: null, away: null}},
        },
      ]),
    );

    expect(snapshot.matches[0].score.openPlay).toBeNull();
    expect(snapshot.ties.find((t) => t.tieId === 'R16-1')!.advancement.status).toBe('UNDECIDED');

    const broken = adaptFootballDataMatches(
      makePayload([
        {
          id: 42,
          utcDate: '2027-03-10T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.alpha,
          awayTeam: SYNTHETIC_TEAMS.beta,
          score: {winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: {home: 1, away: 0}},
        },
        {
          id: 43,
          utcDate: '2027-03-18T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.beta,
          awayTeam: SYNTHETIC_TEAMS.alpha,
          score: {winner: null, duration: 'REGULAR', fullTime: {home: null, away: null}},
        },
      ]),
    );
    expect(broken.ties.find((t) => t.tieId === 'R16-1')!.advancement.status).toBe('UNRESOLVED');
  });

  it('keeps postponed fixtures undecided and never advances a team', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 50,
          utcDate: '2027-03-10T20:00:00Z',
          status: 'FINISHED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.epsilon,
          awayTeam: SYNTHETIC_TEAMS.zeta,
          score: {winner: 'HOME_TEAM', duration: 'REGULAR', fullTime: {home: 2, away: 0}},
        },
        {
          id: 51,
          utcDate: '2027-03-18T20:00:00Z',
          status: 'POSTPONED',
          stage: 'ROUND_OF_16',
          homeTeam: SYNTHETIC_TEAMS.zeta,
          awayTeam: SYNTHETIC_TEAMS.epsilon,
          score: {winner: null, duration: null, fullTime: {home: null, away: null}},
        },
      ]),
    );

    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.advancement.status).toBe('UNDECIDED');
    expect(tie.legs[1].status).toBe('POSTPONED');
    expect(tie.legs[1].resolutionNote).toMatch(/postponed/i);
  });

  it('handles missing/TBD teams cleanly without advancing', () => {
    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 60,
          utcDate: null,
          status: 'SCHEDULED',
          stage: 'QUARTER_FINALS',
          homeTeam: {id: null, name: null},
          awayTeam: {id: null, name: 'TBD'},
          score: null,
        },
      ]),
    );

    const qf1 = snapshot.ties.find((t) => t.tieId === 'QF-1')!;
    expect(qf1.teamA.isTbd).toBe(true);
    expect(qf1.teamB.isTbd).toBe(true);
    expect(qf1.advancement.status).toBe('UNDECIDED');
  });

  it('deduplicates duplicate provider match records by match ID', () => {
    const leg1 = {
      id: 70,
      utcDate: '2027-03-09T20:00:00Z',
      status: 'FINISHED',
      stage: 'ROUND_OF_16',
      homeTeam: SYNTHETIC_TEAMS.alpha,
      awayTeam: SYNTHETIC_TEAMS.beta,
      score: {winner: 'HOME_TEAM' as const, duration: 'REGULAR', fullTime: {home: 2, away: 0}},
      lastUpdated: '2027-03-09T22:00:00Z',
    };
    const snapshot = adaptFootballDataMatches(makePayload([leg1, {...leg1}]));
    expect(snapshot.matches).toHaveLength(1);
    const tie = snapshot.ties.find((t) => t.tieId === 'R16-1')!;
    expect(tie.legs).toHaveLength(1);
    expect(tie.advancement.status).toBe('UNDECIDED');
  });

  it('rejects season mismatches, missing competition codes, and other competitions', () => {
    expect(() =>
      adaptFootballDataMatches(
        makePayload([], {
          season: {id: 2025, startDate: '2025-09-16', endDate: '2026-05-30'},
          filters: {season: '2025'},
        }),
      ),
    ).toThrow(SeasonMismatchError);

    expect(() =>
      adaptFootballDataMatches(
        makePayload([], {
          competition: {id: 2021, name: 'Premier League', code: 'PL'},
        }),
      ),
    ).toThrow(ProviderValidationError);

    expect(() =>
      adaptFootballDataMatches(
        makePayload([], {
          competition: undefined,
        }),
      ),
    ).toThrow(ProviderValidationError);
  });

  it('converts kickoff timestamps in Egypt time (Africa/Cairo) honoring standard vs daylight-saving time', () => {
    // March 9, 2027 20:00 UTC -> winter in Egypt (UTC+2 => 22:00)
    const winterCairo = formatKickoffTime('2027-03-09T20:00:00Z', 'cairo');
    expect(winterCairo.timeLabel).toBe('22:00');
    expect(winterCairo.tzLabel).toContain('Egypt time');

    // Sept 15, 2026 19:00 UTC -> summer DST in Egypt (UTC+3 => 22:00)
    const summerCairo = formatKickoffTime('2026-09-15T19:00:00Z', 'cairo');
    expect(summerCairo.timeLabel).toBe('22:00');
    expect(summerCairo.tzLabel).toContain('Egypt time');
  });
});
