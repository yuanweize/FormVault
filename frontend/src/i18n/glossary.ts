/**
 * Standardized Cross-Language Glossary and Legal Entities
 * FormVault - Czech International Student Insurance Portal
 */

export interface LegalEntityDefinition {
  name: string;
  idNumber: string;
  roleCs: string;
  roleEn: string;
  roleZh: string;
  descriptionEn: string;
  descriptionZh: string;
  descriptionCs: string;
}

export const LEGAL_ENTITIES = {
  HKTSE: {
    name: 'HKTSE s.r.o.',
    idNumber: '10858032',
    roleCs: 'Tipař (Zájemce o zprostředkování / předkladatel poptávky)',
    roleEn: 'Lead Introducer / Technical Platform Provider (Tipař)',
    roleZh: '技术平台与需求引荐方 (Tipař)',
    descriptionEn:
      'FormVault is operated by HKTSE s.r.o. under a cooperation agreement with licensed insurance intermediary České pojištění a.s. HKTSE collects customer enquiry parameters and contact details and securely forwards them to České pojištění a.s. HKTSE is not an insurance company or insurance intermediary.',
    descriptionZh:
      'FormVault 由 HKTSE s.r.o. 根据与持牌保险中介 České pojištění a.s. 的合作协议运营。HKTSE 收集基本保险咨询需求和联系信息并安全转交给 České pojištění a.s.。HKTSE 不是保险公司或保险中介。',
    descriptionCs:
      'FormVault provozuje společnost HKTSE s.r.o. na základě smlouvy o spolupráci se samostatným zprostředkovatelem pojištění České pojištění a.s. HKTSE shromažďuje základní poptávky pojištění a kontaktní údaje a bezpečně je předává společnosti České pojištění a.s. HKTSE není pojišťovnou ani pojišťovacím zprostředkovatelem.',
  },
  CESKE_POJISTENI: {
    name: 'České pojištění a.s.',
    idNumber: 'CZ_BROKER',
    roleCs: 'Samostatný zprostředkovatel pojištění dle zákona č. 170/2018 Sb.',
    roleEn: 'Licensed Independent Insurance Intermediary (under Act No. 170/2018 Coll.)',
    roleZh: '捷克持牌独立保险中介机构 (依据第 170/2018 Sb. 号法案)',
    descriptionEn:
      'Professional advice, insurance quotes, product comparison, pre-contractual statutory information, and policy conclusion are exclusively handled by České pojištění a.s.',
    descriptionZh:
      '专业保险咨询、保费报价、产品比选、缔约前法定信息披露以及保单缔结均由持牌中介机构 České pojištění a.s. 依法负责。',
    descriptionCs:
      'Pojišťovací poradenství, kalkulace nabídek, předsmluvní informace a sjednání pojistných smluv zajišťuje výhradně společnost České pojištění a.s.',
  },
};

export interface CzechUniversityOption {
  code: string;
  nameCs: string;
  nameEn: string;
  nameZh: string;
  city: string;
}

