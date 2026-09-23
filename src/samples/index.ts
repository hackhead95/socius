// STUB — owned by the Sample Data agent.
import type { Dataset } from '../core/types';

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

export const samples: SampleInfo[] = [];

/** Load the bundled sample survey (decoded from the bundled .sav via lib/io). */
export async function loadSampleDataset(id: string): Promise<Dataset> {
  throw new Error('No samples yet');
}

export const sampleTranscripts: SampleTranscript[] = [];
