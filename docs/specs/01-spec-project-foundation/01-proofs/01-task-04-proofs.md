# Task 4.0 Proof Artifacts — Pre-commit Hooks (Husky + lint-staged)

## CLI Output

### Dirty commit blocked by pre-commit hook

A file with two unused variables was staged and committed. The hook intercepted and blocked it:

```
[STARTED] Running tasks for staged files...
[STARTED] eslint --max-warnings=0
[FAILED] eslint --max-warnings=0 [FAILED]
[STARTED] Reverting to original state because of errors...
[COMPLETED] Reverting to original state because of errors...

✖ eslint --max-warnings=0:

/Users/nico/Dev/LEB-C6/emoji-wizz/src/lint-error-test.tsx
  1:7  error  'x' is assigned a value but never used  @typescript-eslint/no-unused-vars
  2:7  error  'y' is assigned a value but never used  @typescript-eslint/no-unused-vars

✖ 2 problems (2 errors, 0 warnings)
husky - pre-commit script failed (code 1)
EXIT: 1
```

### Clean commit succeeds

```
[STARTED] Running tasks for staged files...
[STARTED] prettier --write
[COMPLETED] prettier --write
[COMPLETED] Running tasks for staged files...
[STARTED] Applying modifications from tasks...
[COMPLETED] Applying modifications from tasks...
[main 347c136] test: verify clean commit passes pre-commit hook
 2 files changed, 14 insertions(+), 1 deletion(-)
EXIT: 0
```

## Configuration

### `.husky/pre-commit`

```sh
npx lint-staged
```

### `lint-staged` config in `package.json`

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --max-warnings=0",
    "prettier --write"
  ],
  "*.{js,json,css,md}": [
    "prettier --write"
  ]
}
```

## Verification

| Proof Artifact                                      | Status |
| --------------------------------------------------- | ------ |
| `.husky/pre-commit` exists                          | ✅     |
| lint-staged config in `package.json`                | ✅     |
| Dirty commit (unused vars) blocked with exit code 1 | ✅     |
| Clean commit succeeds with exit code 0              | ✅     |
