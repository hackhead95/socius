// Worked example for the bundled sample survey: the open-ended answers to q_challenge ("What is the
// biggest challenge facing your neighbourhood today?"), a starter codebook with keyword rules, and the
// rules applied once as auto-coding. Pure: the UI commits the result as one undo step.
//
// The rules cover the English, Hinglish, romanised Bengali, Bengali and Hindi wording used in the
// sample answers. They are deliberately simple keyword rules, so the result is a first pass that a
// researcher reviews, not a finished coding.

import type { CodeDef, CodedSegment, CodingProject, Memo, TextDoc } from '../../core/coding-types';
import type { Dataset } from '../../core/types';
import { newId } from '../../core/types';
import { CODE_PALETTE } from './palette';
import { findRuleMatches } from './rules';
import { buildResponseDocs } from './survey';

/** The open-ended question and the respondent characteristics the example brings in. */
export const EXAMPLE_QUESTION = 'q_challenge';
export const EXAMPLE_ATTRIBUTES = ['gender', 'city', 'area'];
export const EXAMPLE_ID_VARIABLE = 'resp_id';

interface StarterCode {
  name: string;
  description: string;
  inclusion?: string;
  exclusion?: string;
  example?: string;
  rules?: string[];
}

interface StarterTheme {
  name: string;
  description: string;
  codes: StarterCode[];
}

