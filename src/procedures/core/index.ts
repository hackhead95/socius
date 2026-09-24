// Core statistics procedures, in SPSS menu order.
import type { ProcedureDef } from '../../core/procedure';
import { frequencies } from './frequencies';
import { descriptives, explore } from './descriptives';
import { crosstabs } from './crosstabs';
import { means, onewayAnova } from './oneway';
import { independentTTest, oneSampleTTest, pairedTTest } from './ttests';
import { bivariateCorrelations, partialCorrelationsProc } from './correlations';
import { binomialProc, chiSquareGofProc, friedmanProc, kruskalProc, mannWhitneyProc, wilcoxonProc } from './nonparametric';

export const coreProcedures: ProcedureDef[] = [
  // Descriptive Statistics
  frequencies,
  descriptives,
  explore,
  crosstabs,
  // Compare Means
  means,
  oneSampleTTest,
  independentTTest,
  pairedTTest,
  onewayAnova,
  // Correlate
  bivariateCorrelations,
  partialCorrelationsProc,
  // Nonparametric Tests
  chiSquareGofProc,
  binomialProc,
  mannWhitneyProc,
  kruskalProc,
  wilcoxonProc,
  friedmanProc,
];