export const CZECH_UNIVERSITIES: CzechUniversityOption[] = [
  {
    code: 'cuni',
    nameCs: 'Univerzita Karlova (UK)',
    nameEn: 'Charles University (Prague)',
    nameZh: '查理大学 (布拉格)',
    city: 'Prague',
  },
  {
    code: 'cvut',
    nameCs: 'České vysoké učení technické v Praze (ČVUT)',
    nameEn: 'Czech Technical University in Prague (CTU)',
    nameZh: '捷克理工大学 (布拉格)',
    city: 'Prague',
  },
  {
    code: 'vse',
    nameCs: 'Vysoká škola ekonomická v Praze (VŠE)',
    nameEn: 'Prague University of Economics and Business (VSE)',
    nameZh: '布拉格经济大学 (VSE)',
    city: 'Prague',
  },
  {
    code: 'czu',
    nameCs: 'Česká zemědělská univerzita v Praze (ČZU)',
    nameEn: 'Czech University of Life Sciences Prague (CZU)',
    nameZh: '捷克生命科学大学 (布拉格)',
    city: 'Prague',
  },
  {
    code: 'vscht',
    nameCs: 'Vysoká škola chemicko-technologická v Praze (VŠCHT)',
    nameEn: 'University of Chemistry and Technology, Prague (UCT)',
    nameZh: '布拉格化工大学 (UCT)',
    city: 'Prague',
  },
  {
    code: 'amu',
    nameCs: 'Akademie múzických umění v Praze (AMU)',
    nameEn: 'Academy of Performing Arts in Prague (AMU)',
    nameZh: '布拉格演艺学院 (AMU)',
    city: 'Prague',
  },
  {
    code: 'vav',
    nameCs: 'Vysoká škola uměleckoprůmyslová v Praze (UMPRUM)',
    nameEn: 'Academy of Arts, Architecture and Design in Prague (UMPRUM)',
    nameZh: '布拉格艺术建筑与设计学院 (UMPRUM)',
    city: 'Prague',
  },
  {
    code: 'muni',
    nameCs: 'Masarykova univerzita (MUNI)',
    nameEn: 'Masaryk University (Brno)',
    nameZh: '马萨里克大学 (布尔诺)',
    city: 'Brno',
  },
  {
    code: 'vut',
    nameCs: 'Vysoké učení technické v Brně (VUT)',
    nameEn: 'Brno University of Technology (BUT)',
    nameZh: '布尔诺理工大学 (BUT)',
    city: 'Brno',
  },
  {
    code: 'mendelu',
    nameCs: 'Mendelova univerzita v Brně (MENDELU)',
    nameEn: 'Mendel University in Brno',
    nameZh: '孟德尔大学 (布尔诺)',
    city: 'Brno',
  },
  {
    code: 'upol',
    nameCs: 'Univerzita Palackého v Olomouci (UPOL)',
    nameEn: 'Palacký University Olomouc',
    nameZh: '帕拉茨基大学 (奥洛穆茨)',
    city: 'Olomouc',
  },
  {
    code: 'vsb',
    nameCs: 'Vysoká škola báňská – Technická univerzita Ostrava (VŠB-TUO)',
    nameEn: 'VŠB – Technical University of Ostrava',
    nameZh: '奥斯特拉发理工大学',
    city: 'Ostrava',
  },
  {
    code: 'osu',
    nameCs: 'Ostravská univerzita (OU)',
    nameEn: 'University of Ostrava',
    nameZh: '奥斯特拉发大学',
    city: 'Ostrava',
  },
  {
    code: 'zcu',
    nameCs: 'Západočeská univerzita v Plzni (ZČU)',
    nameEn: 'University of West Bohemia (Pilsen)',
    nameZh: '西波希米亚大学 (皮尔森)',
    city: 'Pilsen',
  },
  {
    code: 'tul',
    nameCs: 'Technická univerzita v Liberci (TUL)',
    nameEn: 'Technical University of Liberec',
    nameZh: '利贝雷茨理工大学',
    city: 'Liberec',
  },
  {
    code: 'uhk',
    nameCs: 'Univerzita Hradec Králové (UHK)',
    nameEn: 'University of Hradec Králové',
    nameZh: '赫拉德茨-克拉洛韦大学',
    city: 'Hradec Králové',
  },
  {
    code: 'upce',
    nameCs: 'Univerzita Pardubice (UPCE)',
    nameEn: 'University of Pardubice',
    nameZh: '帕尔杜比采大学',
    city: 'Pardubice',
  },
  {
    code: 'jcu',
    nameCs: 'Jihočeská univerzita v Českých Budějovicích (JU)',
    nameEn: 'University of South Bohemia in České Budějovice',
    nameZh: '南波希米亚大学 (捷克布杰约维采)',
    city: 'České Budějovice',
  },
  {
    code: 'ujep',
    nameCs: 'Univerzita Jana Evangelisty Purkyně v Ústí nad Labem (UJEP)',
    nameEn: 'Jan Evangelista Purkyně University in Ústí nad Labem',
    nameZh: '拉贝河畔乌斯季大学 (UJEP)',
    city: 'Ústí nad Labem',
  },
  {
    code: 'utb',
    nameCs: 'Univerzita Tomáše Bati ve Zlíně (UTB)',
    nameEn: 'Tomas Bata University in Zlín',
    nameZh: '托马斯巴塔大学 (兹林)',
    city: 'Zlín',
  },
];

