---
id: "area:lib/io"
type: area
area: lib/io
---

# Area: lib/io

9 files, 3501 lines.

## Depends on (module imports)
- [[core]]: 11

## Used by areas
- [[features - data|features/data]]: 2
- [[features - project|features/project]]: 2
- [[features - transform|features/transform]]: 1
- [[lib - transform|lib/transform]]: 1
- [[samples]]: 1

## Files
- [[codebook.ts]]: Codebook: one row per variable with the dictionary information researchers document.
- [[csv.ts]]: Delimited text (CSV, TSV, semicolon, pipe): RFC 4180 parsing with delimiter detection, and export.
- [[encoding.ts]]: Text encoding helpers shared by the SPSS, CSV and XLSX code. Everything here works in the browser and in node (TextDecoder/TextEncoder are g…
- [[io/index.ts]]: File import/export entry points. Other modules code against these signatures. Nothing here touches DOM-only globals at import time; everythi…
- [[infer.ts]]: Turn a table of raw cells (from CSV or Excel) into a typed Dataset: detect numeric, date and string columns, choose formats and measurement …
- [[sav-formats.ts]]: SPSS print/write format codes. In a system file a format is packed into one int32 as (type << 16) | (width << 8) | decimals; in Socius it is…
- [[sav-reader.ts]]: SPSS system file (.sav / .zsav) reader. Implements the system file format as documented by GNU PSPP ("System File Format"): file header, var…
- [[sav-writer.ts]]: SPSS system file (.sav / .zsav) writer. Produces files that SPSS (16 and later), PSPP, R haven and pyreadstat open: UTF-8 text (subtype 20 +…
- [[xlsx.ts]]: Excel .xlsx import and export. Uses the "universal" builds of read-excel-file and write-excel-file, which take ArrayBuffer/Blob and run in t…
