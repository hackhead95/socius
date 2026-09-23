// Procedure registry. Each team owns its own sub-index; this file only concatenates them.
import type { ProcedureDef } from '../core/procedure';
import { coreProcedures } from './core';
import { modelProcedures } from './models';
import { graphProcedures } from './graphs';

export const procedures: ProcedureDef[] = [...coreProcedures, ...modelProcedures, ...graphProcedures];

export function getProcedure(id: string): ProcedureDef | undefined {
  return procedures.find((p) => p.id === id);
}
