// Bundled sample data: a synthetic survey (.sav) and three fictional interview transcripts.
// Everything here is invented teaching material. Regenerate the survey with
// `/opt/oracle/bin/python scripts/samples/make_survey.py` and check it with scripts/samples/check_survey.py.
import type { Dataset } from '../core/types';
import { importFile } from '../lib/io';

import surveyUrl from './urban_trust_survey.sav?url';
import int01 from './transcripts/int01_kolkata_shyamali.txt?raw';
import int02 from './transcripts/int02_bengaluru_manoj.txt?raw';
import int03 from './transcripts/int03_delhi_sunita.txt?raw';

export interface SampleTranscript {
  name: string;
  text: string;
  attributes: Record<string, string>;
}

export interface SampleInfo {
  id: string;
  title: string;
  description: string;
}

/** File name the bundled survey is imported under (and shown as its source). */
export const SAMPLE_SURVEY_FILE = 'urban_trust_survey.sav';

export const samples: SampleInfo[] = [
  {
    id: 'urban-trust',
    title: 'Urban Neighbourhoods and Social Trust Survey (synthetic)',
    description:
      'A fictional teaching dataset: 640 households in Kolkata, Delhi, Mumbai, Bengaluru and Chennai, ' +
      'interviewed January to March 2025. It has demographics, monthly household income, a five-item ' +
      'neighbourhood trust scale (trust3 is reverse-worded), civic participation, belonging, life ' +
      'satisfaction, voting, a design weight (wt) and two open-ended questions to code. ' +
      "Missing codes are declared (8 = Don't know, 9 = Refused, 999999 = income refused). " +
      'No real people were interviewed.',
  },
];

const SAMPLE_FILES: Record<string, { url: string; fileName: string; name: string }> = {
  'urban-trust': { url: surveyUrl, fileName: SAMPLE_SURVEY_FILE, name: 'Urban trust survey (sample)' },
};

/** Bytes behind a Vite asset URL. In the single-file build the URL is an inlined data: URL, which we
 *  decode directly (no fetch), so it also works where the host blocks fetch() of data: URLs. */
export async function assetBytes(url: string): Promise<Uint8Array> {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',');
    if (comma < 0) throw new Error('The bundled sample file is damaged.');
    const meta = url.slice(5, comma);
    const payload = url.slice(comma + 1);
    if (/;base64$/i.test(meta)) {
      const bin = atob(payload);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return new TextEncoder().encode(decodeURIComponent(payload));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load the sample file (HTTP ${res.status}).`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Load the bundled sample survey (decoded from the bundled .sav via lib/io). */
export async function loadSampleDataset(id: string): Promise<Dataset> {
  const entry = SAMPLE_FILES[id];
  if (!entry) throw new Error(`There is no sample called "${id}".`);
  const bytes = await assetBytes(entry.url);
  const { dataset } = await importFile(entry.fileName, bytes);
  return { ...dataset, name: entry.name, source: { ...dataset.source, kind: 'sample', fileName: entry.fileName } };
}

const COMMON = {
  study: 'Belonging, migration and neighbourhood life in Indian cities (fictional)',
  fictional: 'yes',
};

export const sampleTranscripts: SampleTranscript[] = [
  {
    name: 'Interview 01: Shyamali, Kolkata (fictional)',
    text: int01,
    attributes: {
      ...COMMON,
      pseudonym: 'Shyamali Basu',
      age: '58',
      gender: 'Woman',
      city: 'Kolkata',
      area: 'Core city',
      migrant: 'Born in this city',
      occupation: 'Retired schoolteacher',
      housing: 'Owner, old family house',
      interviewDate: '2025-02-08',
      language: 'Bengali and English',
    },
  },
  {
    name: 'Interview 02: Manoj, Bengaluru (fictional)',
    text: int02,
    attributes: {
      ...COMMON,
      pseudonym: 'Manoj Paswan',
      age: '26',
      gender: 'Man',
      city: 'Bengaluru',
      area: 'Peri-urban',
      migrant: 'Migrated from another state (Bihar)',
      occupation: 'Delivery rider',
      housing: 'Tenant, shared paying-guest room',
      interviewDate: '2025-03-02',
      language: 'Hindi and English',
    },
  },
  {
    name: 'Interview 03: Sunita, Delhi (fictional)',
    text: int03,
    attributes: {
      ...COMMON,
      pseudonym: 'Sunita Devi',
      age: '39',
      gender: 'Woman',
      city: 'Delhi',
      area: 'Peri-urban (unauthorised colony)',
      migrant: 'Migrated from another state (Uttar Pradesh)',
      occupation: 'Domestic worker and home tailor',
      housing: 'Owner, house without legal title',
      interviewDate: '2025-01-26',
      language: 'Hindi',
    },
  },
];
