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

const NOV_23_2026_MS = Date.parse('2026-11-23T18:00:00Z');

describe('Champions League Matches & Knockout App UI (Arabic / RTL)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Arabic RTL layout with Matches as default view and opens Knockout trophy screen via bottom nav', () => {
    const initial = createInitialTruthfulSnapshot();
    const {container} = render(<App initialSnapshot={initial} nowMs={NOV_23_2026_MS} />);

    expect(container.firstElementChild).toHaveAttribute('dir', 'rtl');

    // Matches landing view is active by default in Arabic
    expect(
      screen.getByRole('heading', {name: /مباريات ونتائج دوري أبطال أوروبا 2026\/27/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {name: /المباريات حسب التاريخ/i}),
    ).toBeInTheDocument();

    // Knockout bracket is NOT mounted on initial load
    expect(
      screen.queryByRole('heading', {name: /شجرة بطولة 2026\/27/i}),
    ).not.toBeInTheDocument();

    // Fixed bottom navigation has Matches and trophy-labelled Knockout in Arabic
    const bottomNav = screen.getByRole('navigation', {name: /التنقل الرئيسي بين الأقسام/i});
    const matchesNavBtn = within(bottomNav).getByRole('button', {name: /^المباريات$/i});
    const knockoutNavBtn = within(bottomNav).getByRole('button', {name: /الأدوار الإقصائية/i});

    expect(matchesNavBtn).toHaveAttribute('aria-current', 'page');
    expect(knockoutNavBtn).not.toHaveAttribute('aria-current', 'page');

    // Open Knockout bracket on demand via bottom nav
    fireEvent.click(knockoutNavBtn);
    expect(
      screen.getByRole('heading', {name: /شجرة بطولة 2026\/27/i}),
    ).toBeInTheDocument();
    expect(knockoutNavBtn).toHaveAttribute('aria-current', 'page');

    // Desktop bracket tree retains explicit dir="ltr" spatial isolation for inward connector geometry
    const bracketSection = screen.getByRole('heading', {name: /شجرة بطولة 2026\/27/i}).closest('section')!;
    expect(bracketSection.querySelector('[dir="ltr"]')).not.toBeNull();

    // Return to Matches via bottom nav
    fireEvent.click(matchesNavBtn);
    expect(
      screen.getByRole('heading', {name: /المباريات حسب التاريخ/i}),
    ).toBeInTheDocument();
  });

  it('defaults to upcoming/current match dates first and provides quick navigation to historic September results', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    // Default landing selects upcoming/current matches (9 upcoming out of 11 total) rather than September historic results
    expect(screen.getByText(/عرض 9 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: /الثلاثاء، 24 نوفمبر 2026/i})).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {name: /الثلاثاء، 15 سبتمبر 2026/i}),
    ).not.toBeInTheDocument();

    // 12-hour Egypt time labels (مساءً) are used instead of 24-hour default
    expect(screen.getAllByText(/10:00 مساءً/).length).toBeGreaterThan(0);

    // Quick date navigation exposes past results & all dates
    const pastBtn = screen.getByRole('button', {name: /النتائج السابقة \(2\)/i});
    fireEvent.click(pastBtn);

    expect(screen.getByText(/عرض 2 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: /الثلاثاء، 15 سبتمبر 2026/i})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: /الأربعاء، 16 سبتمبر 2026/i})).toBeInTheDocument();
    // Morning kickoff shows explicit صباحًا
    expect(screen.getAllByText(/11:15 صباحًا/).length).toBeGreaterThan(0);

    // Switch to all dates
    const allDatesBtn = screen.getByRole('button', {name: /جميع التواريخ \(11\)/i});
    fireEvent.click(allDatesBtn);
    expect(screen.getByText(/عرض 11 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
  });

  it('renders strictly the 4 cleared Wikimedia Commons SVG icons (Bayern, Dortmund, Inter, Napoli) with fallback on error, monograms for other clubs, and partial coverage count in attribution', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    // TournamentOverview numeric fractions enforce dir="ltr" while labels remain RTL
    const overviewSection = document.getElementById('overview')!;
    const completedFraction = within(overviewSection).getByText('7 / 11');
    const confirmedFraction = within(overviewSection).getByText('5 / 15');
    expect(completedFraction).toHaveAttribute('dir', 'ltr');
    expect(confirmedFraction).toHaveAttribute('dir', 'ltr');

    // Upcoming view displays Bayern München (5), Borussia Dortmund (4), Inter (108), and Napoli (113)
    const imgs = Array.from(document.querySelectorAll('img'));
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) {
      expect(img.parentElement).toHaveClass('rounded-full', 'bg-white');
    }
    const uniqueSrcs = Array.from(new Set(imgs.map((img) => img.getAttribute('src'))));
    expect(uniqueSrcs.sort()).toEqual([
      'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
      'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg',
    ]);

    // Footer includes accessible attribution section, partial count/coverage note (9 clubs), and all 9 source links
    expect(
      screen.getByRole('heading', {name: /مصادر وإسناد أيقونات الشعارات المتاحة/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/تغطية جزئية للشعارات: 9 أندية مصرح بها فقط/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/يختلف توفر شعارات الأندية/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/الشعار الأساسي للنادي دون نجوم البطولات الموسمية على القميص/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /File:FC_Bayern_München_logo_\(2024\)\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:FC_Bayern_M%C3%BCnchen_logo_(2024).svg',
    );
    expect(
      screen.getByRole('link', {name: /File:Borussia_Dortmund_logo\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Borussia_Dortmund_logo.svg',
    );
    expect(
      screen.getByRole('link', {name: /File:FC_Internazionale_Milano_2021\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:FC_Internazionale_Milano_2021.svg',
    );
    expect(
      screen.getByRole('link', {name: /File:SSC_Napoli_2024_\(deep_blue_navy\)\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:SSC_Napoli_2024_(deep_blue_navy).svg',
    );
    expect(
      screen.getByRole('link', {name: /File:Feyenoord_logo_since_2024\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Feyenoord_logo_since_2024.svg',
    );
    expect(
      screen.getByRole('link', {name: /File:SK_Slavia_Praha_full_logo\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:SK_Slavia_Praha_full_logo.svg',
    );
    expect(
      screen.getByRole('link', {name: /File:Calcio_Como_-_logo_\(Italy,_2019-\)\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Calcio_Como_-_logo_(Italy,_2019-).svg',
    );
    expect(
      screen.getByRole('link', {name: /File:SK_Slovan_Bratislava_logo\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:SK_Slovan_Bratislava_logo.svg',
    );
    expect(
      screen.getByRole('link', {name: /File:Galatasaray_Sports_Club_Logo\.svg/i}),
    ).toHaveAttribute(
      'href',
      'https://commons.wikimedia.org/wiki/File:Galatasaray_Sports_Club_Logo.svg',
    );

    // Simulating image load failure falls back cleanly to monogram text without crashing
    for (const img of imgs) {
      fireEvent.error(img);
    }
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getAllByText('FCB').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BVB').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('NAP').length).toBeGreaterThan(0);

    // Non-whitelisted clubs with external crest URLs render 0 <img> elements
    const leagueSnapshot = adaptFootballDataMatches(buildLeagueStageOnlyProviderPayload(144));
    const {unmount} = render(<App initialSnapshot={leagueSnapshot} nowMs={NOV_23_2026_MS} />);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    unmount();
  });

  it('renders the 5 newly cleared clubs (Feyenoord, Slavia Praha, Como, Slovan Bratislava, Galatasaray) via Wikimedia Commons while keeping Real Madrid on monogram fallback', () => {
    const nineClubPayload = buildLeagueStageOnlyProviderPayload(0);
    nineClubPayload.matches = [
      {
        id: 8101,
        utcDate: '2026-11-24T20:00:00Z',
        status: 'TIMED',
        stage: 'LEAGUE_STAGE',
        matchday: 5,
        homeTeam: {id: 675, name: 'Feyenoord', shortName: 'Feyenoord', tla: 'FEY'},
        awayTeam: {id: 930, name: 'SK Slavia Praha', shortName: 'Slavia Praha', tla: 'SLA'},
        score: {winner: null, duration: null, fullTime: {home: null, away: null}},
      },
      {
        id: 8102,
        utcDate: '2026-11-24T20:00:00Z',
        status: 'TIMED',
        stage: 'LEAGUE_STAGE',
        matchday: 5,
        homeTeam: {id: 7397, name: 'Como 1907', shortName: 'Como', tla: 'COM'},
        awayTeam: {id: 7509, name: 'ŠK Slovan Bratislava', shortName: 'Slovan', tla: 'SLO'},
        score: {winner: null, duration: null, fullTime: {home: null, away: null}},
      },
      {
        id: 8103,
        utcDate: '2026-11-24T20:00:00Z',
        status: 'TIMED',
        stage: 'LEAGUE_STAGE',
        matchday: 5,
        homeTeam: {id: 610, name: 'Galatasaray SK', shortName: 'Galatasaray', tla: 'GAL'},
        awayTeam: {
          id: 86,
          name: 'Real Madrid CF',
          shortName: 'Real Madrid',
          tla: 'RMA',
          crest: 'https://crests.example.invalid/86.png',
        },
        score: {winner: null, duration: null, fullTime: {home: null, away: null}},
      },
    ];
    const snap = adaptFootballDataMatches(nineClubPayload);
    render(<App initialSnapshot={snap} nowMs={NOV_23_2026_MS} />);

    const imgs = Array.from(document.querySelectorAll('img'));
    const uniqueSrcs = Array.from(new Set(imgs.map((img) => img.getAttribute('src')))).sort();
    expect(uniqueSrcs).toEqual([
      'https://upload.wikimedia.org/wikipedia/commons/0/01/SK_Slovan_Bratislava_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/2/20/Galatasaray_Sports_Club_Logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/2/2b/SK_Slavia_Praha_full_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/9/99/Calcio_Como_-_logo_%28Italy%2C_2019-%29.svg',
      'https://upload.wikimedia.org/wikipedia/commons/f/f9/Feyenoord_logo_since_2024.svg',
    ]);
    // Unwhitelisted Real Madrid keeps monogram fallback
    expect(screen.getAllByText('RMA').length).toBeGreaterThan(0);
  });

  it('filters fixtures in Arabic & English team search alongside stage, matchday, and status filters and resets cleanly', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    // Search by curated Arabic club name ("ريال مدريد") even though match is historic
    const searchInput = screen.getByLabelText(/البحث باسم النادي/i);
    fireEvent.change(searchInput, {target: {value: 'ريال مدريد'}});
    expect(screen.getByText(/عرض 1 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
    expect(screen.getAllByText('ريال مدريد').length).toBeGreaterThan(0);

    // Search by English fallback name ("Epsilon")
    fireEvent.change(searchInput, {target: {value: 'Epsilon'}});
    expect(screen.getByText(/عرض 2 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();

    const statusSelect = screen.getByLabelText(/حالة المباراة/i);
    fireEvent.change(statusSelect, {target: {value: 'POSTPONED'}});
    expect(screen.getByText(/عرض 1 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();

    const stageSelect = screen.getByLabelText(/^المرحلة$/i);
    fireEvent.change(stageSelect, {target: {value: 'FINAL'}});
    expect(screen.getByText(/لا توجد مباريات مطابقة للبحث أو التصفية الحالية/i)).toBeInTheDocument();

    const resetBtns = screen.getAllByRole('button', {
      name: /إعادة تعيين جميع الفلاتر|إعادة تعيين الفلاتر/i,
    });
    fireEvent.click(resetBtns[0]);
    expect(screen.getByText(/عرض 9 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
  });

  it('opens match detail panel in Arabic for League Stage matches and Knockout ties and closes with Escape', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    // Switch to Past results to inspect a finished LEAGUE_STAGE match with Half-Time score
    fireEvent.click(screen.getByRole('button', {name: /النتائج السابقة \(2\)/i}));
    const matchInfoBtns = screen.getAllByRole('button', {name: /تفاصيل المباراة/i});
    fireEvent.click(matchInfoBtns[0]);

    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getAllByText(/مرحلة الدوري · الجولة 1/i).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/الشوط الأول/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/الأربعاء، 16 سبتمبر 2026/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/11:15 صباحًا/i)).toBeInTheDocument();

    fireEvent.keyDown(window, {key: 'Escape'});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Switch to Knockout Bracket tab and inspect Tie 2 (Penalties)
    const bottomNav = screen.getByRole('navigation', {name: /التنقل الرئيسي بين الأقسام/i});
    fireEvent.click(within(bottomNav).getByRole('button', {name: /الأدوار الإقصائية/i}));

    const inspectTie2Btns = screen.getAllByRole('button', {
      name: /استعراض دور الـ16 · المواجهة 2: Club Gamma ضد Club Delta/i,
    });
    fireEvent.click(inspectTie2Btns[0]);

    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('مباراة الذهاب')).toBeInTheDocument();
    expect(within(dialog).getByText(/مباراة الإياب \(تبديل الأرض والضيافة\)/i)).toBeInTheDocument();
    expect(within(dialog).getByText('ركلات الترجيح')).toBeInTheDocument();
    expect(within(dialog).getByText(/متأهل مؤكد \(Club Delta\)/i)).toBeInTheDocument();
  });

  it('switches kickoff timezone between Egypt time (Africa/Cairo) and Viewer Local', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    const egyptBtn = screen.getByRole('button', {name: /توقيت مصر \(Africa\/Cairo\)/i});
    const localBtn = screen.getByRole('button', {name: /^التوقيت المحلي \(/i});

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

    render(<App nowMs={NOV_23_2026_MS} />);

    await waitFor(() => {
      expect(screen.getByText(/عرض 9 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
    });

    const recheckBtn = screen.getByRole('button', {name: /التحقق من آخر لقطة منشورة/i});
    fireEvent.click(recheckBtn);

    await waitFor(() => {
      expect(screen.getByText(/تعذر التحقق من التحديث/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/عرض 9 من أصل 11 مباراة موثقة/i)).toBeInTheDocument();
  });

  it('supports mobile bracket stage tabs in Arabic when Knockout view is opened', () => {
    const initial = createInitialTruthfulSnapshot();
    render(<App initialSnapshot={initial} nowMs={NOV_23_2026_MS} />);

    const bottomNav = screen.getByRole('navigation', {name: /التنقل الرئيسي بين الأقسام/i});
    fireEvent.click(within(bottomNav).getByRole('button', {name: /الأدوار الإقصائية/i}));

    const qfTab = screen.getByRole('tab', {name: 'ربع النهائي'});
    fireEvent.click(qfTab);
    expect(qfTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', {name: 'ربع النهائي'})).toBeInTheDocument();
  });

  it('uses unique per-instance SVG gradient and ARIA IDs across desktop and mobile TrophyIllustration instances', () => {
    const initial = createInitialTruthfulSnapshot();
    render(<App initialSnapshot={initial} nowMs={NOV_23_2026_MS} />);

    const bottomNav = screen.getByRole('navigation', {name: /التنقل الرئيسي بين الأقسام/i});
    fireEvent.click(within(bottomNav).getByRole('button', {name: /الأدوار الإقصائية/i}));

    const trophySvgs = screen.getAllByRole('img', {name: /رسم متجهي لكأس أبطال أوروبا/i});
    expect(trophySvgs).toHaveLength(2);

    const seenIds = new Set<string>();
    for (const svg of trophySvgs) {
      const localIds = new Set(
        Array.from(svg.querySelectorAll('[id]')).map((el) => el.getAttribute('id')!),
      );
      expect(localIds.size).toBe(8); // 2 aria (title/desc) + 6 linearGradients

      for (const id of localIds) {
        expect(seenIds.has(id)).toBe(false);
        seenIds.add(id);
      }

      // Every url(#...) reference inside this SVG must point strictly to its own local defs
      const urlRefs = Array.from(svg.querySelectorAll('[fill^="url(#"], [stroke^="url(#"]')).map(
        (el) => {
          const val = el.getAttribute('fill')?.startsWith('url(#')
            ? el.getAttribute('fill')!
            : el.getAttribute('stroke')!;
          return val.slice(5, -1);
        },
      );
      expect(urlRefs.length).toBeGreaterThan(0);
      for (const refId of urlRefs) {
        expect(localIds.has(refId)).toBe(true);
      }
    }
  });

  it('renders unified 3-column facing fixture cards (Home right, VS/score+time center, Away left in RTL) with 36px crests above wrapped Arabic names and blue date separators', () => {
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);

    const matchesSection = document.getElementById('matches')!;
    expect(matchesSection).toHaveClass('overflow-x-hidden');

    // Date group heading sits above a distinct blue separator
    const nov24Heading = within(matchesSection).getByRole('heading', {
      name: /الثلاثاء، 24 نوفمبر 2026/i,
    });
    expect(nov24Heading.closest('div.border-b-2')).toHaveClass('border-[#2f7bff]');

    // Single unified card per match (not duplicated table + mobile cards, and no single-column team stack)
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const bayernDortmundCard = screen.getByTestId('fixture-card-cl-2026-8003');
    const matchupGrid = bayernDortmundCard.querySelector('[data-slot="matchup-grid"]')!;
    expect(matchupGrid).toHaveClass('grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]');

    // In RTL, Grid Track 1 (right) = home-team, Track 2 (center) = match-center, Track 3 (left) = away-team
    const slotOrder = Array.from(matchupGrid.children).map((el) => el.getAttribute('data-slot'));
    expect(slotOrder).toEqual(['home-team', 'match-center', 'away-team']);

    const homeSlot = matchupGrid.querySelector('[data-slot="home-team"]')!;
    const centerSlot = matchupGrid.querySelector('[data-slot="match-center"]')!;
    const awaySlot = matchupGrid.querySelector('[data-slot="away-team"]')!;

    // Crest sits ABOVE wrapped Arabic name inside each team column (36px = h-9 w-9)
    expect(homeSlot).toHaveClass('flex-col');
    expect(awaySlot).toHaveClass('flex-col');
    const homeCrestWrap = homeSlot.firstElementChild!;
    const homeNameEl = homeSlot.lastElementChild!;
    expect(homeCrestWrap).toHaveClass('h-9', 'w-9');
    expect(homeNameEl).toHaveTextContent('بايرن ميونخ');
    expect(homeNameEl).toHaveClass('break-words');
    expect(homeNameEl).not.toHaveClass('truncate');

    const awayCrestWrap = awaySlot.firstElementChild!;
    const awayNameEl = awaySlot.lastElementChild!;
    expect(awayCrestWrap).toHaveClass('h-9', 'w-9');
    expect(awayNameEl).toHaveTextContent('بوروسيا دورتموند');
    expect(awayNameEl).toHaveClass('break-words');

    // Center column shows VS + 12-hour Egypt time directly below
    expect(within(centerSlot as HTMLElement).getByText('VS')).toBeInTheDocument();
    expect(within(centerSlot as HTMLElement).getByText('10:00 مساءً')).toBeInTheDocument();

    // Details action meets minimum 44px touch target
    const detailsBtn = within(bayernDortmundCard).getByRole('button', {name: /تفاصيل المباراة/i});
    expect(detailsBtn).toHaveClass('min-h-[44px]');

    // No invented TV channels anywhere inside fixture cards
    expect(matchesSection.textContent).not.toMatch(/beIN|SSC|قناة|القناة الناقلة/i);

    // Finished match in Past Results renders score + kickoff time in center column
    fireEvent.click(screen.getByRole('button', {name: /النتائج السابقة \(2\)/i}));
    const madridCard = screen.getByTestId('fixture-card-cl-2026-8001');
    const madridCenter = madridCard.querySelector('[data-slot="match-center"]') as HTMLElement;
    expect(within(madridCenter).getByLabelText('النتيجة 2 مقابل 0')).toBeInTheDocument();
    expect(within(madridCenter).getByText('10:00 مساءً')).toBeInTheDocument();
  });

  it('includes prefers-reduced-motion accessibility rules and Arabic RTL root attributes', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');

    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });
});
