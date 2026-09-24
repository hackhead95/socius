import type { ProcedureDef } from '../../core/procedure';
import { linearRegression } from './linear';
import { binaryLogistic } from './binary';
import { ordinalRegression } from './plum';
import { multinomialLogistic } from './nomreg';
import { reliability } from './reliability';
import { factorAnalysis } from './factor';

/** Statistical-model procedures: Regression, Scale and Dimension Reduction menus. */
export const modelProcedures: ProcedureDef[] = [linearRegression, binaryLogistic, ordinalRegression, multinomialLogistic, reliability, factorAnalysis];