export const STARTER_CODEBOOK: StarterTheme[] = [
  {
    name: 'Infrastructure and services',
    description: 'Problems with basic civic services and public infrastructure in the neighbourhood.',
    codes: [
      {
        name: 'Water supply',
        description: 'Not enough water, irregular or unpredictable supply, low pressure, dirty tap water, or dependence on tankers and cans.',
        inclusion: 'Drinking and household water: timing, quantity, quality, cost of tankers.',
        exclusion: 'Rain water and waterlogging (code Drainage and flooding).',
        example: 'We depend on tankers for drinking water and they charge 800 rupees a trip.',
        rules: [
          '# English',
          'water supply',
          'water problem',
          'water shortage',
          'drinking water',
          'clean water',
          'no regular water',
          'water pressure',
          'piped water',
          'tap water',
          'common tap',
          'tanker*',
          'borewell',
          'water cans',
          'arranging water',
          'fill the drums',
          'hardly any water',
          'with buckets',
          'water purifier',
          '/\\b(municipality|corporation|panchayat|mcd|ward office) water\\b/i',
          '# Hinglish and romanised Bengali',
          'paani ka',
          'paani bilkul',
          'water ka timing',
          'jol thik moto',
          'pressure khub kom',
          '# Bengali and Hindi',
          'খাবার জল*',
          'জল আসে না',
          'पानी की',
          'टैंकर',
        ],
      },
      {
        name: 'Waste and sanitation',
        description: 'Garbage that is not collected, no dustbins, dumping, dirty public toilets and poor cleaning of streets.',
        inclusion: 'Solid waste, sweeping, public toilets, general cleanliness.',
        exclusion: 'Blocked drains and sewage (code Drainage and flooding).',
        example: 'Garbage is not collected regularly and it piles up at the corner of the road.',
        rules: [
          '# English',
          'garbage',
          '/\\bwaste\\b(?!\\s+water)/i',
          'dustbin*',
          'sanitation',
          'sweeper*',
          'toilet*',
          'cleanliness',
          'dirty roads',
          'dumps',
          'vat near the market',
          '# Hinglish',
          'kachra',
          'safai',
          '# Bengali and Hindi',
          'ময়লা',
          'कूड़ा',
        ],
      },
      {
        name: 'Drainage and flooding',
        description: 'Open, blocked or overflowing drains and sewers, waterlogging and flooding in the rains.',
        inclusion: 'Drains, sewers, nalas, stagnant water, monsoon flooding.',
        exclusion: 'Shortage of drinking water (code Water supply).',
        example: 'During the monsoon the whole road goes under knee-deep water.',
        rules: [
          '# English',
          'drain*',
          'sewer*',
          'sewage',
          'flood*',
          'waterlogging',
          'monsoon',
          'heavy rain',
          'rain water',
          'knee-deep',
          'stagnant water',
          'water enters',
          'water came up',
          'low-lying',
          'nala',
          '# Hinglish and romanised Bengali',
          'nali',
          'baarish',
          'borshay',
          'jol jome',
          '# Bengali and Hindi',
          'বর্ষা*',
          'জল জমে',
          'হাঁটু জল',
          'ড্রেন',
          'नालियाँ',
          'पानी भर',
        ],
      },
      {
        name: 'Streetlights',
        description: 'Broken or missing streetlights and dark lanes.',
        inclusion: 'Lighting of streets and lanes, even when the answer is mainly about safety.',
        example: 'Most of the streetlights do not work, the lane is completely dark at night.',
        rules: [
          '# English',
          'streetlight*',
          'street light*',
          'lighting',
          'lights are there',
          'dark roads',
          'completely dark',
          'phone torch',
          '# Hinglish and romanised Bengali',
          'andhera',
          'andhokar',
          '# Hindi',
          'बत्तियाँ',
        ],
      },
      {
        name: 'Traffic and parking',
        description: 'Traffic jams, long commutes, parking, potholes and unsafe footpaths.',
        exclusion: 'Noise from honking alone (code Noise).',
        example: 'Traffic is terrible, it takes me 3 hours to go to office and come back.',
        rules: [
          '# English',
          'traffic',
          'jammed',
          'junction',
          'parking',
          'potholes',
          'commute',
          'footpath',
          'metro work',
          'two cars',
          'signal',
          'autos and buses',
          '# Hindi',
          'ट्रैफिक',
          'पार्किंग',
        ],
      },
    ],
  },
  {
    name: 'Safety and social life',
    description: 'How safe people feel and how people in the neighbourhood get on with each other.',
    codes: [
      {
        name: 'Safety at night',
        description: 'Feeling unsafe after dark, harassment of women and girls, thefts, drinking in public, little police presence.',
        inclusion: 'Fear, harassment, crime and policing, especially for women.',
        exclusion: 'Road danger from traffic (code Traffic and parking).',
        example: 'Safety at night is the biggest issue, especially for working women coming back late.',
        rules: [
          '# English',
          'safe',
          'unsafe',
          'safety',
          'eve teasing',
          'chain snatching',
          'police',
          'after dark',
          'scary',
          'comments on girls',
          'followed home',
          'drink openly',
          'come home alone',
          'dark and lonely',
          '# Hinglish and romanised Bengali',
          'comment pass',
          'bhoy',
          '# Bengali and Hindi',
          'ভয়',
          'सुरक्षित',
        ],
      },
      {
        name: 'Community events',
        description: 'Loss of shared activities, festivals and meeting places; neighbours no longer know each other.',
        inclusion: 'Community programmes, festivals, adda, common spaces to meet.',
        exclusion: 'Tension between groups (code Newcomers and old residents).',
        example: 'There are no community programmes any more, people just stay inside their flats.',
        rules: [
          '# English',
          'community programmes',
          'community events',
          'community hall',
          'festivals',
          'togetherness',
          'puja committee',
          'know our neighbours',
          'organises anything',
          'people can meet',
          'five families',
          '# Romanised Bengali',
          'adda',
        ],
      },
      {
        name: 'Newcomers and old residents',
        description: 'Distrust or distance between long-standing residents and tenants, migrants or other newcomers.',
        inclusion: 'Outsiders, tenants, migrants, language barriers, people who do not mix.',
        example: 'Old residents look at us as outsiders even after 5 years.',
        rules: [
          '# English',
          'outsider*',
          'tenants',
          'migrants',
          'old residents',
          'new people',
          'do not mix',
          'local language',
          'people from other states',
          'locals',
          '# Romanised Bengali',
          'mesh na',
          '# Bengali',
          'পুরোনো বাসিন্দা*',
        ],
      },
    ],
  },
  {
    name: 'Housing and cost of living',
    description: 'The cost and security of a place to live.',
    codes: [
      {
        name: 'Rent and housing',
        description: 'High or rising rents and deposits, landlords, eviction, and people being priced out of the area.',
        example: 'Rents are going up every year and the landlord asks for 1000 rupees more each time.',
        rules: [
          '# English',
          'rent',
          'rents',
          'housing',
          'landlord*',
          'deposit',
          'eviction',
          'vacate',
          'broker',
          'pushed out',
          'outskirts',
          'rich people',
          '# Hinglish and romanised Bengali',
          'kiraya',
          'bhara',
          '# Hindi',
          'किराया',
        ],
      },
    ],
  },
  {
    name: 'Environment',
    description: 'The quality of the air and of daily surroundings.',
    codes: [
      {
        name: 'Air pollution',
        description: 'Smog, dust, smoke and fumes, and the breathing problems people link to them.',
        exclusion: 'Noise (code Noise).',
        example: 'Air pollution is very bad, in winter you cannot even see the next building.',
        rules: [
          '# English',
          '/(?<!noise\\s)\\bpollution\\b/i',
          'smog',
          'dust',
          'smoke',
          'air is black',
          'asthma',
          'inhaler',
          'air purifier',
          'breathing',
          '# Hinglish and romanised Bengali',
          'saans',
          'dhulo',
          '# Hindi',
          'प्रदूषण',
        ],
      },
      {
        name: 'Noise',
        description: 'Loudspeakers, music, honking and construction noise.',
        example: 'Loudspeakers during every function and procession, nobody can sleep.',
        rules: ['# English', 'noise', 'loudspeaker*', 'honking', 'music till', '# Hinglish', 'shor', 'DJ'],
      },
    ],
  },
];