export interface CountryItem {
  code: string; // ISO 3166-1 alpha-2
  nameEn: string;
  nameCs: string;
  nameZh: string;
  dialCode: string;
}

export const COMMON_COUNTRIES: CountryItem[] = [
  { code: 'CN', nameEn: 'China', nameCs: 'Čína', nameZh: '中国', dialCode: '+86' },
  { code: 'CZ', nameEn: 'Czech Republic', nameCs: 'Česká republika', nameZh: '捷克共和国', dialCode: '+420' },
  { code: 'SK', nameEn: 'Slovakia', nameCs: 'Slovensko', nameZh: '斯洛伐克', dialCode: '+421' },
  { code: 'DE', nameEn: 'Germany', nameCs: 'Německo', nameZh: '德国', dialCode: '+49' },
  { code: 'AT', nameEn: 'Austria', nameCs: 'Rakousko', nameZh: '奥地利', dialCode: '+43' },
  { code: 'PL', nameEn: 'Poland', nameCs: 'Polsko', nameZh: '波兰', dialCode: '+48' },
  { code: 'UA', nameEn: 'Ukraine', nameCs: 'Ukrajina', nameZh: '乌克兰', dialCode: '+380' },
  { code: 'RU', nameEn: 'Russia', nameCs: 'Rusko', nameZh: '俄罗斯', dialCode: '+7' },
  { code: 'KZ', nameEn: 'Kazakhstan', nameCs: 'Kazachstán', nameZh: '哈萨克斯坦', dialCode: '+7' },
  { code: 'IN', nameEn: 'India', nameCs: 'Indie', nameZh: '印度', dialCode: '+91' },
  { code: 'VN', nameEn: 'Vietnam', nameCs: 'Vietnam', nameZh: '越南', dialCode: '+84' },
  { code: 'US', nameEn: 'United States', nameCs: 'Spojené státy', nameZh: '美国', dialCode: '+1' },
  { code: 'GB', nameEn: 'United Kingdom', nameCs: 'Spojené království', nameZh: '英国', dialCode: '+44' },
  { code: 'CA', nameEn: 'Canada', nameCs: 'Kanada', nameZh: '加拿大', dialCode: '+1' },
  { code: 'KR', nameEn: 'South Korea', nameCs: 'Jižní Korea', nameZh: '韩国', dialCode: '+82' },
  { code: 'JP', nameEn: 'Japan', nameCs: 'Japonsko', nameZh: '日本', dialCode: '+81' },
  { code: 'TW', nameEn: 'Taiwan', nameCs: 'Tchaj-wan', nameZh: '中国台湾', dialCode: '+886' },
  { code: 'HK', nameEn: 'Hong Kong', nameCs: 'Hongkong', nameZh: '中国香港', dialCode: '+852' },
  { code: 'TR', nameEn: 'Turkey', nameCs: 'Turecko', nameZh: '土耳其', dialCode: '+90' },
  { code: 'EG', nameEn: 'Egypt', nameCs: 'Egypt', nameZh: '埃及', dialCode: '+20' },
  { code: 'IR', nameEn: 'Iran', nameCs: 'Írán', nameZh: '伊朗', dialCode: '+98' },
  { code: 'AE', nameEn: 'United Arab Emirates', nameCs: 'Spojené arabské emiráty', nameZh: '阿联酋', dialCode: '+971' },
  { code: 'SA', nameEn: 'Saudi Arabia', nameCs: 'Saúdská Arábie', nameZh: '沙特阿拉伯', dialCode: '+966' },
  { code: 'FR', nameEn: 'France', nameCs: 'Francie', nameZh: '法国', dialCode: '+33' },
  { code: 'IT', nameEn: 'Italy', nameCs: 'Itálie', nameZh: '意大利', dialCode: '+39' },
  { code: 'ES', nameEn: 'Spain', nameCs: 'Španělsko', nameZh: '西班牙', dialCode: '+34' },
  { code: 'BR', nameEn: 'Brazil', nameCs: 'Brazílie', nameZh: '巴西', dialCode: '+55' },
  { code: 'MX', nameEn: 'Mexico', nameCs: 'Mexiko', nameZh: '墨西哥', dialCode: '+52' },
  { code: 'ID', nameEn: 'Indonesia', nameCs: 'Indonésie', nameZh: '印度尼西亚', dialCode: '+62' },
  { code: 'TH', nameEn: 'Thailand', nameCs: 'Thajsko', nameZh: '泰国', dialCode: '+66' },
  { code: 'MY', nameEn: 'Malaysia', nameCs: 'Malajsie', nameZh: '马来西亚', dialCode: '+60' },
  { code: 'SG', nameEn: 'Singapore', nameCs: 'Singapur', nameZh: '新加坡', dialCode: '+65' },
  { code: 'PH', nameEn: 'Philippines', nameCs: 'Filipíny', nameZh: '菲律宾', dialCode: '+63' },
  { code: 'PK', nameEn: 'Pakistan', nameCs: 'Pákistán', nameZh: '巴基斯坦', dialCode: '+92' },
  { code: 'BD', nameEn: 'Bangladesh', nameCs: 'Bangladéš', nameZh: '孟加拉国', dialCode: '+880' },
  { code: 'NG', nameEn: 'Nigeria', nameCs: 'Nigérie', nameZh: '尼日利亚', dialCode: '+234' },
  { code: 'GH', nameEn: 'Ghana', nameCs: 'Ghana', nameZh: '加纳', dialCode: '+233' },
  { code: 'KE', nameEn: 'Kenya', nameCs: 'Keňa', nameZh: '肯尼亚', dialCode: '+254' },
  { code: 'ZA', nameEn: 'South Africa', nameCs: 'Jihoafrická republika', nameZh: '南非', dialCode: '+27' },
  { code: 'AU', nameEn: 'Australia', nameCs: 'Austrálie', nameZh: '澳大利亚', dialCode: '+61' },
  { code: 'NZ', nameEn: 'New Zealand', nameCs: 'Nový Zéland', nameZh: '新西兰', dialCode: '+64' },
];

