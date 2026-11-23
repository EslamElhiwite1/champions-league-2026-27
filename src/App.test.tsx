import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import App from './App';
import {adaptFootballDataMatches} from './adapters/footballDataAdapter';
import {CLEARED_CLUB_CREST_REGISTRY} from './config/competition';
import {createInitialTruthfulSnapshot} from './domain/knockoutEngine';
import {
  buildLeagueStageOnlyProviderPayload,
  buildRealNov2425ProviderPayload,
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

  it('renders all 36 football-logos.cc club logos with white circular backing, falls back on error, keeps monograms for unmapped clubs, and exposes expandable 36-club & broadcaster credits', () => {
    const realSnapshot = adaptFootballDataMatches(buildRealNov2425ProviderPayload());
    render(<App initialSnapshot={realSnapshot} nowMs={NOV_23_2026_MS} />);

    // Club monogram <img> elements across the 18 Nov 24-25 fixtures (36 unique clubs)
    const clubImgs = Array.from(document.querySelectorAll('img')).filter((img) =>
      img.getAttribute('src')?.startsWith('https://assets.football-logos.cc/'),
    );
    expect(clubImgs).toHaveLength(36);
    for (const img of clubImgs) {
      expect(img.parentElement).toHaveClass('rounded-full', 'bg-white');
    }

    const expectedAssetSet = new Set(
      Object.values(CLEARED_CLUB_CREST_REGISTRY).map((entry) => entry.imageUrl),
    );
    const renderedAssetSet = new Set(clubImgs.map((img) => img.getAttribute('src')));
    expect(renderedAssetSet).toEqual(expectedAssetSet);

    // Simulating image load failure on Bayern München falls back to its monogram without crashing
    const bayernImg = clubImgs.find((img) =>
      img.getAttribute('src')?.includes('bayern-munchen.90b9d770.png'),
    )!;
    fireEvent.error(bayernImg);
    expect(screen.getAllByText('FCB').length).toBeGreaterThan(0);

    // Footer attribution cites football-logos.cc for informational identification without public-domain or official-license claims
    expect(
      screen.getByRole('heading', {name: /مصادر وإسناد شعارات الأندية والقنوات الناقلة/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/شعارات الأندية الموثقة: 36 ناديًا عبر football-logos\.cc/i),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/الملكية العامة|Public domain|officially licensed/i);

    expect(screen.getByRole('link', {name: /دليل football-logos\.cc/i})).toHaveAttribute(
      'href',
      'https://football-logos.cc/tournaments/uefa-champions-league/',
    );
    expect(screen.getByRole('link', {name: /شروط الاستخدام المعلنة للمصدر/i})).toHaveAttribute(
      'href',
      'https://football-logos.cc/license/',
    );

    // Expandable 36-club source list contains all 36 individual club source URLs
    const clubSourcesSummary = screen.getByText(
      /عرض قائمة مصادر شعارات الأندية الـ 36 على football-logos\.cc/i,
    );
    const clubDetails = clubSourcesSummary.closest('details')!;
    for (const entry of Object.values(CLEARED_CLUB_CREST_REGISTRY)) {
      const link = within(clubDetails).getByRole('link', {
        name: new RegExp(entry.sourceCredit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
      });
      expect(link).toHaveAttribute('href', entry.sourcePageUrl);
    }

    // Expandable broadcaster schedule note includes checkedAt date & both official beIN links
    expect(screen.getAllByText(/2026-11-23/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', {name: /beIN SPORTS MENA الرسمي/i})).toHaveAttribute(
      'href',
      'https://www.beinsports.com/en-mena/tv-guide',
    );
    expect(screen.getByRole('link', {name: /بيان حقوق البث حتى 2027/i})).toHaveAttribute(
      'href',
      'https://www.beinmediagroup.com/article/bein-media-group-extends-rights-deal-in-mena-and-asia-to-broadcast-uefa-club-competitions-until-2027/',
    );

    // Unmapped/unknown club IDs with arbitrary provider crest URLs render 0 <img> elements
    const unmappedLeagueSnapshot = adaptFootballDataMatches(buildLeagueStageOnlyProviderPayload(144));
    const unmappedRender = render(
      <App initialSnapshot={unmappedLeagueSnapshot} nowMs={NOV_23_2026_MS} />,
    );
    expect(unmappedRender.container.querySelectorAll('img')).toHaveLength(0);
    unmappedRender.unmount();
  });

  it('replaces ONLY the repeated card date with verified beIN SPORTS channel + logo on Nov 24-25 while retaining full group date headings and falling back safely on unknown matches', () => {
    const realSnapshot = adaptFootballDataMatches(buildRealNov2425ProviderPayload());
    render(<App initialSnapshot={realSnapshot} nowMs={NOV_23_2026_MS} />);

    const matchesSection = document.getElementById('matches')!;

    // Full weekday/date headings remain above each daily group
    expect(
      within(matchesSection).getByRole('heading', {name: /الثلاثاء، 24 نوفمبر 2026/i}),
    ).toBeInTheDocument();
    expect(
      within(matchesSection).getByRole('heading', {name: /الأربعاء، 25 نوفمبر 2026/i}),
    ).toBeInTheDocument();

    // Real Madrid vs PSV on Nov 24 -> beIN SPORTS 1 + official channel logo, NO repeated card date inside card
    const madridPsvCard = screen.getByTestId('fixture-card-cl-2026-575397');
    expect(within(madridPsvCard).getByText('beIN SPORTS 1')).toBeInTheDocument();
    expect(
      within(madridPsvCard).getByRole('img', {name: /شعار beIN SPORTS 1/i}),
    ).toHaveAttribute(
      'src',
      'https://prod-media.beinsports.com/image/f50c7035e532c49a0f6993d988e2e843.3840.png?ver=03-06-2025',
    );
    expect(madridPsvCard.textContent).not.toContain('الثلاثاء، 24 نوفمبر 2026');

    // Slovan Bratislava vs Betis on Nov 24 -> beIN SPORTS 9
    const slovanBetisCard = screen.getByTestId('fixture-card-cl-2026-575401');
    expect(within(slovanBetisCard).getByText('beIN SPORTS 9')).toBeInTheDocument();

    // Sabah vs Barcelona on Nov 25 -> beIN SPORTS 2 + official channel logo, NO repeated card date inside card
    const sabahBarcaCard = screen.getByTestId('fixture-card-cl-2026-575404');
    expect(within(sabahBarcaCard).getByText('beIN SPORTS 2')).toBeInTheDocument();
    expect(
      within(sabahBarcaCard).getByRole('img', {name: /شعار beIN SPORTS 2/i}),
    ).toHaveAttribute(
      'src',
      'https://prod-media.beinsports.com/image/4fbe073f17f161810fdf3dab1307b30f.3840.png?ver=03-06-2025',
    );
    expect(sabahBarcaCard.textContent).not.toContain('الأربعاء، 25 نوفمبر 2026');

    // Channel logo image error falls back cleanly without losing channel name
    fireEvent.error(within(sabahBarcaCard).getByRole('img', {name: /شعار beIN SPORTS 2/i}));
    expect(within(sabahBarcaCard).getByText('beIN SPORTS 2')).toBeInTheDocument();
    expect(
      within(sabahBarcaCard).queryByRole('img', {name: /شعار beIN SPORTS 2/i}),
    ).not.toBeInTheDocument();

    // Synthetic/unverified matches must show neutral fallback text and never infer a numbered channel
    const synthetic = buildSyntheticSnapshot();
    render(<App initialSnapshot={synthetic} nowMs={NOV_23_2026_MS} />);
    const bayernDortmundCard = screen.getByTestId('fixture-card-cl-2026-8003');
    expect(within(bayernDortmundCard).getByText('القناة لم تُؤكد بعد')).toBeInTheDocument();
    expect(bayernDortmundCard.textContent).not.toMatch(/beIN SPORTS/i);
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

    // TournamentOverview numeric fractions enforce dir="ltr" while labels remain RTL
    const overviewSection = document.getElementById('overview')!;
    expect(within(overviewSection).getByText('7 / 11')).toHaveAttribute('dir', 'ltr');
    expect(within(overviewSection).getByText('5 / 15')).toHaveAttribute('dir', 'ltr');

    // Details action meets minimum 44px touch target
    const detailsBtn = within(bayernDortmundCard).getByRole('button', {name: /تفاصيل المباراة/i});
    expect(detailsBtn).toHaveClass('min-h-[44px]');

    // Lower card strip replaces repeated card date with neutral unconfirmed channel fallback
    expect(within(bayernDortmundCard).getByText('القناة لم تُؤكد بعد')).toBeInTheDocument();
    expect(bayernDortmundCard.textContent).not.toContain('الثلاثاء، 24 نوفمبر 2026');
    expect(bayernDortmundCard.textContent).not.toMatch(/beIN SPORTS/i);

    // Finished match in Past Results renders score + kickoff time in center column & unconfirmed channel fallback
    fireEvent.click(screen.getByRole('button', {name: /النتائج السابقة \(2\)/i}));
    const madridCard = screen.getByTestId('fixture-card-cl-2026-8001');
    const madridCenter = madridCard.querySelector('[data-slot="match-center"]') as HTMLElement;
    expect(within(madridCenter).getByLabelText('النتيجة 2 مقابل 0')).toBeInTheDocument();
    expect(within(madridCenter).getByText('10:00 مساءً')).toBeInTheDocument();
    expect(within(madridCard).getByText('القناة لم تُؤكد بعد')).toBeInTheDocument();
    expect(madridCard.textContent).not.toContain('الثلاثاء، 15 سبتمبر 2026');
  });

  it('includes prefers-reduced-motion accessibility rules and Arabic RTL root attributes', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');

    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });
});
