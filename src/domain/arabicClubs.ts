import type {TeamRef} from '../types/knockout';

/**
 * Curated Arabic display names for UEFA Champions League clubs.
 * Keys are normalized lowercase provider names / shortNames so underlying
 * provider IDs and original identities are never mutated.
 */
const ARABIC_CLUB_NAME_ENTRIES: Array<[string[], string]> = [
  // Spain
  [['real madrid', 'real madrid cf'], 'ريال مدريد'],
  [['fc barcelona', 'barcelona'], 'برشلونة'],
  [['club atlético de madrid', 'atletico madrid', 'atlético madrid', 'atletico de madrid'], 'أتلتيكو مدريد'],
  [['athletic club', 'athletic bilbao'], 'أتلتيك بيلباو'],
  [['villarreal cf', 'villarreal'], 'فياريال'],
  [['girona fc', 'girona'], 'جيرونا'],
  [['real sociedad', 'real sociedad de fútbol'], 'ريال سوسيداد'],
  [['sevilla fc', 'sevilla'], 'إشبيلية'],

  // England
  [['manchester city', 'manchester city fc', 'man city'], 'مانشستر سيتي'],
  [['arsenal', 'arsenal fc'], 'أرسنال'],
  [['liverpool', 'liverpool fc'], 'ليفربول'],
  [['chelsea', 'chelsea fc'], 'تشيلسي'],
  [['aston villa', 'aston villa fc'], 'أستون فيلا'],
  [['newcastle united', 'newcastle united fc', 'newcastle'], 'نيوكاسل يونايتد'],
  [['tottenham hotspur', 'tottenham hotspur fc', 'tottenham'], 'توتنهام هوتسبير'],
  [['manchester united', 'manchester united fc', 'man united'], 'مانشستر يونايتد'],

  // Germany
  [['fc bayern münchen', 'fc bayern munich', 'bayern munich', 'bayern münchen'], 'بايرن ميونخ'],
  [['borussia dortmund', 'bv borussia 09 dortmund', 'dortmund'], 'بوروسيا دورتموند'],
  [['bayer 04 leverkusen', 'bayer leverkusen', 'leverkusen'], 'باير ليفركوزن'],
  [['rb leipzig', 'rasenballsport leipzig'], 'لايبزيغ'],
  [['vfb stuttgart', 'stuttgart'], 'شتوتغارت'],
  [['eintracht frankfurt', 'frankfurt'], 'آينتراخت فرانكفورت'],
  [['sc freiburg', 'freiburg'], 'فرايبورغ'],

  // Italy
  [['fc internazionale milano', 'inter milan', 'inter', 'internazionale'], 'إنتر ميلان'],
  [['ac milan', 'milan'], 'ميلان'],
  [['juventus fc', 'juventus'], 'يوفنتوس'],
  [['atalanta bc', 'atalanta'], 'أتالانتا'],
  [['bologna fc 1909', 'bologna'], 'بولونيا'],
  [['ssc napoli', 'napoli'], 'نابولي'],
  [['as roma', 'roma'], 'روما'],
  [['ss lazio', 'lazio'], 'لاتسيو'],

  // France
  [['paris saint-germain fc', 'paris saint-germain', 'psg', 'paris sg'], 'باريس سان جيرمان'],
  [['as monaco fc', 'as monaco', 'monaco'], 'موناكو'],
  [['lille osc', 'lille'], 'ليل'],
  [['stade brestois 29', 'brest'], 'ستاد بريست'],
  [['olympique de marseille', 'marseille'], 'أولمبيك مارسيليا'],
  [['olympique lyonnais', 'lyon'], 'أولمبيك ليون'],
  [['ogc nice', 'nice'], 'نيس'],

  // Portugal & Netherlands & Belgium
  [['sporting clube de portugal', 'sporting cp', 'sporting lisbon'], 'سبورتينغ لشبونة'],
  [['sl benfica', 'sport lisboa e benfica', 'benfica'], 'بنفيكا'],
  [['fc porto', 'porto'], 'بورتو'],
  [['psv', 'psv eindhoven'], 'آيندهوفن'],
  [['feyenoord rotterdam', 'feyenoord'], 'فينورد'],
  [['afc ajax', 'ajax'], 'أياكس'],
  [['club brugge kv', 'club brugge'], 'كلوب بروج'],
  [['royale union saint-gilloise', 'union saint-gilloise', 'union sg'], 'يونيون سانت جيلواز'],
  [['rsc anderlecht', 'anderlecht'], 'أندرلخت'],

  // Scotland, Austria, Switzerland, Czechia, Ukraine, Eastern & Northern Europe
  [['celtic fc', 'celtic'], 'سيلتك'],
  [['rangers fc', 'rangers'], 'رينجرز'],
  [['fc red bull salzburg', 'red bull salzburg', 'salzburg'], 'ريد بول سالزبورغ'],
  [['sk sturm graz', 'sturm graz'], 'شتورم غراتس'],
  [['bsc young boys', 'young boys'], 'يونغ بويز'],
  [['fc basel 1893', 'basel'], 'بازل'],
  [['ac sparta praha', 'sparta prague', 'sparta praha'], 'سبارتا براغ'],
  [['sk slavia praha', 'slavia prague', 'slavia praha'], 'سلافيا براغ'],
  [['fc shakhtar donetsk', 'fk shakhtar donetsk', 'shakhtar donetsk', 'shakhtar'], 'شاختار دونيتسك'],
  [['fc dynamo kyiv', 'dynamo kyiv'], 'دينامو كييف'],
  [['gnk dinamo zagreb', 'dinamo zagreb'], 'دينامو زغرب'],
  [['fk crvena zvezda', 'red star belgrade', 'crvena zvezda'], 'النجم الأحمر بلغراد'],
  [['šk slovan bratislava', 'sk slovan bratislava', 'slovan bratislava'], 'سلوفان براتيسلافا'],
  [['galatasaray sk', 'galatasaray'], 'غلطة سراي'],
  [['fenerbahçe sk', 'fenerbahce', 'fenerbahçe'], 'فنربخشة'],
  [['beşiktaş jk', 'besiktas', 'beşiktaş'], 'بشكتاش'],
  [['olympiacos fc', 'olympiacos', 'olympiakos'], 'أولمبياكوس'],
  [['pae aek', 'aek athens', 'aek athens fc'], 'أيك أثينا'],
  [['paok fc', 'paok'], 'باوك'],
  [['fc københavn', 'fc copenhagen', 'copenhagen'], 'كوبنهاغن'],
  [['fk bodø/glimt', 'bodø/glimt', 'bodo/glimt'], 'بودو/غليمت'],
  [['viking fk', 'viking'], 'فايكينغ'],
  [['malmö ff', 'malmo ff', 'malmö'], 'مالمو'],
  [['qarabağ fk', 'qarabag', 'qarabağ'], 'قره باغ'],
  [['sabah fk', 'sabah'], 'صباح'],
  [['ferencvárosi tc', 'ferencvaros', 'ferencváros'], 'فيرينتسفاروش'],
  [['fc midtjylland', 'midtjylland'], 'ميتيلاند'],
  [['lask linz', 'lask'], 'لاسك لينتس'],
  [['real betis balompié', 'real betis balompie', 'real betis'], 'ريال بيتيس'],
  [['como 1907', 'calcio como', 'como'], 'كومو'],
  [['racing club de lens', 'rc lens', 'lens'], 'لانس'],
];

const ARABIC_CLUB_LOOKUP = new Map<string, string>();
for (const [aliases, arabicName] of ARABIC_CLUB_NAME_ENTRIES) {
  for (const alias of aliases) {
    ARABIC_CLUB_LOOKUP.set(alias.trim().toLowerCase(), arabicName);
  }
}

export function getArabicClubDisplayName(team: Pick<TeamRef, 'name' | 'shortName' | 'isTbd'>): string {
  if (team.isTbd) return 'يُحدد لاحقًا';

  const candidates = [team.name, team.shortName];
  for (const candidate of candidates) {
    const key = candidate.trim().toLowerCase();
    const matched = ARABIC_CLUB_LOOKUP.get(key);
    if (matched) return matched;
  }

  return team.name;
}

export function getTeamSearchHaystack(team: Pick<TeamRef, 'name' | 'shortName' | 'tla' | 'isTbd'>): string {
  const arabic = getArabicClubDisplayName(team);
  return `${arabic} ${team.name} ${team.shortName} ${team.tla}`.toLowerCase();
}
