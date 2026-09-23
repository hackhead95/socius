"""Dump an SPSS .sav/.zsav file as JSON, exactly as pyreadstat reads it.

Used as the test oracle for Socius's own .sav reader and writer:
  /opt/oracle/bin/python scripts/fixtures/dump_sav.py path/to/file.sav

Numbers that JSON cannot hold are written as strings: NaN -> null, inf -> "Infinity", -inf -> "-Infinity".
Dates are not converted: values are raw SPSS seconds since 1582-10-14.
"""
import json
import math
import sys

import pyreadstat


def clean(x):
    if x is None:
        return None
    if isinstance(x, float):
        if math.isnan(x):
            return None
        if math.isinf(x):
            return "Infinity" if x > 0 else "-Infinity"
        return x
    if hasattr(x, "item"):  # numpy scalar
        return clean(x.item())
    return x


def dump(path):
    df, meta = pyreadstat.read_sav(path, user_missing=True, disable_datetime_conversion=True)
    variables = []
    for name in meta.column_names:
        vl = meta.variable_value_labels.get(name, {})
        variables.append({
            "name": name,
            "label": meta.column_names_to_labels.get(name) or "",
            "format": meta.original_variable_types.get(name),
            "type": meta.readstat_variable_types.get(name),
            "measure": meta.variable_measure.get(name),
            "display_width": meta.variable_display_width.get(name),
            "alignment": meta.variable_alignment.get(name),
            "storage_width": meta.variable_storage_width.get(name),
            "value_labels": [[clean(k), v] for k, v in vl.items()],
            "missing": [{"lo": clean(r["lo"]), "hi": clean(r["hi"])} for r in meta.missing_ranges.get(name, [])],
        })
    data = {}
    for name in meta.column_names:
        data[name] = [clean(v) for v in df[name].tolist()]
    return {
        "file_label": meta.file_label or "",
        "notes": list(meta.notes or []),
        "number_rows": meta.number_rows,
        "file_encoding": meta.file_encoding,
        "variables": variables,
        "data": data,
    }


if __name__ == "__main__":
    out = dump(sys.argv[1])
    sys.stdout.write(json.dumps(out, ensure_ascii=False, allow_nan=False))
