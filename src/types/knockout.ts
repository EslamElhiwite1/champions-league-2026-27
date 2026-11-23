export type KnockoutBracketStage =
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'FINAL';

export type CompetitionStage =
  | 'LEAGUE_STAGE'
  | 'PLAYOFFS'
  | KnockoutBracketStage
  | 'PRELIMINARY_ROUND'
  | 'QUALIFICATION'
  | 'OTHER';

export type MatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'POSTPONED'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'AWARDED'
  | 'UNKNOWN';

export type ScoreDuration = 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';

export type ProviderWinner = 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;

export interface ScorePair {
  home: number | null;
  away: number | null;
}

export interface RawFootballDataTeam {
  id: number | null;
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

export interface RawFootballDataScore {
  winner?: ProviderWinner;
  duration?: ScoreDuration | string | null;
  fullTime?: ScorePair | null;
  halfTime?: ScorePair | null;
  regularTime?: ScorePair | null;
  extraTime?: ScorePair | null;
  penalties?: ScorePair | null;
}

export interface RawFootballDataMatch {
  id: number;
  utcDate?: string | null;
  status?: string | null;
  stage?: string | null;
  matchday?: number | null;
  venue?: string | null;
  homeTeam?: RawFootballDataTeam | null;
  awayTeam?: RawFootballDataTeam | null;
  score?: RawFootballDataScore | null;
  lastUpdated?: string | null;
}

export interface RawFootballDataCompetitionMatchesResponse {
  competition?: {
    id?: number;
    name?: string;
    code?: string;
  };
  filters?: {
    season?: string | number;
  };
  resultSet?: {
    count?: number;
    first?: string;
    last?: string;
    played?: number;
  };
  matches?: RawFootballDataMatch[];
  season?: {
    id?: number;
    startDate?: string;
    endDate?: string;
    currentMatchday?: number | null;
  };
}

export interface TeamRef {
  id: number | null;
  name: string;
  shortName: string;
  tla: string;
  monogram: string;
  /** Sanitized provider crest URL; only rendered if explicitly permitted by CLUB_CREST_POLICY */
  crestUrl: string | null;
  isTbd: boolean;
  tbdReason?: string;
}

export interface NormalizedScore {
  duration: ScoreDuration | null;
  /** Open-play goals (90m + extra time if played, strictly excluding shootout penalties) */
  openPlay: ScorePair | null;
  halfTime: ScorePair | null;
  regularTime: ScorePair | null;
  extraTime: ScorePair | null;
  penalties: ScorePair | null;
  winnerSide: ProviderWinner;
  isScoreAmbiguous: boolean;
  ambiguityNote?: string;
}

export interface OfficialLineupPlayer {
  id: number | null;
  name: string;
  shirtNumber: number | null;
  position: string | null;
  /** Optional formation grid coordinates supplied by a verified official lineup feed */
  gridRow?: number | null;
  gridCol?: number | null;
  /** Optional provider-sourced HTTPS photo URL; missing or broken renders neutral silhouette */
  photoUrl?: string | null;
  /** Optional provider-sourced player rating; rendered strictly when numeric and verified */
  rating?: number | null;
}

export interface OfficialTeamLineup {
  teamId: number | null;
  teamName: string;
  formation: string | null;
  coachName?: string | null;
  starters: OfficialLineupPlayer[];
  substitutes?: OfficialLineupPlayer[];
}

export interface VerifiedMatchLineups {
  /** Must be strictly true and backed by an official lineup feed — never set for squad lists */
  isOfficialLineup: boolean;
  sourceName: string;
  home: OfficialTeamLineup | null;
  away: OfficialTeamLineup | null;
}

export interface KnockoutMatch {
  matchId: string;
  providerMatchId: number | null;
  tieId: string | null;
  stage: CompetitionStage;
  rawStageLabel?: string | null;
  matchday: number | null;
  leg: 1 | 2 | null;
  isSingleMatch: boolean;
  isKnockoutBracketStage: boolean;
  utcDate: string | null;
  status: MatchStatus;
  homeTeam: TeamRef;
  awayTeam: TeamRef;
  venue: string | null;
  score: NormalizedScore;
  resolutionNote: string | null;
  /** Verified official match lineups only; explicitly null when current provider lacks lineup data */
  lineups?: VerifiedMatchLineups | null;
}

export interface AggregateSummary {
  teamAScore: number | null;
  teamBScore: number | null;
  includesExtraTime: boolean;
  decidedByPenalties: boolean;
  penaltyScore: {teamA: number; teamB: number} | null;
  isComplete: boolean;
}

export type AdvancementStatus = 'UNDECIDED' | 'CONFIRMED' | 'UNRESOLVED';

export type AdvancementMethod =
  | 'AGGREGATE'
  | 'EXTRA_TIME'
  | 'PENALTIES'
  | 'SINGLE_MATCH'
  | 'AWARDED'
  | 'PROVIDER_WINNER';

export interface TieAdvancement {
  status: AdvancementStatus;
  winnerTeamId: number | null;
  winnerName: string | null;
  method: AdvancementMethod | null;
  explanation: string;
}

export interface KnockoutTie {
  tieId: string;
  stage: KnockoutBracketStage;
  bracketSide: 'LEFT' | 'RIGHT' | 'CENTER';
  slotIndex: number;
  label: string;
  isTwoLegged: boolean;
  teamA: TeamRef;
  teamB: TeamRef;
  legs: KnockoutMatch[];
  aggregate: AggregateSummary;
  advancement: TieAdvancement;
  feedsIntoTieId: string | null;
}

export type IngestionStatus = 'ok' | 'not_configured' | 'error' | 'awaiting_draw';

export interface KnockoutSnapshot {
  schemaVersion: 1;
  competitionCode: string;
  competitionName: string;
  seasonStartYear: number;
  seasonLabel: string;
  ingestionStatus: IngestionStatus;
  statusMessage: string;
  sourceName: string;
  sourceLastUpdatedUtc: string | null;
  ingestedAtUtc: string | null;
  /** Knockout bracket ties derived strictly from Round of 16 through Final matches */
  ties: KnockoutTie[];
  /** All verified CL fixtures for the season (LEAGUE_STAGE, PLAYOFFS, and knockout rounds) */
  matches: KnockoutMatch[];
  isSyntheticDemo?: boolean;
}

export interface SnapshotLoadState {
  snapshot: KnockoutSnapshot | null;
  isLoading: boolean;
  isRefreshing: boolean;
  lastCheckedAtUtc: string | null;
  recheckError: string | null;
  isRetainedFallback: boolean;
}
