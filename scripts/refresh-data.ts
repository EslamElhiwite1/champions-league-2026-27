import fs from 'node:fs';
import path from 'node:path';
import {adaptFootballDataMatches} from '../src/adapters/footballDataAdapter';
import {COMPETITION_CONFIG} from '../src/config/competition';
import type {RawFootballDataCompetitionMatchesResponse} from '../src/types/knockout';

const OUTPUT_PATH = path.resolve(process.cwd(), 'public/data/knockout-snapshot.json');
const MAX_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTargetSeasonYear(): number {
  const envYear = process.env.UCL_SEASON_START_YEAR;
  if (!envYear) return COMPETITION_CONFIG.seasonStartYear;
  const parsed = Number.parseInt(envYear, 10);
  if (!Number.isFinite(parsed) || parsed < 2000 || parsed > 2100) {
    throw new Error(`Invalid UCL_SEASON_START_YEAR value: ${envYear}`);
  }
  return parsed;
}

async function fetchWithBackoff(url: string, token: string): Promise<Response> {
  let attempt = 0;
  while (true) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Auth-Token': token,
        Accept: 'application/json',
      },
    });

    if (response.status !== 429 && response.status < 500) {
      return response;
    }

    if (attempt >= MAX_RETRIES) {
      return response;
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retrySeconds = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : NaN;
    const waitMs = Number.isFinite(retrySeconds) && retrySeconds > 0
      ? Math.min(retrySeconds * 1000, 65_000)
      : 15_000 * (attempt + 1);

    console.warn(
      `Provider returned HTTP ${response.status}; backing off ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${MAX_RETRIES}.`,
    );
    await sleep(waitMs);
    attempt += 1;
  }
}

async function main() {
  const token = process.env.FOOTBALL_DATA_API_TOKEN?.trim() ?? '';
  const strictMode = process.argv.includes('--strict');
  const seasonYear = getTargetSeasonYear();

  if (!token) {
    const msg =
      'FOOTBALL_DATA_API_TOKEN is not configured; retaining existing public/data/knockout-snapshot.json without modification.';
    if (strictMode) {
      console.error(msg);
      process.exit(1);
    }
    console.info(msg);
    return;
  }

  const endpoint = `https://api.football-data.org/v4/competitions/${COMPETITION_CONFIG.competitionCode}/matches?season=${seasonYear}`;

  try {
    const response = await fetchWithBackoff(endpoint, token);

    if (!response.ok) {
      throw new Error(`Provider request failed with HTTP ${response.status} ${response.statusText}.`);
    }

    const payload = (await response.json()) as RawFootballDataCompetitionMatchesResponse;
    const snapshot = adaptFootballDataMatches(payload, {
      expectedSeasonStartYear: seasonYear,
      ingestedAtUtc: new Date().toISOString(),
    });

    fs.mkdirSync(path.dirname(OUTPUT_PATH), {recursive: true});
    const tempPath = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tempPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    fs.renameSync(tempPath, OUTPUT_PATH);

    const knockoutCount = snapshot.matches.filter((m) => m.isKnockoutBracketStage).length;
    console.info(
      `Snapshot updated successfully: ${snapshot.matches.length} CL ${snapshot.seasonLabel} fixture(s) normalized (${knockoutCount} knockout-bracket match(es)).`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown ingestion failure';
    console.error(`Snapshot refresh failed (${message}). Existing snapshot was preserved.`);
    if (strictMode || !fs.existsSync(OUTPUT_PATH)) {
      process.exit(1);
    }
  }
}

void main();