export interface WorkedExample {
  docs: TextDoc[];
  codes: CodeDef[];
  segments: CodedSegment[];
  memo: Memo;
  /** Answers with at least one auto-coded segment. */
  nCoded: number;
}

/** True when the dataset can host the worked example (the bundled sample with its open question). */
export function canBuildWorkedExample(ds: Dataset | null | undefined): boolean {
  if (!ds || ds.source?.kind !== 'sample') return false;
  const v = ds.variables.find((x) => x.name === EXAMPLE_QUESTION);
  return !!v && !(ds.columns[v.id] instanceof Float64Array);
}

/**
 * The starter codebook as CodeDefs: each theme followed by its codes. Codes get distinct highlighter
 * colours; the themes (which hold no coding of their own) share the last palette colour.
 */
export function starterCodes(now = Date.now()): CodeDef[] {
  const out: CodeDef[] = [];
  let colour = 0;
  const themeColour = CODE_PALETTE[CODE_PALETTE.length - 1];
  for (const theme of STARTER_CODEBOOK) {
    const parent: CodeDef = {
      id: newId('code'),
      name: theme.name,
      description: theme.description,
      color: themeColour,
      parentId: null,
      createdAt: now + out.length,
    };
    out.push(parent);
    for (const c of theme.codes) {
      out.push({
        id: newId('code'),
        name: c.name,
        description: c.description,
        color: CODE_PALETTE[colour++ % (CODE_PALETTE.length - 1)],
        parentId: parent.id,
        inclusion: c.inclusion,
        exclusion: c.exclusion,
        example: c.example,
        rules: c.rules,
        createdAt: now + out.length,
      });
    }
  }
  return out;
}

/**
 * Build the worked example for the bundled sample survey: response documents with gender, city and
 * area, the starter codebook, and whole-response auto-coding from its keyword rules (origin
 * 'auto-rule', coded as `coder`).
 */
export function buildWorkedExample(ds: Dataset, coder: string, existing: CodingProject | null = null): WorkedExample {
  const q = ds.variables.find((v) => v.name === EXAMPLE_QUESTION);
  if (!q) throw new Error(`The worked example needs the ${EXAMPLE_QUESTION} question from the sample survey.`);
  const attrIds = EXAMPLE_ATTRIBUTES.map((n) => ds.variables.find((v) => v.name === n)?.id).filter((x): x is string => !!x);
  const idVar = ds.variables.find((v) => v.name === EXAMPLE_ID_VARIABLE);
  const { docs } = buildResponseDocs(ds, q.id, attrIds, idVar?.id ?? null, existing?.docs ?? []);
  const now = Date.now();
  const codes = starterCodes(now);
  const matches = findRuleMatches(docs, codes, 'text', existing?.segments ?? [], coder);
  const segments: CodedSegment[] = matches
    .filter((m) => !m.alreadyCoded)
    .map((m) => ({ id: newId('seg'), docId: m.docId, codeId: m.codeId, start: m.start, end: m.end, coder, origin: 'auto-rule', createdAt: now }));
  const nCoded = new Set(segments.map((s) => s.docId)).size;
  const memo: Memo = {
    id: newId('memo'),
    title: 'About this worked example',
    text: [
      `This is an example project made from the sample survey. It holds the ${docs.length} answers to "${EXAMPLE_QUESTION}" (the biggest challenge facing the neighbourhood), with gender, city and area as attributes.`,
      '',
      `The starter codebook has ${codes.filter((c) => c.parentId).length} codes under ${codes.filter((c) => !c.parentId).length} themes. The codes were applied by simple keyword rules, not by a person: ${nCoded} of ${docs.length} answers matched at least one rule. Keyword rules miss answers that use other words and sometimes code answers that only mention a word in passing, so review them before you report anything.`,
      '',
      'Suggested next steps:',
      '1. In Responses, read the coded answers and remove codes that do not fit. Filter "Not coded yet" to find answers the rules missed.',
      '2. Some themes have no code yet (for example jobs for young people, corruption, parks and play space). Add codes for them.',
      '3. Compare themes across groups in Analyse > Codes by attribute.',
      '4. Use Export > Codes to dataset variables, then run Analyze > Descriptive Statistics > Crosstabs of a code by gender.',
    ].join('\n'),
    createdAt: now,
    updatedAt: now,
  };
  return { docs, codes, segments, memo, nCoded };
}
