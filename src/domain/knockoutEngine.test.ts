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
  isCrestUrlPermitted,
} from '../config/competition';
import {
  buildLeagueStageOnlyProviderPayload,
  SYNTHETIC_TEAMS,
} from '../testing/syntheticFixtures';
import type {RawFootballDataCompetitionMatchesResponse} from '../types/knockout';
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

  it('whitelists strictly the 9 cleared clubs (4, 5, 108, 113, 610, 675, 930, 7397, 7509) in CLEARED_CLUB_CREST_REGISTRY while blocking unpermitted external crests', () => {
    expect(Object.keys(CLEARED_CLUB_CREST_REGISTRY).sort()).toEqual([
      '108',
      '113',
      '4',
      '5',
      '610',
      '675',
      '7397',
      '7509',
      '930',
    ]);

    const bvb = getClearedClubCrest(4)!;
    expect(bvb.clubName).toBe('Borussia Dortmund');
    expect(bvb.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    );
    expect(bvb.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:Borussia_Dortmund_logo.svg',
    );
    expect(bvb.licenseLabel).toContain('Public domain');
    expect(bvb.creator).toContain('Borussia Dortmund');

    const fcb = getClearedClubCrest(5)!;
    expect(fcb.clubName).toBe('FC Bayern München');
    expect(fcb.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg',
    );
    expect(fcb.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:FC_Bayern_M%C3%BCnchen_logo_(2024).svg',
    );
    expect(fcb.licenseLabel).toContain('Public domain');

    const inter = getClearedClubCrest(108)!;
    expect(inter.clubName).toBe('FC Internazionale Milano');
    expect(inter.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    );
    expect(inter.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:FC_Internazionale_Milano_2021.svg',
    );
    expect(inter.creator).toContain('Bureau Borsche');

    const napoli = getClearedClubCrest(113)!;
    expect(napoli.clubName).toBe('SSC Napoli');
    expect(napoli.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
    );
    expect(napoli.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:SSC_Napoli_2024_(deep_blue_navy).svg',
    );
    expect(napoli.creator).toContain('SSC Napoli');

    const galatasaray = getClearedClubCrest(610)!;
    expect(galatasaray.clubName).toBe('Galatasaray SK');
    expect(galatasaray.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/2/20/Galatasaray_Sports_Club_Logo.svg',
    );
    expect(galatasaray.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:Galatasaray_Sports_Club_Logo.svg',
    );
    expect(galatasaray.creator).toContain('Ayet Emin');
    expect(galatasaray.licenseLabel).toContain('base club badge');
    expect(galatasaray.arabicLicenseNote).toContain('دون نجوم البطولات الموسمية');

    const feyenoord = getClearedClubCrest(675)!;
    expect(feyenoord.clubName).toBe('Feyenoord');
    expect(feyenoord.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/f/f9/Feyenoord_logo_since_2024.svg',
    );
    expect(feyenoord.creator).toBe('Feyenoord Rotterdam N.V.');

    const slavia = getClearedClubCrest(930)!;
    expect(slavia.clubName).toBe('SK Slavia Praha');
    expect(slavia.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/2/2b/SK_Slavia_Praha_full_logo.svg',
    );
    expect(slavia.creator).toContain('JT Design');

    const como = getClearedClubCrest(7397)!;
    expect(como.clubName).toBe('Como 1907');
    expect(como.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg',
    );
    expect(como.sourcePageUrl).toBe(
      'https://commons.wikimedia.org/wiki/File:Calcio_Como_-_logo_(Italy,_2019-).svg',
    );
    expect(como.creator).toBe('Como 1907 srl');

    const slovan = getClearedClubCrest(7509)!;
    expect(slovan.clubName).toBe('ŠK Slovan Bratislava');
    expect(slovan.imageUrl).toBe(
      'https://upload.wikimedia.org/wikipedia/commons/0/01/SK_Slovan_Bratislava_logo.svg',
    );
    expect(slovan.creator).toBe('ŠK Slovan Bratislava');

    // Uncleared clubs (including Real Madrid 86, Barcelona 81, Arsenal 57, PSG 524) must NOT be whitelisted
    expect(getClearedClubCrest(86)).toBeNull();
    expect(getClearedClubCrest(81)).toBeNull();
    expect(getClearedClubCrest(57)).toBeNull();
    expect(getClearedClubCrest(524)).toBeNull();
    expect(getClearedClubCrest(101)).toBeNull();
    expect(getClearedClubCrest(null)).toBeNull();

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
    expect(CLUB_CREST_POLICY.allowExternalCrests).toBe(false);
    expect(isCrestUrlPermitted(m.homeTeam.crestUrl)).toBe(false);
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
});
