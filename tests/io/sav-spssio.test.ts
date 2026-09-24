// Files written by Socius, read by IBM's SPSS I/O library (libspssdio from SPSS 20, bundled with the
// savReaderWriter Python package): the same code SPSS Statistics uses to open .sav files.
// Skipped with a reason when Python or savReaderWriter is not installed (e.g. in CI).
import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { writeSav, type SavCompression } from '../../src/lib/io/sav-writer';
import { edgeDataset } from './datasets';
import { expectSpssioMatches, HAS_ORACLE, PYTHON, ROOT, tempPath, type SpssioDump } from './helpers';

const SCRIPT = join(ROOT, 'scripts', 'fixtures', 'spssio_dump.py');
const HAS_SPSSIO = HAS_ORACLE && spawnSync(PYTHON, ['-c', 'import collections, collections.abc\nfor n in ("Iterable","Mapping","MutableMapping","Sequence","Callable"):\n  setattr(collections, n, getattr(collections.abc, n))\nimport savReaderWriter'], { encoding: 'utf-8' }).status === 0;

function spssioRead(bytes: Uint8Array, name: string): SpssioDump {
  const p = tempPath(name);
  writeFileSync(p, bytes);
  return JSON.parse(execFileSync(PYTHON, [SCRIPT, p], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }));
}

describe.skipIf(!HAS_SPSSIO)('IBM SPSS I/O library reads Socius files (needs /opt/oracle/bin/python + savReaderWriter; skipped when absent)', () => {
  const modes: SavCompression[] = ['none', 'bytecode', 'zsav'];
  for (const compression of modes) {
    for (const bigEndian of [false, true]) {
      it(`edge-case dataset, compression=${compression}, ${bigEndian ? 'big' : 'little'}-endian`, () => {
        const ds = edgeDataset();
        const { bytes } = writeSav(ds, { compression, bigEndian });
        const o = spssioRead(bytes, `spssio_${compression}_${bigEndian ? 'be' : 'le'}.${compression === 'zsav' ? 'zsav' : 'sav'}`);
        expectSpssioMatches(ds, o);
      });
    }
  }
});
