import { describe, expect, it } from 'vitest';
import { compileExpression, conditionMask, ExprError, parse, spssRound, spssDate, tokenize, FUNCTION_DOCS } from '../../src/lib/transform';
import { ds } from './helpers';

const d = ds([
  { name: 'a', values: [1, 2, null, 4, 9] },
  { name: 'b', values: [10, 0, 5, null, 3] },
  { name: 'q1', values: [1, 2, 3, 4, 5] },
  { name: 'q2', values: [2, null, 3, 99, 5], opts: { missing: { discrete: [99] } } },
  { name: 'q3', values: [3, null, null, 4, 5] },
  { name: 'name', values: ['Ann', 'bob ', '', 'Cara', 'dan'] },
  { name: 'bdate', values: [spssDate(1990, 5, 17), spssDate(2000, 2, 29), null, spssDate(1582, 10, 15), spssDate(2024, 12, 31)] },
]);

function evalAll(src: string) {
  const c = compileExpression(d, src);
  return Array.from({ length: d.nCases }, (_, i) => c.evaluate(i));
}
function ev(src: string, row = 0) {
  return compileExpression(d, src).evaluate(row);
}

describe('lexer', () => {
  it('normalises word operators and symbols', () => {
    const t = tokenize("a GE 2 & b ~= 3 | NOT c <> 'x''y'");
    expect(t.map((x) => x.text)).toEqual(['a', '>=', '2', 'AND', 'b', '~=', '3', 'OR', 'NOT', 'c', '~=', "x'y", '']);
  });
  it('keeps dots inside names and function names', () => {
    const t = tokenize('MEAN.3(q1.a, 1.5, .5, 2.)');
    expect(t.filter((x) => x.kind !== 'comma').map((x) => x.text)).toEqual(['MEAN.3', '(', 'q1.a', '1.5', '.5', '2.', ')', '']);
  });
  it('allows a trailing command period', () => {
    expect(() => parse('a + 1 .')).not.toThrow();
    expect(ev('a + 1.')).toBe(2);
  });
  it('reports an unclosed string with its position', () => {
    try {
      tokenize("a = 'abc");
      throw new Error('no');
    } catch (e) {
      expect(e).toBeInstanceOf(ExprError);
      expect((e as ExprError).pos).toBe(4);
    }
  });
});

describe('precedence', () => {
  it('multiplication before addition, left-to-right division', () => {
    expect(ev('1 + 2 * 3')).toBe(7);
    expect(ev('(1 + 2) * 3')).toBe(9);
    expect(ev('8 / 4 / 2')).toBe(1);
    expect(ev('10 - 3 - 2')).toBe(5);
  });
  it('power binds tighter than unary minus and is left associative', () => {
    expect(ev('-2**2')).toBe(-4);
    expect(ev('2**-1')).toBe(0.5);
    expect(ev('2**3**2')).toBe(64);
  });
  it('relations below arithmetic, NOT below relations, AND before OR', () => {
    expect(ev('1 + 1 = 2')).toBe(1);
    expect(ev('NOT 1 > 2')).toBe(1);
    expect(ev('1 = 1 OR 1 = 2 AND 1 = 3')).toBe(1);
    expect(ev('(1 = 1 OR 1 = 2) AND 1 = 3')).toBe(0);
  });
});

