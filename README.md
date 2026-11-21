# csv-reader-speed-01 — fast broken-CSV reader

![bounty](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)
![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/Sipalingtesnet/csv-reader-speed-01-run-20261121-entry/rank.svg)
![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/Sipalingtesnet/csv-reader-speed-01-run-20261121-entry/reward.svg)

Entry for the make.fun bounty [Read broken CSV files faster](https://make.fun/bounty/csv-reader-speed-01-run-20261121).

`solve.js` is a dependency-free ES module whose `run(input)` returns exactly
csv-reader 1.0.0's answer (`{columns, rows, errors}`) for every input —
including its broken-row policy: stray CRs, quote junk, unterminated quotes,
short/long rows — while running several times faster. It uses a clean-line
fast path (indexOf-driven field splitting with `slice()`) for the common
single-line record and an indexOf-driven general path for quoted or broken
records, so no character is ever appended one at a time.

`main.ts` is the harness driver: it reads every case from
`/input/cases.json`, answers each with `run`, and writes
`/output/answers.json`.

Verified locally: practice set 6/6 identical to the reference answers, fresh
generator draws 18/18 identical, and roughly 4–5x faster than the house
baseline on the practice set.
