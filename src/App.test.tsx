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

    // Upcoming view displays Bayern München (5), Borussia Dortmund (4), Inter (108), and Napoli (113)
    const imgs = Array.from(document.querySelectorAll('img'));
    expect(imgs.length).toBeGreaterThan(0);
    const uniqueSrcs = Array.from(new Set(imgs.map((img) => img.getAttribute('src'))));
    expect(uniqueSrcs.sort()).toEqual([
      'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
      'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg',
    ]);

    // Footer includes accessible attribution section, partial count/coverage note, and all 4 source links
    expect(
      screen.getByRole('heading', {name: /مصادر وإسناد أيقونات الشعارات المتاحة/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/تغطية جزئية للشعارات: 4 أندية مصرح بها فقط/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/يختلف توفر شعارات الأندية/i).length).toBeGreaterThan(0);
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

  it('includes prefers-reduced-motion accessibility rules and Arabic RTL root attributes', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');

    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });
});
