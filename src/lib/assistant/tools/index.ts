// The assistant's tool set. Read tools only look; action tools only ever propose.
import type { AgentTool } from '../types';
import { analysisTools } from './analysis';
import { codingTools } from './coding';
import { dataTools } from './data';
import { helpTools } from './help';
import { transformTools } from './transform';

let cached: AgentTool[] | null = null;

export function allTools(): AgentTool[] {
  if (!cached) cached = [...dataTools, ...analysisTools(), ...transformTools, ...codingTools, ...helpTools];
  return cached;
}

/** The small set offered to the on-device model (short context, weak at tools). */
export function compactTools(tab?: string): AgentTool[] {
  const names = new Set(['get_dataset_overview', 'describe_variables', 'run_analysis', 'search_help', 'get_output', ...(tab === 'coding' ? ['list_codes', 'get_coded_segments'] : [])]);
  return allTools().filter((t) => names.has(t.name));
}

export function toolByName(name: string): AgentTool | undefined {
  return allTools().find((t) => t.name === name);
}