describe('missing values', () => {
  it('arithmetic with sysmis gives sysmis', () => {
    expect(evalAll('a + b').map((x) => (Number.isNaN(x) ? null : x))).toEqual([11, 2, null, null, 12]);
  });
  it('0 * missing and 0 / missing are 0', () => {
    expect(ev('0 * a', 2)).toBe(0);
    expect(ev('b / a', 1)).toBe(0); // b=0
    expect(ev('0 / b', 3)).toBe(0);
  });
  it('division by zero is sysmis', () => {
    expect(ev('a / b', 1)).toBeNaN();
    expect(ev('SQRT(-1)')).toBeNaN();
    expect(ev('LN(0)')).toBeNaN();
    expect(ev('EXP(1000)')).toBeNaN();
  });
  it('user-missing values are treated as missing', () => {
    expect(ev('q2 + 1', 3)).toBeNaN();
    expect(ev('VALUE(q2) + 1', 3)).toBe(100);
    expect(ev('MISSING(q2)', 3)).toBe(1);
    expect(ev('SYSMIS(q2)', 3)).toBe(0);
    expect(ev('SYSMIS(q2)', 1)).toBe(1);
    expect(ev('MISSING(q2)', 0)).toBe(0);
  });
  it('comparisons with missing are missing; logic follows SPSS', () => {
    expect(ev('a > 1', 2)).toBeNaN();
    expect(ev('a > 1 OR 1 = 1', 2)).toBe(1);
    expect(ev('a > 1 AND 1 = 2', 2)).toBe(0);
    expect(ev('a > 1 AND 1 = 1', 2)).toBeNaN();
    expect(ev('NOT a > 1', 2)).toBeNaN();
  });
  it('$SYSMIS and $CASENUM', () => {
    expect(ev('$SYSMIS')).toBeNaN();
    expect(evalAll('$CASENUM')).toEqual([1, 2, 3, 4, 5]);
    expect(ev('SYSMIS($SYSMIS)')).toBe(1);
  });
});

describe('statistical functions', () => {
  it('MEAN skips missing and .n requires valid count', () => {
    expect(evalAll('MEAN(q1, q2, q3)').map((x) => (Number.isNaN(x) ? null : x))).toEqual([2, 2, 3, 4, 5]);
    expect(evalAll('MEAN.3(q1, q2, q3)').map((x) => (Number.isNaN(x) ? null : x))).toEqual([2, null, null, null, 5]);
    expect(evalAll('MEAN.2(q1 TO q3)').map((x) => (Number.isNaN(x) ? null : x))).toEqual([2, null, 3, 4, 5]);
  });
  it('SUM, SD, VARIANCE, MIN, MAX, CFVAR', () => {
    expect(ev('SUM(1, 2, $SYSMIS, 4)')).toBe(7);
    expect(ev('SUM.4(1, 2, $SYSMIS, 4)')).toBeNaN();
    expect(ev('VARIANCE(1, 2, 3, 4)')).toBeCloseTo(1.6666667, 6);
    expect(ev('SD(2, 4, 4, 4, 5, 5, 7, 9)')).toBeCloseTo(2.13809, 5);
    expect(ev('SD(5)')).toBeNaN();
    expect(ev('MIN(3, 1, 2)')).toBe(1);
    expect(ev('MAX(3, $SYSMIS, 2)')).toBe(3);
    expect(ev('CFVAR(1, 2, 3)')).toBeCloseTo(0.5, 10);
    expect(ev("MAX('apple', 'pear')")).toBe('pear');
  });
  it('NVALID and NMISS count user-missing as missing', () => {
    expect(evalAll('NVALID(q1 TO q3)')).toEqual([3, 1, 2, 2, 3]);
    expect(evalAll('NMISS(q1, q2, q3)')).toEqual([0, 2, 1, 1, 0]);
  });
  it('rejects impossible .n suffixes', () => {
    expect(() => compileExpression(d, 'SD.1(a, b)')).toThrow(/at least 2/);
    expect(() => compileExpression(d, 'MEAN.4(a, b)')).toThrow(/only 2/);
    expect(() => compileExpression(d, 'ABS.2(a)')).toThrow(/suffix/);
  });
});

