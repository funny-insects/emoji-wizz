# 01-task-02-proofs: Code Quality Tooling (ESLint + Prettier + Taskfile)

## CLI Output

### task lint

```
task: [lint] npx eslint src/
```

Exit code: 0 (clean)

### task typecheck

```
task: [typecheck] npx tsc --noEmit
```

Exit code: 0 (clean)

### task format

```
task: [format] npx prettier --write .
.prettierrc 3ms (unchanged)
eslint.config.js 4ms (unchanged)
index.html 1ms (unchanged)
package.json 1ms (unchanged)
src/App.css 9ms (unchanged)
src/App.tsx 18ms (unchanged)
src/index.css 1ms
src/main.tsx 2ms (unchanged)
src/vite-env.d.ts 1ms (unchanged)
Taskfile.yml 3ms (unchanged)
vite.config.ts 1ms (unchanged)
```

Exit code: 0 (clean)

## Configuration

### ESLint (eslint.config.js)

- Flat config format (ESLint 9)
- Extends: `@eslint/js` recommended + `typescript-eslint` recommended
- Plugins: `react-hooks`, `react-refresh`
- `eslint-config-prettier` appended to disable conflicting formatting rules
- Ignores: `dist/`

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2
}
```

### Taskfile (Taskfile.yml)

- `task lint` → `npx eslint src/`
- `task format` → `npx prettier --write .`
- `task format:check` → `npx prettier --check .`
- `task typecheck` → `npx tsc --noEmit`
- `task test` → `npx vitest run` (wired, tested in task 3.0)
- `task test:e2e` → `npx playwright test` (wired, tested in task 3.0)

## Verification

- `task lint` exits 0 on clean source code
- `task typecheck` exits 0 with no type errors
- `task format` runs Prettier across project, all files formatted
- ESLint and Prettier do not conflict (eslint-config-prettier disables overlapping rules)
