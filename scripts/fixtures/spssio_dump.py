"""Dump an SPSS .sav/.zsav file as JSON using IBM's own SPSS I/O library (libspssdio, shipped
inside the savReaderWriter package). This is the reader SPSS Statistics itself uses, so it is the
strictest check that files written by Socius open in SPSS.

  /opt/oracle/bin/pip install savReaderWriter     # once
  /opt/oracle/bin/python scripts/fixtures/spssio_dump.py file.sav

Exit code 3 means savReaderWriter is not installed (tests skip in that case).
"""
import collections
import collections.abc
import json
import math
import sys

# savReaderWriter 3.4.2 predates Python 3.10, which moved these names to collections.abc.
for _n in ("Iterable", "Mapping", "MutableMapping", "Sequence", "Callable"):
    if not hasattr(collections, _n):
        setattr(collections, _n, getattr(collections.abc, _n))

try:
    import savReaderWriter as srw
except ImportError:
    sys.exit(3)

SYSMIS = -1.7976931348623157e308


def num(x):
    if x is None:
        return None
    if isinstance(x, float):
        if math.isnan(x) or x == SYSMIS:
            return None
        if math.isinf(x):
            return "Infinity" if x > 0 else "-Infinity"
    return x


def text(x):
    if isinstance(x, bytes):
        x = x.decode("utf-8")
    return x.rstrip(" ")


def main(path):
    with srw.SavHeaderReader(path, ioUtf8=True) as h:
        m = h.all()
    names = list(m.varNames)
    variables = []
    for name in names:
        width = m.varTypes[name]
        miss = m.missingValues.get(name) or {}
        missing = {}
        if "values" in miss:
            missing["values"] = [text(v) if width else num(v) for v in miss["values"]]
        if "lower" in miss:
            missing["lower"] = num(miss["lower"])
            missing["upper"] = num(miss["upper"])
        if "value" in miss:
            missing["value"] = num(miss["value"])
        vl = m.valueLabels.get(name) or {}
        variables.append({
            "name": name,
            "width": width,
            "label": m.varLabels.get(name) or "",
            "format": m.formats.get(name),
            "measure": m.measureLevels.get(name),
            "columns": m.columnWidths.get(name),
            "alignment": m.alignments.get(name),
            "role": (m.varRoles or {}).get(name),
            "attributes": (m.varAttributes or {}).get(name) or {},
            "missing": missing,
            "value_labels": [[text(k) if width else num(k), v] for k, v in vl.items()],
        })
    rows = []
    with srw.SavReader(path, ioUtf8=True, rawMode=True) as r:
        for row in r:
            rows.append([text(v) if isinstance(v, (bytes, str)) else num(v) for v in row])
    out = {
        "file_label": m.fileLabel or "",
        "weight_var": m.caseWeightVar or None,
        "variables": variables,
        "rows": rows,
    }
    sys.stdout.write(json.dumps(out, ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main(sys.argv[1])