describe('arithmetic functions', () => {
  it('RND rounds half away from zero, with multiples and fuzz', () => {
    expect(ev('RND(2.5)')).toBe(3);
    expect(ev('RND(-2.5)')).toBe(-3);
    expect(ev('RND(1234, 100)')).toBe(1200);
    expect(ev('RND(1250, 100)')).toBe(1300);
    expect(spssRound(0.285 * 100)).toBe(29); // 28.499999999999996 in floating point
    expect(ev('TRUNC(-2.7)')).toBe(-2);
    expect(ev('TRUNC(17, 5)')).toBe(15);
  });
  it('MOD keeps the sign of the dividend', () => {
    expect(ev('MOD(7, 3)')).toBe(1);
    expect(ev('MOD(-7, 3)')).toBe(-1);
    expect(ev('MOD(5, 0)')).toBeNaN();
    expect(ev('MOD(0, $SYSMIS)')).toBe(0);
  });
  it('ANY and RANGE', () => {
    expect(evalAll('ANY(q1, 2, 4)')).toEqual([0, 1, 0, 1, 0]);
    expect(evalAll('RANGE(q1, 1, 2, 5, 5)')).toEqual([1, 1, 0, 0, 1]);
    expect(ev('ANY(a, 1)', 2)).toBeNaN();
    expect(ev("ANY(name, 'Cara', 'bob')", 1)).toBe(1);
  });
});

describe('string functions', () => {
  it('CONCAT, SUBSTR, case, LENGTH, trims', () => {
    expect(ev("CONCAT(name, '-', 'x')")).toBe('Ann-x');
    expect(ev("SUBSTR('abcdef', 2, 3)")).toBe('bcd');
    expect(ev("SUBSTR('abcdef', 4)")).toBe('def');
    expect(ev("SUBSTR('abc', 9)")).toBe('');
    expect(ev('UPCASE(name)', 1)).toBe('BOB ');
    expect(ev("LOWER('ABC')")).toBe('abc');
    expect(ev('LENGTH(name)', 1)).toBe(3);
    expect(ev("LTRIM('  x ')")).toBe('x ');
    expect(ev("RTRIM('x00', '0')")).toBe('x');
  });
  it('REPLACE and CHAR.INDEX', () => {
    expect(ev("REPLACE('a-b-c', '-', '+')")).toBe('a+b+c');
    expect(ev("REPLACE('a-b-c', '-', '', 1)")).toBe('ab-c');
    expect(ev("CHAR.INDEX('hello', 'll')")).toBe(3);
    expect(ev("CHAR.INDEX('hello', 'z')")).toBe(0);
  });
  it('NUMBER and STRING with formats', () => {
    expect(ev("NUMBER('42', F8.0)")).toBe(42);
    expect(ev("NUMBER('123', F5.2)")).toBeCloseTo(1.23, 10);
    expect(ev("NUMBER('1.5', F5.2)")).toBe(1.5);
    expect(ev("NUMBER('abc', F8.0)")).toBeNaN();
    expect(ev('STRING(3.14159, F5.2)')).toBe(' 3.14');
    expect(ev('STRING(7, N3)')).toBe('007');
    expect(ev('STRING(123456, F3.0)')).toBe('***');
  });
  it('string comparison ignores trailing blanks', () => {
    expect(ev("name = 'bob'", 1)).toBe(1);
    expect(ev("name < 'B'", 0)).toBe(1);
  });
});

describe('date functions', () => {
  it('extracts parts', () => {
    expect(ev('XDATE.YEAR(bdate)')).toBe(1990);
    expect(ev('XDATE.MONTH(bdate)')).toBe(5);
    expect(ev('XDATE.MDAY(bdate)')).toBe(17);
    expect(ev('XDATE.WKDAY(bdate)')).toBe(5); // 17 May 1990 was a Thursday
    expect(ev('XDATE.QUARTER(bdate)')).toBe(2);
    expect(ev('XDATE.JDAY(bdate)', 4)).toBe(366);
    expect(ev('XDATE.YEAR(bdate)', 2)).toBeNaN();
  });
  it('builds dates and handles invalid ones', () => {
    expect(ev('DATE.DMY(17, 5, 1990) = bdate')).toBe(1);
    expect(ev('DATE.MDY(5, 17, 1990) = bdate')).toBe(1);
    expect(ev('DATE.DMY(29, 2, 2001)')).toBeNaN();
    expect(ev('DATE.DMY(15, 10, 1582)')).toBe(86400);
    expect(ev('CTIME.DAYS(DATE.DMY(2, 1, 2020) - DATE.DMY(1, 1, 2020))')).toBe(1);
    expect(ev('YRMODA(1582, 10, 15)')).toBe(1);
    expect(ev('YRMODA(90, 5, 17) = CTIME.DAYS(bdate)')).toBe(1);
  });
  it('DATEDIFF counts whole units', () => {
    expect(ev("DATEDIFF(DATE.DMY(16, 5, 2020), bdate, 'years')")).toBe(29);
    expect(ev("DATEDIFF(DATE.DMY(17, 5, 2020), bdate, 'years')")).toBe(30);
    expect(ev("DATEDIFF(DATE.DMY(20, 5, 1990), bdate, 'days')")).toBe(3);
    expect(ev("DATEDIFF(DATE.DMY(16, 7, 1990), bdate, 'months')")).toBe(1);
  });
});

