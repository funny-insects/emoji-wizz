# Task 1.0 Proof Artifacts — Configure Code Coverage Locally

## CLI Output

`task test:coverage` ran successfully and printed a full coverage table to the terminal.

```
task: [test:coverage] npx vitest run --coverage

 RUN  v4.1.0 /Users/anmol/emoji-wizz
      Coverage enabled with v8

 Test Files  18 passed (18)
       Tests  138 passed (138)
    Start at  16:42:16
    Duration  5.68s

% Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   61.64 |    55.43 |   51.11 |   63.46 |
 src               |   27.66 |     3.65 |   12.82 |    28.2 |
  App.tsx          |   27.66 |     3.65 |   12.82 |    28.2 | ...82-384,474-475
 src/components    |   61.58 |    64.21 |    59.8 |    64.3 |
  EmojiCanvas.tsx  |   59.73 |    59.56 |   49.09 |   62.64 | ...09,722-895,921
  Toolbar.tsx      |   63.63 |    72.97 |   57.14 |   61.11 | ...89,123,200-219
 src/hooks         |   66.66 |    38.46 |   61.11 |   68.04 |
  useImageImport.ts|   14.63 |        0 |    12.5 |   16.21 | ...29,35-40,44-53
 src/utils         |   89.56 |     84.5 |   71.42 |   91.58 |
  exportUtils.ts   |   66.17 |    55.55 |      40 |   71.42 | 85-111
-------------------|---------|----------|---------|---------|-------------------
```

## Generated File

`coverage/coverage-summary.json` was created at `./coverage/coverage-summary.json` after the run, confirming the `json-summary` reporter is working and the file is available for the CI comment step.

```
$ ls coverage/
coverage-summary.json
```

## Configuration Changes

### vitest.config.ts

Added `coverage` block inside the `test` object:

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary"],
  reportsDirectory: "./coverage",
},
```

### Taskfile.yml

Added new `test:coverage` task:

```yaml
test:coverage:
  desc: Run Vitest unit tests with coverage
  cmds:
    - npx vitest run --coverage
```

## Verification

- `task test:coverage` exits with code 0 — all 138 tests pass with coverage enabled
- `coverage/coverage-summary.json` exists and contains per-file totals readable by `actions/github-script` in Task 2.0
- `coverage/` is already listed in `.gitignore` — the directory will not be committed
