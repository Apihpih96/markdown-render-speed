# Render speed baseline

Recorded 2026-11-17 with `node bench/bench.js --json --e2e 10`; raw numbers in [`bench/baseline.json`](bench/baseline.json).

| Metric | Median | Min | p90 / Max |
| --- | --- | --- | --- |
| `parse()` over the whole corpus, in process (30 runs, 5 warmup) | **960 ms** (5.37 MB/s) | 932 ms | 1087 / 1160 ms |
| `node main.ts` end to end, wall clock (10 runs) | **1406 ms** | 1297 ms | max 1589 ms |

- **Corpus:** 2000 generated cases, 5.16 MB of Markdown (seed 24301, corpus sha `3823b57343500259`), covering headings, setext headings, paragraphs with emphasis/links/reference links/images/autolinks/entities/inline HTML, tight/loose/ordered/task lists with nesting, blockquotes, fenced and indented code, tables, thematic breaks and HTML blocks.
- **Output sha:** `0ae7087916ae4591`. If this changes, the rendered HTML changed, not just the speed.
- **Machine:** Intel Xeon Processor (2 vCPU), 8 GB RAM, Linux 6.8.0-1060-aws x64.
- **Node:** v22.23.5 (V8 12.4.254.21). Node v24.22.2 on the same box measured 938 ms median for `parse()` and 1491 ms for `main.ts`, with the same output sha.

## Rerun

```sh
node bench/bench.js                 # in-process parse() timing, human-readable
node bench/bench.js --e2e 10        # also time 10 full `node main.ts` runs on the same corpus
node bench/bench.js --json --e2e 10 # same numbers as bench/baseline.json
node bench/bench.js --write-cases /tmp/md   # write the corpus to /tmp/md/cases.json
```

Options: `--runs N` (default 30), `--warmup N` (default 5), `--seed N`, `--count N`.

## Comparing a change

Run the same command on the same machine and Node version as the baseline and compare the median `parse()` time. On this 2 vCPU VM, back-to-back runs of unchanged code differed by about 5% (955 vs 1005 ms medians), so treat a median change under about 10% as noise; rerun a few times before trusting a smaller difference. Check that the corpus sha matches; the output sha should only change when a change is meant to alter the rendered HTML.