describe('errors point at the problem', () => {
  const err = (src: string) => {
    try {
      compileExpression(d, src);
    } catch (e) {
      return e as ExprError;
    }
    throw new Error('expected error for ' + src);
  };
  it('unknown variable with suggestion', () => {
    const e = err('ag + 1');
    expect(e.message).toMatch(/no variable named "ag"/);
    expect(e.pos).toBe(0);
    const e2 = err('q1 + qq2');
    expect(e2.message).toMatch(/Did you mean q2/);
    expect(e2.pos).toBe(5);
  });
  it('unknown function', () => {
    expect(err('MAEN(a, b)').message).toMatch(/Did you mean MEAN/);
  });
  it('type errors', () => {
    const e = err("a + 'x'");
    expect(e.message).toMatch(/needs numbers/);
    expect(e.pos).toBe(4);
    expect(err("a = 'x'").message).toMatch(/comparing a number with text/);
    expect(err("name + 'x'").message).toMatch(/CONCAT/);
  });
  it('syntax errors', () => {
    expect(err('(a + b').message).toMatch(/closing parenthesis/);
    expect(err('a b').message).toMatch(/operator/);
    expect(err('a +').message).toMatch(/ends too early/);
    expect(err('a )').pos).toBe(2);
    expect(err('ABS(a, b)').message).toMatch(/takes 1 argument/);
    expect(err('').message).toMatch(/Type an expression/);
  });
});

describe('catalogue', () => {
  it('every documented function compiles', () => {
    const argsFor: Record<string, string> = {
      NUMBER: "'1', F8.0", STRING: '1, F8.2', DATEDIFF: "bdate, bdate, 'days'", CONCAT: "'a', 'b'", SUBSTR: "'abc', 1",
      UPCASE: "'a'", LOWER: "'a'", LENGTH: "'a'", LTRIM: "'a'", RTRIM: "'a'", REPLACE: "'a', 'b', 'c'", 'CHAR.INDEX': "'a', 'b'",
      VALUE: 'a', MISSING: 'a', SYSMIS: 'a', ANY: 'a, 1', RANGE: 'a, 1, 2', MOD: '5, 2', 'DATE.DMY': '1, 1, 2000', 'DATE.MDY': '1, 1, 2000',
      'DATE.MOYR': '1, 2000', YRMODA: '2000, 1, 1',
    };
    for (const f of FUNCTION_DOCS) {
      const args = argsFor[f.name] ?? 'a, b';
      const src = `${f.name}(${['ABS', 'SQRT', 'EXP', 'LN', 'LG10', 'SIN', 'COS', 'TAN', 'ARTAN', 'ARSIN', 'ARCOS', 'RND', 'TRUNC'].includes(f.name) || f.name.startsWith('XDATE') || f.name.startsWith('CTIME') || f.name.startsWith('TIME') ? 'a' : args})`;
      expect(() => compileExpression(d, src), src).not.toThrow();
    }
  });
  it('conditionMask treats missing as false', () => {
    expect(Array.from(conditionMask(d, 'a > 1'))).toEqual([0, 1, 0, 1, 1]);
  });
});
