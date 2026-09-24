// Catalogue of COMPUTE functions, shown in the Compute dialog's function list.
// Every entry here is implemented in evaluate.ts (a test checks that each one compiles).

export type FunctionCategory = 'Arithmetic' | 'Statistical' | 'Missing values' | 'Search' | 'Text' | 'Dates' | 'Conversion';

export interface FunctionDoc {
  name: string;
  /** Signature as shown to users, e.g. "MEAN.n(a, b, ...)" */
  sig: string;
  /** Text inserted in the expression when the user picks the function. */
  insert: string;
  desc: string;
  cat: FunctionCategory;
}

export const FUNCTION_DOCS: FunctionDoc[] = [
  // Arithmetic
  { name: 'ABS', sig: 'ABS(x)', insert: 'ABS(', desc: 'Absolute value.', cat: 'Arithmetic' },
  { name: 'SQRT', sig: 'SQRT(x)', insert: 'SQRT(', desc: 'Square root. Negative values give system-missing.', cat: 'Arithmetic' },
  { name: 'EXP', sig: 'EXP(x)', insert: 'EXP(', desc: 'e raised to the power x.', cat: 'Arithmetic' },
  { name: 'LN', sig: 'LN(x)', insert: 'LN(', desc: 'Natural logarithm. Zero or negative values give system-missing.', cat: 'Arithmetic' },
  { name: 'LG10', sig: 'LG10(x)', insert: 'LG10(', desc: 'Base-10 logarithm.', cat: 'Arithmetic' },
  { name: 'RND', sig: 'RND(x [, mult])', insert: 'RND(', desc: 'Round half away from zero, optionally to the nearest multiple (RND(income, 1000)).', cat: 'Arithmetic' },
  { name: 'TRUNC', sig: 'TRUNC(x [, mult])', insert: 'TRUNC(', desc: 'Drop the fractional part (towards zero), optionally to a multiple.', cat: 'Arithmetic' },
  { name: 'MOD', sig: 'MOD(x, m)', insert: 'MOD(', desc: 'Remainder of x divided by m, with the sign of x.', cat: 'Arithmetic' },
  { name: 'SIN', sig: 'SIN(x)', insert: 'SIN(', desc: 'Sine (x in radians).', cat: 'Arithmetic' },
  { name: 'COS', sig: 'COS(x)', insert: 'COS(', desc: 'Cosine (x in radians).', cat: 'Arithmetic' },
  { name: 'TAN', sig: 'TAN(x)', insert: 'TAN(', desc: 'Tangent (x in radians).', cat: 'Arithmetic' },
  { name: 'ARTAN', sig: 'ARTAN(x)', insert: 'ARTAN(', desc: 'Arctangent, in radians.', cat: 'Arithmetic' },
  { name: 'ARSIN', sig: 'ARSIN(x)', insert: 'ARSIN(', desc: 'Arcsine, in radians.', cat: 'Arithmetic' },
  { name: 'ARCOS', sig: 'ARCOS(x)', insert: 'ARCOS(', desc: 'Arccosine, in radians.', cat: 'Arithmetic' },
  // Statistical
  { name: 'MEAN', sig: 'MEAN.n(a, b, ...)', insert: 'MEAN(', desc: 'Mean of the valid arguments. MEAN.3(q1 TO q5) needs at least 3 valid answers, otherwise system-missing.', cat: 'Statistical' },
  { name: 'SUM', sig: 'SUM.n(a, b, ...)', insert: 'SUM(', desc: 'Sum of the valid arguments. SUM.n needs at least n valid values.', cat: 'Statistical' },
  { name: 'SD', sig: 'SD.n(a, b, ...)', insert: 'SD(', desc: 'Standard deviation of the valid arguments (at least 2).', cat: 'Statistical' },
  { name: 'VARIANCE', sig: 'VARIANCE.n(a, b, ...)', insert: 'VARIANCE(', desc: 'Variance of the valid arguments (at least 2).', cat: 'Statistical' },
  { name: 'CFVAR', sig: 'CFVAR.n(a, b, ...)', insert: 'CFVAR(', desc: 'Coefficient of variation (SD divided by mean).', cat: 'Statistical' },
  { name: 'MIN', sig: 'MIN.n(a, b, ...)', insert: 'MIN(', desc: 'Smallest valid value (works for text too).', cat: 'Statistical' },
  { name: 'MAX', sig: 'MAX.n(a, b, ...)', insert: 'MAX(', desc: 'Largest valid value (works for text too).', cat: 'Statistical' },
  { name: 'NVALID', sig: 'NVALID(a, b, ...)', insert: 'NVALID(', desc: 'How many of the arguments are not missing.', cat: 'Statistical' },
  { name: 'NMISS', sig: 'NMISS(a, b, ...)', insert: 'NMISS(', desc: 'How many of the arguments are missing (system or user).', cat: 'Statistical' },
  // Missing
  { name: 'MISSING', sig: 'MISSING(x)', insert: 'MISSING(', desc: '1 if x is system- or user-missing, else 0.', cat: 'Missing values' },
  { name: 'SYSMIS', sig: 'SYSMIS(x)', insert: 'SYSMIS(', desc: '1 if x is system-missing (empty), else 0.', cat: 'Missing values' },
  { name: 'VALUELABEL', sig: 'VALUELABEL(var)', insert: 'VALUELABEL(', desc: 'The value label of the case\'s value (empty text if it has none).', cat: 'Conversion' },
  { name: 'VALUE', sig: 'VALUE(var)', insert: 'VALUE(', desc: 'The stored value, even when it is declared user-missing.', cat: 'Missing values' },
  // Search
  { name: 'ANY', sig: 'ANY(x, v1, v2, ...)', insert: 'ANY(', desc: '1 if x equals any of the listed values, else 0.', cat: 'Search' },
  { name: 'RANGE', sig: 'RANGE(x, lo, hi [, lo2, hi2 ...])', insert: 'RANGE(', desc: '1 if x lies in any of the inclusive ranges, else 0.', cat: 'Search' },
  // Text
  { name: 'CONCAT', sig: 'CONCAT(s1, s2, ...)', insert: 'CONCAT(', desc: 'Join texts together.', cat: 'Text' },
  { name: 'SUBSTR', sig: 'SUBSTR(s, pos [, len])', insert: 'SUBSTR(', desc: 'Part of a text starting at character pos (1 = first).', cat: 'Text' },
  { name: 'UPCASE', sig: 'UPCASE(s)', insert: 'UPCASE(', desc: 'Text in capital letters.', cat: 'Text' },
  { name: 'LOWER', sig: 'LOWER(s)', insert: 'LOWER(', desc: 'Text in lower-case letters.', cat: 'Text' },
  { name: 'LENGTH', sig: 'LENGTH(s)', insert: 'LENGTH(', desc: 'Number of characters, ignoring trailing spaces.', cat: 'Text' },
  { name: 'LTRIM', sig: 'LTRIM(s [, char])', insert: 'LTRIM(', desc: 'Remove leading spaces (or a given character).', cat: 'Text' },
  { name: 'RTRIM', sig: 'RTRIM(s [, char])', insert: 'RTRIM(', desc: 'Remove trailing spaces (or a given character).', cat: 'Text' },
  { name: 'REPLACE', sig: "REPLACE(s, 'old', 'new' [, n])", insert: 'REPLACE(', desc: 'Replace occurrences of a text (the first n only, if given).', cat: 'Text' },
  { name: 'CHAR.INDEX', sig: "CHAR.INDEX(s, 'find')", insert: 'CHAR.INDEX(', desc: 'Position of the first occurrence of a text, or 0 if absent.', cat: 'Text' },
  // Conversion
  { name: 'NUMBER', sig: 'NUMBER(s, F8.2)', insert: 'NUMBER(', desc: 'Read a number from text using a format, e.g. NUMBER(zip, F5.0). Invalid text gives system-missing.', cat: 'Conversion' },
  { name: 'STRING', sig: 'STRING(x, F8.2)', insert: 'STRING(', desc: 'Write a number as text using a format, e.g. STRING(age, F3.0). N3 pads with zeros.', cat: 'Conversion' },
  // Dates
  { name: 'XDATE.YEAR', sig: 'XDATE.YEAR(date)', insert: 'XDATE.YEAR(', desc: 'Year of a date (e.g. 1987).', cat: 'Dates' },
  { name: 'XDATE.MONTH', sig: 'XDATE.MONTH(date)', insert: 'XDATE.MONTH(', desc: 'Month of a date, 1 to 12.', cat: 'Dates' },
  { name: 'XDATE.MDAY', sig: 'XDATE.MDAY(date)', insert: 'XDATE.MDAY(', desc: 'Day of the month, 1 to 31.', cat: 'Dates' },
  { name: 'XDATE.WKDAY', sig: 'XDATE.WKDAY(date)', insert: 'XDATE.WKDAY(', desc: 'Day of the week, 1 = Sunday to 7 = Saturday.', cat: 'Dates' },
  { name: 'XDATE.QUARTER', sig: 'XDATE.QUARTER(date)', insert: 'XDATE.QUARTER(', desc: 'Quarter of the year, 1 to 4.', cat: 'Dates' },
  { name: 'XDATE.JDAY', sig: 'XDATE.JDAY(date)', insert: 'XDATE.JDAY(', desc: 'Day of the year, 1 to 366.', cat: 'Dates' },
  { name: 'XDATE.HOUR', sig: 'XDATE.HOUR(datetime)', insert: 'XDATE.HOUR(', desc: 'Hour of the day, 0 to 23.', cat: 'Dates' },
  { name: 'XDATE.MINUTE', sig: 'XDATE.MINUTE(datetime)', insert: 'XDATE.MINUTE(', desc: 'Minute of the hour.', cat: 'Dates' },
  { name: 'XDATE.SECOND', sig: 'XDATE.SECOND(datetime)', insert: 'XDATE.SECOND(', desc: 'Seconds within the minute.', cat: 'Dates' },
  { name: 'XDATE.DATE', sig: 'XDATE.DATE(datetime)', insert: 'XDATE.DATE(', desc: 'The date part of a date-time (time set to midnight).', cat: 'Dates' },
  { name: 'XDATE.TDAY', sig: 'XDATE.TDAY(date)', insert: 'XDATE.TDAY(', desc: 'Whole days since 14 Oct 1582.', cat: 'Dates' },
  { name: 'DATE.DMY', sig: 'DATE.DMY(d, m, y)', insert: 'DATE.DMY(', desc: 'Build a date from day, month and year. Format the result as a date in Variable View.', cat: 'Dates' },
  { name: 'DATE.MDY', sig: 'DATE.MDY(m, d, y)', insert: 'DATE.MDY(', desc: 'Build a date from month, day and year.', cat: 'Dates' },
  { name: 'DATE.MOYR', sig: 'DATE.MOYR(m, y)', insert: 'DATE.MOYR(', desc: 'First day of the given month and year.', cat: 'Dates' },
  { name: 'TIME.HMS', sig: 'TIME.HMS(h [, m, s])', insert: 'TIME.HMS(', desc: 'A time interval in seconds from hours, minutes and seconds.', cat: 'Dates' },
  { name: 'TIME.DAYS', sig: 'TIME.DAYS(days)', insert: 'TIME.DAYS(', desc: 'A time interval in seconds from a number of days.', cat: 'Dates' },
  { name: 'CTIME.DAYS', sig: 'CTIME.DAYS(t)', insert: 'CTIME.DAYS(', desc: 'Number of days in a time interval (dates are stored in seconds).', cat: 'Dates' },
  { name: 'CTIME.HOURS', sig: 'CTIME.HOURS(t)', insert: 'CTIME.HOURS(', desc: 'Number of hours in a time interval.', cat: 'Dates' },
  { name: 'CTIME.MINUTES', sig: 'CTIME.MINUTES(t)', insert: 'CTIME.MINUTES(', desc: 'Number of minutes in a time interval.', cat: 'Dates' },
  { name: 'DATEDIFF', sig: "DATEDIFF(later, earlier, 'years')", insert: 'DATEDIFF(', desc: "Whole units between two dates: 'years', 'quarters', 'months', 'weeks', 'days', 'hours', 'minutes' or 'seconds'.", cat: 'Dates' },
  { name: 'YRMODA', sig: 'YRMODA(y, m, d)', insert: 'YRMODA(', desc: 'Day number since 14 Oct 1582 (15 Oct 1582 = 1), as in older SPSS syntax.', cat: 'Dates' },
];

export const SYSTEM_VARIABLES = [
  { name: '$SYSMIS', desc: 'The system-missing value (an empty cell).' },
  { name: '$CASENUM', desc: 'The case number (row number, starting at 1).' },
  { name: '$TIME', desc: 'The current date and time.' },
];

export const OPERATOR_DOCS = [
  { sym: '+ - * /', desc: 'Arithmetic' },
  { sym: '**', desc: 'Power (x**2)' },
  { sym: '= <> < <= > >=', desc: 'Comparison (also EQ NE LT LE GT GE, ~=)' },
  { sym: 'AND OR NOT', desc: 'Logic (also & | ~)' },
  { sym: 'a TO d', desc: 'Adjacent variables inside a function: MEAN(q1 TO q5)' },
];
