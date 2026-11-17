// Render-speed benchmark for parse.js. Usage: node bench/bench.js [--runs N] [--warmup N] [--json]
// --write-cases DIR writes the corpus as DIR/cases.json; --e2e N also times N full `node main.ts` runs on it.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, totalmem, platform, arch, release, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCases, DEFAULT_SEED, DEFAULT_COUNT } from './corpus.js';
import { parse } from '../parse.js';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const runs = +opt('--runs', 30), warmup = +opt('--warmup', 5), seed = +opt('--seed', DEFAULT_SEED), count = +opt('--count', DEFAULT_COUNT);

const cases = buildCases(seed, count);
const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
const corpusJson = JSON.stringify(cases);
const e2eRuns = +opt('--e2e', 0);
const writeDir = opt('--write-cases') ?? (e2eRuns ? mkdtempSync(join(tmpdir(), 'md-bench-')) : null);
if (writeDir) { mkdirSync(writeDir, { recursive: true }); writeFileSync(join(writeDir, 'cases.json'), corpusJson); }

const renderAll = () => { const out = new Array(cases.length); for (let i = 0; i < cases.length; i++) out[i] = parse(cases[i].markdown); return out; };
const outputHash = sha(JSON.stringify(renderAll()));
for (let i = 0; i < warmup; i++) renderAll();

const times = [];
for (let i = 0; i < runs; i++) { const t = process.hrtime.bigint(); renderAll(); times.push(Number(process.hrtime.bigint() - t) / 1e6); }
times.sort((a, b) => a - b);
const q = p => times[Math.min(times.length - 1, Math.floor(p * times.length))];
const bytes = cases.reduce((s, c) => s + Buffer.byteLength(c.markdown), 0);
const median = q(0.5);

let e2e = null;
if (e2eRuns) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const env = { ...process.env, MAKEFUN_INPUT_DIR: writeDir, MAKEFUN_OUTPUT_DIR: writeDir };
  const wall = [];
  for (let i = 0; i < e2eRuns; i++) {
    const t = process.hrtime.bigint();
    const p = spawnSync(process.execPath, ['main.ts'], { cwd: root, env, stdio: 'inherit' });
    if (p.status !== 0) throw new Error(`node main.ts exited with ${p.status}`);
    wall.push(Number(process.hrtime.bigint() - t) / 1e6);
  }
  wall.sort((a, b) => a - b);
  if (sha(readFileSync(join(writeDir, 'html.json'), 'utf8')) !== outputHash) throw new Error('main.ts output differs from in-process render');
  e2e = { runs: e2eRuns, ms: { min: +wall[0].toFixed(2), median: +wall[Math.floor(wall.length / 2)].toFixed(2), max: +wall.at(-1).toFixed(2) } };
}

const result = {
  corpus: { seed, cases: count, bytes, sha256_16: sha(corpusJson) },
  output_sha256_16: outputHash,
  runs, warmup,
  ms: { min: +times[0].toFixed(2), median: +median.toFixed(2), p90: +q(0.9).toFixed(2), max: +times.at(-1).toFixed(2) },
  mb_per_s_median: +(bytes / 1e6 / (median / 1e3)).toFixed(2),
  e2e_main_ts: e2e,
  env: { node: process.version, v8: process.versions.v8, platform: `${platform()} ${release()} ${arch()}`, cpu: cpus()[0]?.model, cores: cpus().length, mem_gb: Math.round(totalmem() / 2 ** 30) },
};

if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`corpus   ${count} cases, ${(bytes / 1e6).toFixed(2)} MB (seed ${seed}, sha ${result.corpus.sha256_16})`);
  console.log(`output   sha ${outputHash}`);
  console.log(`render   median ${result.ms.median} ms  min ${result.ms.min}  p90 ${result.ms.p90}  max ${result.ms.max}  (${runs} runs, ${warmup} warmup)`);
  console.log(`speed    ${result.mb_per_s_median} MB/s (median)`);
  if (e2e) console.log(`main.ts  median ${e2e.ms.median} ms  min ${e2e.ms.min}  max ${e2e.ms.max}  (${e2e.runs} runs, wall clock incl. Node startup + JSON I/O)`);
  console.log(`env      Node ${process.version}, ${result.env.cpu} x${result.env.cores}, ${result.env.platform}`);
}
