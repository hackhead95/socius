// Open fuzz findings (details, seeds and minimal reproductions: docs/qa/FUZZ-FINDINGS.md).
// A failure whose signature matches an entry here is reported but does not fail CI. When a finding is
// fixed, delete its entry: the fuzz suites then fail again if the problem comes back.
//
// Signature format (lib/findings.ts): `${area}|${subject}|${check}|${detail with numbers -> #,
// "quoted text" -> "…", ids -> <id>}`. Match on the stable part only.
import type { Failure } from './lib/findings';

export interface KnownIssue {
  id: string;
  area: Failure['area'];
  match: RegExp | ((f: Failure) => boolean);
}

export const KNOWN_ISSUES: KnownIssue[] = [
  // ---- P0 ----
  { id: 'FZ-01', area: 'transforms', match: /^transforms\|aggregate\|throw\|.*Maximum call stack/ },
  { id: 'FZ-02', area: 'transforms', match: /^transforms\|visualBin\|throw\|.*toPrecision/ },
  { id: 'FZ-03', area: 'procedures', match: /^procedures\|descriptives\|shape\|header width # != body width #/ },
  { id: 'FZ-04', area: 'procedures', match: /^procedures\|crosstabs\|weight\|.*"…" row # col #/ },
  // ---- P1 ----
  { id: 'FZ-05', area: 'transforms', match: /^transforms\|selectCasesTransform\|structure\|.*filter_\$/ },
  { id: 'FZ-06', area: 'procedures', match: /^procedures\|oneway-anova\|(text|rendered|apa-na)\|/ },
  { id: 'FZ-07', area: 'procedures', match: /^procedures\|(correlations|graph-scatter)\|(apa-df|apa-na)\|/ },
  { id: 'FZ-08', area: 'procedures', match: /^procedures\|(ttest-one-sample|ttest-paired|ttest-independent|oneway-anova)\|boundary\|ciLevel=#/ },
  { id: 'FZ-09', area: 'procedures', match: /^procedures\|oneway-anova\|slow\|/ },
  { id: 'FZ-10', area: 'io', match: (f) => f.subject === 'xlsx-roundtrip' && /: missing \{"d":\[(""|[^\]]*,"")/.test(f.detail) },
  // ---- P2 ----
  { id: 'FZ-11', area: 'procedures', match: (f) => f.subject === 'crosstabs' && f.check === 'slow' && /exact=exact/.test(f.detail) },
  { id: 'FZ-12', area: 'transforms', match: /^transforms\|expression\|deep-nesting\|.*Maximum call stack/ },
  { id: 'FZ-13', area: 'transforms', match: /^transforms\|visualBin\|semantics\|odd bin label/ },
  { id: 'FZ-14', area: 'procedures', match: /^procedures\|(descriptives|explore)\|apa-na\|/ },
  { id: 'FZ-15', area: 'procedures', match: /^procedures\|chisquare-gof\|validate-text\|.*Infinity/ },
  { id: 'FZ-16', area: 'procedures', match: /^procedures\|(graph-box\|text\|empty interpretation block|graph-line\|text-empty-name|models\.multinomial\|text-empty-name)/ },
  { id: 'FZ-17', area: 'io', match: /^io\|xlsx-roundtrip\|roundtrip\|.*: value labels \[.*-> \[\]$/ },
  { id: 'FZ-19', area: 'transforms', match: /^transforms\|aggregate\|message-contradiction\|/ },
  { id: 'FZ-18', area: 'io', match: (f) => f.area === 'io' && /^(csv|xlsx)-roundtrip$/.test(f.subject) && f.check === 'roundtrip' && (/row \d+: "[^"]*" -> "NaN"/.test(f.detail) || /value labels \[\[".*-> \[\[\d/.test(f.detail) || /: missing \{"d":\["[^"]+".*-> \{"d":\[\]/.test(f.detail)) },
];
