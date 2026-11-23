import {describe, expect, it} from 'vitest';
import {
  adaptFootballDataMatches,
  ProviderValidationError,
  SeasonMismatchError,
} from '../adapters/footballDataAdapter';
import {
  CLEARED_CLUB_CREST_REGISTRY,
  CLUB_CREST_POLICY,
  getClearedClubCrest,
  getVerifiedMatchBroadcaster,
  isCrestUrlPermitted,
  VERIFIED_EGYPT_BROADCASTERS,
} from '../config/competition';
import {
  buildLeagueStageOnlyProviderPayload,
  buildRealNov2425ProviderPayload,
  REAL_36_CL_TEAMS,
  SYNTHETIC_TEAMS,
} from '../testing/syntheticFixtures';
import type {RawFootballDataCompetitionMatchesResponse} from '../types/knockout';
import {resolveDefaultDateKey} from '../components/FixturesTable';
import {getArabicClubDisplayName, getTeamSearchHaystack} from './arabicClubs';
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

  it('maps strictly all 36 participating UCL team IDs to verified football-logos.cc URLs while blocking arbitrary external provider crests', () => {
    const registeredIds = Object.keys(CLEARED_CLUB_CREST_REGISTRY)
      .map(Number)
      .sort((a, b) => a - b);
    const realIds = REAL_36_CL_TEAMS.map((t) => t.id!).sort((a, b) => a - b);

    expect(registeredIds).toHaveLength(36);
    expect(registeredIds).toEqual(realIds);

    const expectedAssetsById: Record<number, {asset: string; url: string}> = {
      524: {
        asset: 'https://assets.football-logos.cc/logos/france/700x700/paris-saint-germain.a1c91d55.png',
        url: 'https://football-logos.cc/france/paris-saint-germain/',
      },
      5: {
        asset: 'https://assets.football-logos.cc/logos/germany/700x700/bayern-munchen.90b9d770.png',
        url: 'https://football-logos.cc/germany/bayern-munchen/',
      },
      86: {
        asset: 'https://assets.football-logos.cc/logos/spain/700x700/real-madrid.81d3d699.png',
        url: 'https://football-logos.cc/spain/real-madrid/',
      },
      64: {
        asset: 'https://assets.football-logos.cc/logos/england/700x700/liverpool.868c28cb.png',
        url: 'https://football-logos.cc/england/liverpool/',
      },
      108: {
        asset: 'https://assets.football-logos.cc/logos/italy/700x700/inter.305ef900.png',
        url: 'https://football-logos.cc/italy/inter/',
      },
      65: {
        asset: 'https://assets.football-logos.cc/logos/england/700x700/manchester-city.73ad38e1.png',
        url: 'https://football-logos.cc/england/manchester-city/',
      },
      57: {
        asset: 'https://assets.football-logos.cc/logos/england/700x700/arsenal.cfdaf053.png',
        url: 'https://football-logos.cc/england/arsenal/',
      },
      81: {
        asset: 'https://assets.football-logos.cc/logos/spain/700x700/barcelona.470254ee.png',
        url: 'https://football-logos.cc/spain/barcelona/',
      },
      78: {
        asset: 'https://assets.football-logos.cc/logos/spain/700x700/atletico-madrid.2bb560a3.png',
        url: 'https://football-logos.cc/spain/atletico-madrid/',
      },
      4: {
        asset: 'https://assets.football-logos.cc/logos/germany/700x700/borussia-dortmund.c2e456ab.png',
        url: 'https://football-logos.cc/germany/borussia-dortmund/',
      },
      100: {
        asset: 'https://assets.football-logos.cc/logos/italy/700x700/roma.00288a7d.png',
        url: 'https://football-logos.cc/italy/roma/',
      },
      498: {
        asset: 'https://assets.football-logos.cc/logos/portugal/700x700/sporting-cp.5a3a785e.png',
        url: 'https://football-logos.cc/portugal/sporting-cp/',
      },
      58: {
        asset: 'https://assets.football-logos.cc/logos/england/700x700/aston-villa.1c2803fb.png',
        url: 'https://football-logos.cc/england/aston-villa/',
      },
      503: {
        asset: 'https://assets.football-logos.cc/logos/portugal/700x700/fc-porto.67cd9d9f.png',
        url: 'https://football-logos.cc/portugal/fc-porto/',
      },
      66: {
        asset: 'https://assets.football-logos.cc/logos/england/700x700/manchester-united.7e7044cd.png',
        url: 'https://football-logos.cc/england/manchester-united/',
      },
      851: {
        asset: 'https://assets.football-logos.cc/logos/belgium/700x700/club-brugge.fd6c7f8b.png',
        url: 'https://football-logos.cc/belgium/club-brugge/',
      },
      90: {
        asset: 'https://assets.football-logos.cc/logos/spain/700x700/real-betis.ef36b590.png',
        url: 'https://football-logos.cc/spain/real-betis/',
      },
      674: {
        asset: 'https://assets.football-logos.cc/logos/netherlands/700x700/psv.c5b68aa1.png',
        url: 'https://football-logos.cc/netherlands/psv/',
      },
      675: {
        asset: 'https://assets.football-logos.cc/logos/netherlands/700x700/feyenoord.c90273fe.png',
        url: 'https://football-logos.cc/netherlands/feyenoord/',
      },
      521: {
        asset: 'https://assets.football-logos.cc/logos/france/700x700/lille.3695616f.png',
        url: 'https://football-logos.cc/france/lille/',
      },
      5721: {
        asset: 'https://assets.football-logos.cc/logos/norway/700x700/bodo-glimt.e3727ba0.png',
        url: 'https://football-logos.cc/norway/bodo-glimt/',
      },
      113: {
        asset: 'https://assets.football-logos.cc/logos/italy/700x700/napoli.8b5410b2.png',
        url: 'https://football-logos.cc/italy/napoli/',
      },
      721: {
        asset: 'https://assets.football-logos.cc/logos/germany/700x700/rb-leipzig.4948a7be.png',
        url: 'https://football-logos.cc/germany/rb-leipzig/',
      },
      94: {
        asset: 'https://assets.football-logos.cc/logos/spain/700x700/villarreal.f47fae64.png',
        url: 'https://football-logos.cc/spain/villarreal/',
      },
      613: {
        asset: 'https://assets.football-logos.cc/logos/turkey/700x700/fenerbahce.623eae5c.png',
        url: 'https://football-logos.cc/turkey/fenerbahce/',
      },
      1887: {
        asset: 'https://assets.football-logos.cc/logos/ukraine/700x700/shakhtar.2794b980.png',
        url: 'https://football-logos.cc/ukraine/shakhtar/',
      },
      610: {
        asset: 'https://assets.football-logos.cc/logos/turkey/700x700/galatasaray.27c56d4e.png',
        url: 'https://football-logos.cc/turkey/galatasaray/',
      },
      930: {
        asset: 'https://assets.football-logos.cc/logos/czech-republic/700x700/slavia-praha.87069829.png',
        url: 'https://football-logos.cc/czech-republic/slavia-praha/',
      },
      7509: {
        asset: 'https://assets.football-logos.cc/logos/slovakia/700x700/s-bratislava.2c8ce08e.png',
        url: 'https://football-logos.cc/slovakia/s-bratislava/',
      },
      10: {
        asset: 'https://assets.football-logos.cc/logos/germany/700x700/vfb-stuttgart.384702b0.png',
        url: 'https://football-logos.cc/germany/vfb-stuttgart/',
      },
      1899: {
        asset: 'https://assets.football-logos.cc/logos/greece/700x700/aek-athens.a8d3ff74.png',
        url: 'https://football-logos.cc/greece/aek-athens/',
      },
      2016: {
        asset: 'https://assets.football-logos.cc/logos/austria/700x700/lask.a362c52e.png',
        url: 'https://football-logos.cc/austria/lask/',
      },
      7397: {
        asset: 'https://assets.football-logos.cc/logos/italy/700x700/como-1907.9113270a.png',
        url: 'https://football-logos.cc/italy/como-1907/',
      },
      546: {
        asset: 'https://assets.football-logos.cc/logos/france/700x700/rc-lens.ae8bb17c.png',
        url: 'https://football-logos.cc/france/rc-lens/',
      },
      5720: {
        asset: 'https://assets.football-logos.cc/logos/norway/700x700/viking.b9a7b8c7.png',
        url: 'https://football-logos.cc/norway/viking/',
      },
      10233: {
        asset: 'https://assets.football-logos.cc/logos/azerbaijan/700x700/sabah.36c08f74.png',
        url: 'https://football-logos.cc/azerbaijan/sabah/',
      },
    };

    for (const [idStr, expected] of Object.entries(expectedAssetsById)) {
      const entry = getClearedClubCrest(Number(idStr));
      expect(entry).not.toBeNull();
      expect(entry!.imageUrl).toBe(expected.asset);
      expect(entry!.sourcePageUrl).toBe(expected.url);
      expect(entry!.licenseLabel).not.toMatch(/public domain|officially licensed/i);
      expect(entry!.arabicLicenseNote).not.toMatch(/الملكية العامة/);
      expect(entry!.arabicLicenseNote).toContain('football-logos.cc');
    }

    // Unknown or unmapped club IDs keep null -> geometric monogram fallback
    expect(getClearedClubCrest(101)).toBeNull();
    expect(getClearedClubCrest(99999)).toBeNull();
    expect(getClearedClubCrest(null)).toBeNull();

    const snapshot = adaptFootballDataMatches(
      makePayload([
        {
          id: 5,
          utcDate: '2026-09-15T19:00:00Z',
          status: 'TIMED',
          stage: 'LEAGUE_STAGE',
          matchday: 1,
          homeTeam: {...SYNTHETIC_TEAMS.alpha, crest: 'https://crests.football-data.org/101.png'},
          awayTeam: {...SYNTHETIC_TEAMS.beta, crest: 'javascript:alert(1)'},
          score: {winner: null, duration: null, fullTime: {home: null, away: null}},
        },
      ]),
    );

    const m = snapshot.matches[0];
    expect(m.homeTeam.crestUrl).toBe('https://crests.football-data.org/101.png');
    expect(m.awayTeam.crestUrl).toBeNull();
    expect(CLUB_CREST_POLICY.allowExternalCrests).toBe(false);
    expect(isCrestUrlPermitted(m.homeTeam.crestUrl)).toBe(false);
  });

  it('resolves verified beIN SPORTS channels strictly by Africa/Cairo date + homeTeamId + awayTeamId and returns null for unknown/swapped/other dates', () => {
    expect(VERIFIED_EGYPT_BROADCASTERS).toHaveLength(18);
    const snapshot = adaptFootballDataMatches(buildRealNov2425ProviderPayload());

    const expectedChannelsByMatchId: Record<string, string> = {
      'cl-2026-575395': 'beIN SPORTS 3',
      'cl-2026-575396': 'beIN SPORTS 4',
      'cl-2026-575397': 'beIN SPORTS 1',
      'cl-2026-575398': 'beIN SPORTS 3',
      'cl-2026-575399': 'beIN SPORTS 4',
      'cl-2026-575400': 'beIN SPORTS 6',
      'cl-2026-575401': 'beIN SPORTS 9',
      'cl-2026-575402': 'beIN SPORTS 8',
      'cl-2026-575403': 'beIN SPORTS 5',
      'cl-2026-575404': 'beIN SPORTS 2',
      'cl-2026-575405': 'beIN SPORTS 4',
      'cl-2026-575406': 'beIN SPORTS 4',
      'cl-2026-575407': 'beIN SPORTS 6',
      'cl-2026-575408': 'beIN SPORTS 1',
      'cl-2026-575409': 'beIN SPORTS 3',
      'cl-2026-575410': 'beIN SPORTS 5',
      'cl-2026-575411': 'beIN SPORTS 2',
      'cl-2026-575412': 'beIN SPORTS 8',
    };

    for (const match of snapshot.matches) {
      const resolved = getVerifiedMatchBroadcaster(match);
      expect(resolved).not.toBeNull();
      expect(resolved!.channelName).toBe(expectedChannelsByMatchId[match.matchId]);
      expect(resolved!.channelLogoUrl).toMatch(
        /^https:\/\/prod-media\.beinsports\.com\/image\/[a-f0-9]+\.png\?ver=03-06-2025$/,
      );
      expect(resolved!.channelLogoUrl).not.toContain('.3840.');
      expect(resolved!.checkedAt).toBe('2026-11-23');
      expect(resolved!.sourceUrl).toBe('https://www.beinsports.com/en-mena/tv-guide');
    }

    const sampleMatch = snapshot.matches.find((m) => m.matchId === 'cl-2026-575397')!;

    // Different date with same clubs does NOT infer a channel
    expect(
      getVerifiedMatchBroadcaster({...sampleMatch, utcDate: '2026-12-09T20:00:00Z'}),
    ).toBeNull();

    // Cairo midnight rollover shifts UTC 22:30 Nov 24 -> Nov 25 in Africa/Cairo -> does NOT match Nov 24 entry
    expect(
      getVerifiedMatchBroadcaster({...sampleMatch, utcDate: '2026-11-24T22:30:00Z'}),
    ).toBeNull();

    // Swapped home & away on the same date does NOT match
    expect(
      getVerifiedMatchBroadcaster({
        ...sampleMatch,
        homeTeam: sampleMatch.awayTeam,
        awayTeam: sampleMatch.homeTeam,
      }),
    ).toBeNull();

    // Different pairing on Nov 24 does NOT match
    expect(
      getVerifiedMatchBroadcaster({
        ...sampleMatch,
        awayTeam: {...sampleMatch.awayTeam, id: 5},
      }),
    ).toBeNull();

    // TBD participants return null
    expect(
      getVerifiedMatchBroadcaster({
        ...sampleMatch,
        homeTeam: {...sampleMatch.homeTeam, id: null, isTbd: true},
      }),
    ).toBeNull();
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
    expect(tie.legs[1].resolutionNote).toContain('تأجلت');
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

  it('maps curated UCL clubs to Arabic display names and preserves original fallback and bilingual search indexing', () => {
    expect(
      getArabicClubDisplayName({name: 'Real Madrid CF', shortName: 'Real Madrid', isTbd: false}),
    ).toBe('ريال مدريد');
    expect(
      getArabicClubDisplayName({
        name: 'FC Bayern München',
        shortName: 'Bayern Munich',
        isTbd: false,
      }),
    ).toBe('بايرن ميونخ');
    expect(
      getArabicClubDisplayName({
        name: 'Borussia Dortmund',
        shortName: 'Dortmund',
        isTbd: false,
      }),
    ).toBe('بوروسيا دورتموند');
    expect(getArabicClubDisplayName({name: 'PAE AEK', shortName: 'AEK', isTbd: false})).toBe(
      'أيك أثينا',
    );
    expect(getArabicClubDisplayName({name: 'LASK Linz', shortName: 'LASK', isTbd: false})).toBe(
      'لاسك لينتس',
    );
    expect(
      getArabicClubDisplayName({name: 'Real Betis Balompié', shortName: 'Betis', isTbd: false}),
    ).toBe('ريال بيتيس');
    expect(getArabicClubDisplayName({name: 'Viking FK', shortName: 'Viking', isTbd: false})).toBe(
      'فايكينغ',
    );
    expect(
      getArabicClubDisplayName({name: 'FK Shakhtar Donetsk', shortName: 'Shakhtar', isTbd: false}),
    ).toBe('شاختار دونيتسك');
    expect(getArabicClubDisplayName({name: 'Sabah FK', shortName: 'Sabah', isTbd: false})).toBe(
      'صباح',
    );
    expect(getArabicClubDisplayName({name: 'Como 1907', shortName: 'Como', isTbd: false})).toBe(
      'كومو',
    );
    expect(
      getArabicClubDisplayName({name: 'Racing Club de Lens', shortName: 'Lens', isTbd: false}),
    ).toBe('لانس');

    // Unmapped club safely falls back to original name
    expect(
      getArabicClubDisplayName({name: 'Club Alpha', shortName: 'Alpha', isTbd: false}),
    ).toBe('Club Alpha');

    // Search haystack contains both Arabic and original English/TLA
    const haystack = getTeamSearchHaystack({
      name: 'FC Bayern München',
      shortName: 'Bayern Munich',
      tla: 'FCB',
      isTbd: false,
    });
    expect(haystack).toContain('بايرن ميونخ');
    expect(haystack).toContain('fc bayern münchen');
    expect(haystack).toContain('fcb');
  });

  it('formats full Arabic weekday+date and 12-hour صباحًا/مساءً times in Egypt time (Africa/Cairo) with DST awareness', () => {
    // March 9, 2027 20:00 UTC -> winter in Egypt (UTC+2 => 10:00 مساءً)
    const winterCairo = formatKickoffTime('2027-03-09T20:00:00Z', 'cairo');
    expect(winterCairo.timeLabel).toBe('10:00 مساءً');
    expect(winterCairo.tzLabel).toContain('توقيت مصر');
    expect(winterCairo.dateLabel).toContain('الثلاثاء');
    expect(winterCairo.dateLabel).toContain('مارس');
    expect(winterCairo.dateLabel).toContain('2027');

    // Sept 15, 2026 19:00 UTC -> summer DST in Egypt (UTC+3 => 10:00 مساءً)
    const summerCairo = formatKickoffTime('2026-09-15T19:00:00Z', 'cairo');
    expect(summerCairo.timeLabel).toBe('10:00 مساءً');
    expect(summerCairo.tzLabel).toContain('توقيت مصر');
    expect(summerCairo.dateLabel).toContain('الثلاثاء');
    expect(summerCairo.dateLabel).toContain('سبتمبر');
    expect(summerCairo.dateLabel).toContain('2026');

    // Sept 16, 2026 08:15 UTC -> summer DST in Egypt (UTC+3 => 11:15 صباحًا)
    const morningCairo = formatKickoffTime('2026-09-16T08:15:00Z', 'cairo');
    expect(morningCairo.timeLabel).toBe('11:15 صباحًا');
    expect(morningCairo.dateLabel).toContain('الأربعاء');
  });

  it('resolves default single match day strictly as today -> nearest future -> most recent past', () => {
    const groups = [
      {dateKey: '2026-09-15'},
      {dateKey: '2026-09-16'},
      {dateKey: '2026-11-24'},
      {dateKey: '2026-11-25'},
      {dateKey: '2027-03-09'},
    ];

    // 1. Today has games -> select today
    expect(resolveDefaultDateKey(groups, '2026-11-24')).toBe('2026-11-24');

    // 2. Today has no games -> select nearest future date
    expect(resolveDefaultDateKey(groups, '2026-11-23')).toBe('2026-11-24');
    expect(resolveDefaultDateKey(groups, '2026-11-26')).toBe('2027-03-09');

    // 3. Only past dates exist -> select most recent past date
    expect(resolveDefaultDateKey(groups, '2027-06-01')).toBe('2027-03-09');
    expect(resolveDefaultDateKey([{dateKey: '2026-09-15'}, {dateKey: '2026-09-16'}], '2026-11-23')).toBe(
      '2026-09-16',
    );

    // 4. Only TBD or empty
    expect(resolveDefaultDateKey([{dateKey: 'TBD'}], '2026-11-23')).toBe('TBD');
    expect(resolveDefaultDateKey([], '2026-11-23')).toBeNull();
  });

  it('never invents lineups, players, or ratings when adapting football-data.org provider matches', () => {
    const realSnapshot = adaptFootballDataMatches(buildRealNov2425ProviderPayload());
    expect(realSnapshot.matches.length).toBeGreaterThan(0);
    for (const match of realSnapshot.matches) {
      expect(match.lineups).toBeNull();
    }
    for (const tie of realSnapshot.ties) {
      for (const leg of tie.legs) {
        expect(leg.lineups).toBeNull();
      }
    }
  });
});