export const CZECH_CITIES = [
  'Prague (Praha)',
  'Brno',
  'Ostrava',
  'Plzeň (Pilsen)',
  'Olomouc',
  'Liberec',
  'České Budějovice',
  'Hradec Králové',
  'Ústí nad Labem',
  'Pardubice',
  'Zlín',
  'Havířov',
  'Kladno',
  'Most',
  'Opava',
  'Karviná',
  'Jihlava',
  'Teplice',
  'Děčín',
  'Karlovy Vary',
  'Abroad / Outside Czechia',
];

export const STATUS_CODES = {
  INQUIRY_RECEIVED: {
    en: 'Enquiry Received',
    zh: '需求已接收',
    cs: 'Poptávka přijata',
    color: '#0284C7',
  },
  FORWARDED_TO_BROKER: {
    en: 'Forwarded to Broker',
    zh: '已转交持牌中介',
    cs: 'Předáno zprostředkovateli',
    color: '#4F46E5',
  },
  OFFER_PREPARED: {
    en: 'Offer Prepared',
    zh: '方案准备中',
    cs: 'Nabídka připravena',
    color: '#D97706',
  },
  CONTACTED: {
    en: 'Contacted',
    zh: '已取得联系',
    cs: 'Kontaktováno',
    color: '#10B981',
  },
  SUBMITTED: {
    en: 'Submitted',
    zh: '已提交',
    cs: 'Odesláno',
    color: '#0284C7',
  },
  UNDER_REVIEW: {
    en: 'Under Review',
    zh: '审核中',
    cs: 'V přezkumu',
    color: '#D97706',
  },
  COMPLETED: {
    en: 'Completed',
    zh: '已完成',
    cs: 'Dokončeno',
    color: '#10B981',
  },
  ARCHIVED: {
    en: 'Archived',
    zh: '已归档',
    cs: 'Archivováno',
    color: '#64748B',
  },
};
