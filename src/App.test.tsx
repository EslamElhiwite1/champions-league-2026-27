import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import App from './App';
import {adaptFootballDataMatches} from './adapters/footballDataAdapter';
import {createInitialTruthfulSnapshot} from './domain/knockoutEngine';
import {
  buildLeagueStageOnlyProviderPayload,
  buildSyntheticSnapshot,
} from './testing/syntheticFixtures';

describe('Champions League Matches & Knockout App UI', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders normal Matches as the default landing view and keeps Knockout bracket hidden until opened via bottom nav', () => {
    const initial = createInitialTruthfulSnapshot();
    render(<App initialSnapshot={initial} />);

    // Matches landing view is active by default
    expect(
      screen.getByRole('heading', {name: /2026\/27 Champions League Fixtures & Results/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {name: /Matches by Calendar Date/i}),
    ).toBeInTheDocument();

    // Knockout bracket is NOT mounted on initial load
    expect(
      screen.queryByRole('heading', {name: /2026\/27 Tournament Bracket/i}),
    ).not.toBeInTheDocument();

    // Fixed bottom navigation has Matches and trophy-labelled Knockout
    const bottomNav = screen.getByRole('navigation', {name: /Primary view navigation/i});
    const matchesNavBtn = within(bottomNav).getByRole('button', {name: /^Matches$/i});
    const knockoutNavBtn = within(bottomNav).getByRole('button', {name: /Knockout/i});

    expect(matchesNavBtn).toHaveAttribute('aria-current', 'page');
    expect(knockoutNavBtn).not.toHaveAttribute('aria-current', 'page');

    // Open Knockout bracket on demand via bottom nav
    fireEvent.click(knockoutNavBtn);
    expect(
      screen.getByRole('heading', {name: /2026\/27 Tournament Bracket/i}),
    ).toBeInTheDocument();
    expect(knockoutNavBtn).toHaveAttribute('aria-current', 'page');

    // Return to Matches via bottom nav
    fireEvent.click(matchesNavBtn);
    expect(
      screen.getByRole('heading', {name: /Matches by Calendar Date/i}),
    ).toBeInTheDocument();
  });

  it('renders 144 LEAGUE_STAGE fixtures grouped by calendar date in Egypt time without rendering unpermitted crests', () => {
    const leagueSnapshot = adaptFootballDataMatches(buildLeagueStageOnlyProviderPayload(144));
    render(<App initialSnapshot={leagueSnapshot} />);

    expect(screen.getByText(/Showing 144 of 144 verified fixture\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/144 League Stage · 0 Knockout/i)).toBeInTheDocument();
    expect(screen.getByText('0 / 15')).toBeInTheDocument();

    // Egypt time default is clearly labeled and DST-aware (19:00 UTC -> 22:00 Egypt time in September)
    expect(screen.getByRole('button', {name: /Egypt time \(Africa\/Cairo\)/i})).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getAllByText(/22:00/).length).toBeGreaterThan(0);

    // Calendar date groups appear
    expect(screen.getByRole('heading', {name: /Tue, 15 Sep(?:t)? 2026/i})).toBeInTheDocument();

    // Unpermitted third-party club crest images must NOT render
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });

  it('filters fixtures by stage, matchday, status, and team search together and resets cleanly', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} />);

    // 2 LEAGUE_STAGE + 7 ROUND_OF_16 = 9 total fixtures
    expect(screen.getByText(/Showing 9 of 9 verified fixture\(s\)/i)).toBeInTheDocument();

    // Filter by Matchday 1
    const matchdaySelect = screen.getByLabelText(/^Matchday$/i);
    fireEvent.change(matchdaySelect, {target: {value: '1'}});
    expect(screen.getByText(/Showing 1 of 9 verified fixture\(s\)/i)).toBeInTheDocument();

    // Reset and test Team Search + Status + Stage conjunction
    fireEvent.click(screen.getByRole('button', {name: /Reset Filters/i}));
    expect(screen.getByText(/Showing 9 of 9 verified fixture\(s\)/i)).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/Team Search/i);
    fireEvent.change(searchInput, {target: {value: 'Epsilon'}});
    expect(screen.getByText(/Showing 2 of 9 verified fixture\(s\)/i)).toBeInTheDocument();

    const statusSelect = screen.getByLabelText(/Match Status/i);
    fireEvent.change(statusSelect, {target: {value: 'POSTPONED'}});
    expect(screen.getByText(/Showing 1 of 9 verified fixture\(s\)/i)).toBeInTheDocument();

    const stageSelect = screen.getByLabelText(/^Stage$/i);
    fireEvent.change(stageSelect, {target: {value: 'FINAL'}});
    expect(screen.getByText(/No Fixtures Match Your Filters/i)).toBeInTheDocument();

    const resetButtons = screen.getAllByRole('button', {name: /Reset All Filters|Reset Filters/i});
    fireEvent.click(resetButtons[0]);
    expect(screen.getByText(/Showing 9 of 9 verified fixture\(s\)/i)).toBeInTheDocument();
  });

  it('opens match detail panel for both League Stage matches and Knockout ties and closes with Escape', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} />);

    // Inspect a LEAGUE_STAGE match
    const matchInfoBtns = screen.getAllByRole('button', {name: /Match Info/i});
    fireEvent.click(matchInfoBtns[0]);
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByText(/League Stage · Matchday 1/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/Half-time/i)).toBeInTheDocument();

    fireEvent.keyDown(window, {key: 'Escape'});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Switch to Knockout Bracket tab and inspect Tie 2 (Penalties)
    const bottomNav = screen.getByRole('navigation', {name: /Primary view navigation/i});
    fireEvent.click(within(bottomNav).getByRole('button', {name: /Knockout/i}));

    const inspectTie2Btns = screen.getAllByRole('button', {
      name: /Inspect Round of 16 · Tie 2: Club Gamma vs Club Delta/i,
    });
    fireEvent.click(inspectTie2Btns[0]);

    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/First Leg/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Second Leg \(Reversed Home \/ Away\)/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Penalty Shootout/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Confirmed \(Club Delta\)/i)).toBeInTheDocument();
  });

  it('switches kickoff timezone between Egypt time (Africa/Cairo) and Viewer Local', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} />);

    const egyptBtn = screen.getByRole('button', {name: /Egypt time \(Africa\/Cairo\)/i});
    const localBtn = screen.getByRole('button', {name: /^Local \(/i});

    expect(egyptBtn).toHaveAttribute('aria-pressed', 'true');
    expect(localBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(localBtn);
    expect(localBtn).toHaveAttribute('aria-pressed', 'true');
    expect(egyptBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('retains the last valid snapshot when a recheck fails instead of wiping data', async () => {
    const validSnapshot = buildSyntheticSnapshot();
    validSnapshot.isSyntheticDemo = false;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => validSnapshot,
      })
      .mockRejectedValueOnce(new Error('Network timeout'));

    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Showing 9 of 9 verified fixture\(s\)/i)).toBeInTheDocument();
    });

    const recheckBtn = screen.getByRole('button', {name: /Recheck published snapshot/i});
    fireEvent.click(recheckBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Snapshot recheck failed — retaining last validated snapshot/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Showing 9 of 9 verified fixture\(s\)/i)).toBeInTheDocument();
  });

  it('supports mobile bracket stage tabs when Knockout view is opened', () => {
    const initial = createInitialTruthfulSnapshot();
    render(<App initialSnapshot={initial} />);

    const bottomNav = screen.getByRole('navigation', {name: /Primary view navigation/i});
    fireEvent.click(within(bottomNav).getByRole('button', {name: /Knockout/i}));

    const qfTab = screen.getByRole('tab', {name: 'Quarter-finals'});
    fireEvent.click(qfTab);
    expect(qfTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', {name: 'Quarter-finals'})).toBeInTheDocument();
  });

  it('includes prefers-reduced-motion accessibility rules in global CSS', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });
});
