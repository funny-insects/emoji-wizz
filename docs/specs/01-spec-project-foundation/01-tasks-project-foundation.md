# 01-tasks-project-foundation

## Relevant Files

- `package.json` - Project manifest with dependencies, scripts, and lint-staged config
- `tsconfig.json` - TypeScript compiler configuration (strict mode)
- `tsconfig.app.json` - TypeScript config for app source code
- `tsconfig.node.json` - TypeScript config for Node tooling (Vite config, etc.)
- `vite.config.ts` - Vite bundler configuration
- `vitest.config.ts` - Vitest unit test configuration
- `playwright.config.ts` - Playwright e2e test configuration
- `.nvmrc` - Pins Node 22 LTS
- `.gitignore` - Ignores node_modules, dist, .env, IDE files, Playwright results
- `.prettierrc` - Prettier formatting rules
- `.prettierignore` - Files Prettier should skip
- `eslint.config.js` - ESLint flat config with TypeScript + React rules
- `Taskfile.yml` - Task runner with lint, format, typecheck, test, test:e2e commands
- `Dockerfile` - Multi-stage build (Node 22 build → nginx serve)
- `apprunner.yaml` - AWS App Runner service configuration
- `.github/workflows/ci.yml` - GitHub Actions CI pipeline
- `.husky/pre-commit` - Pre-commit hook running lint-staged
- `index.html` - Vite HTML entry point
- `src/main.tsx` - React app entry point
- `src/App.tsx` - Placeholder App component
- `src/App.css` - App component styles
- `src/index.css` - Global styles
- `src/vite-env.d.ts` - Vite TypeScript declarations
- `src/components/.gitkeep` - Placeholder for components directory
- `src/hooks/.gitkeep` - Placeholder for hooks directory
- `src/services/.gitkeep` - Placeholder for services directory
- `src/utils/.gitkeep` - Placeholder for utils directory
- `src/assets/.gitkeep` - Placeholder for assets directory
- `src/App.test.tsx` - Sample unit test for App component
- `e2e/app.spec.ts` - Sample Playwright e2e test
- `README.md` - Updated to remove DynamoDB, add setup instructions
- `docs/specs/specoverview.md` - Updated to remove DynamoDB from tech stack

### Notes

- Unit tests should be placed alongside the code files they test (e.g., `src/App.tsx` and `src/App.test.tsx`).
- Use `npx vitest run` for unit tests, `npx playwright test` for e2e tests.
- Follow layer-based directory structure: `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/assets/`.
- Taskfile requires [Task](https://taskfile.dev/) to be installed on the developer's machine.
- Playwright requires browser binaries via `npx playwright install`.

## Tasks

### [x] 1.0 Project Scaffold & Dev Server

Set up the Vite + React + TypeScript project, establish directory structure, configure npm, and get a placeholder page running on the dev server. Also clean up documentation to remove DynamoDB references and update the spec overview.

#### 1.0 Proof Artifact(s)

- Screenshot: Browser showing the Emoji Wizz placeholder page at `localhost:5173` demonstrates the dev server works
- CLI: `npm run dev` starts without errors demonstrates the scaffold is functional
- CLI: `npm install` completes without errors demonstrates dependencies are correct
- File: `.nvmrc` contains `22` demonstrates Node version is pinned
- File: `.gitignore` exists with Node/Vite/IDE patterns demonstrates proper git hygiene

#### 1.0 Tasks

- [x] 1.1 Scaffold a new Vite + React + TypeScript project in the current directory using `npm create vite@latest`
- [x] 1.2 Create `.nvmrc` file containing `22` to pin Node version
- [x] 1.3 Create `.gitignore` with patterns for node_modules, dist, .env files, IDE artifacts, and Vite/Playwright output
- [x] 1.4 Create layer-based directory structure with `.gitkeep` files: `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/assets/`
- [x] 1.5 Update `src/App.tsx` to display an "Emoji Wizz" placeholder page (app name, brief tagline)
- [x] 1.6 Remove DynamoDB from `docs/specs/specoverview.md` tech stack table and update `README.md` to remove any database references and add basic setup instructions
- [x] 1.7 Verify `npm install` completes and `npm run dev` starts the dev server without errors

### [x] 2.0 Code Quality Tooling (ESLint + Prettier + Taskfile)

Configure ESLint with TypeScript and React rules, Prettier for formatting, and a Taskfile with unified commands for lint, format, and typecheck.

#### 2.0 Proof Artifact(s)

- CLI: `task lint` runs ESLint on `src/` and exits cleanly demonstrates linting works
- CLI: `task typecheck` runs `tsc --noEmit` and exits cleanly demonstrates type checking works
- CLI: `task format` runs Prettier and exits cleanly demonstrates formatting works
- CLI: `task lint` with a deliberately broken file returns non-zero exit code demonstrates lint catches errors

#### 2.0 Tasks

- [x] 2.1 Install ESLint with TypeScript and React plugins (`eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
- [x] 2.2 Configure `eslint.config.js` using flat config with TypeScript + React rules
- [x] 2.3 Install Prettier and create `.prettierrc` with formatting rules and `.prettierignore`
- [x] 2.4 Install `eslint-config-prettier` to disable ESLint rules that conflict with Prettier
- [x] 2.5 Install [Task](https://taskfile.dev/) runner and create `Taskfile.yml` with `lint`, `format`, and `typecheck` tasks
- [x] 2.6 Verify `task lint`, `task format`, and `task typecheck` all run and exit cleanly

### [x] 3.0 Testing Infrastructure (Vitest + Playwright)

Configure Vitest for unit testing with React Testing Library, Playwright for e2e testing, and add sample tests that pass. Wire both into the Taskfile.

#### 3.0 Proof Artifact(s)

- CLI: `task test` runs Vitest and sample unit test passes demonstrates unit testing works
- CLI: `task test:e2e` runs Playwright and sample e2e test passes demonstrates e2e testing works
- File: `vitest.config.ts` exists demonstrates unit test configuration
- File: `playwright.config.ts` exists demonstrates e2e test configuration

#### 3.0 Tasks

- [x] 3.1 Install Vitest and React Testing Library (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`)
- [x] 3.2 Create `vitest.config.ts` with jsdom environment and React plugin
- [x] 3.3 Create a sample unit test `src/App.test.tsx` that verifies the placeholder App component renders
- [x] 3.4 Install Playwright (`@playwright/test`) and run `npx playwright install` for browser binaries
- [x] 3.5 Create `playwright.config.ts` configured to start the dev server and test against it
- [x] 3.6 Create a sample e2e test `e2e/app.spec.ts` that verifies the placeholder page loads with expected content
- [x] 3.7 Add `test` and `test:e2e` tasks to `Taskfile.yml`
- [x] 3.8 Verify `task test` and `task test:e2e` both pass

### [x] 4.0 Pre-commit Hooks (Husky + lint-staged)

Install and configure Husky with a pre-commit hook that runs lint-staged. lint-staged runs ESLint, Prettier, and type checking on staged files. Verify that bad commits are blocked.

#### 4.0 Proof Artifact(s)

- CLI: A commit containing a lint error is blocked by the pre-commit hook demonstrates hooks catch issues
- CLI: A commit with clean code succeeds demonstrates hooks don't block valid work
- File: `.husky/pre-commit` exists demonstrates hook is installed

#### 4.0 Tasks

- [x] 4.1 Install Husky and lint-staged (`husky`, `lint-staged`)
- [x] 4.2 Add `"prepare": "husky"` script to `package.json` and run it to initialize Husky
- [x] 4.3 Configure lint-staged in `package.json` to run ESLint and Prettier on staged `.ts` and `.tsx` files
- [x] 4.4 Create `.husky/pre-commit` hook that runs `npx lint-staged`
- [x] 4.5 Verify a commit with a deliberate lint error is blocked, and a clean commit succeeds

### [ ] 5.0 CI Pipeline (GitHub Actions)

Create a GitHub Actions workflow that runs lint, typecheck, and unit tests on PRs to main. Ensure the workflow uses Node 22 and fails on any step failure.

#### 5.0 Proof Artifact(s)

- Screenshot: GitHub Actions workflow passing on a test PR demonstrates CI works end-to-end
- File: `.github/workflows/ci.yml` exists with valid syntax demonstrates correct configuration
- CLI: `act` or manual workflow trigger validates the pipeline runs (optional local validation)

#### 5.0 Tasks

- [ ] 5.1 Create `.github/workflows/` directory structure
- [ ] 5.2 Create `ci.yml` workflow triggered on pull requests to `main`
- [ ] 5.3 Configure the workflow with Node 22 setup, npm install, and Taskfile installation
- [ ] 5.4 Add steps for `task lint`, `task typecheck`, and `task test`
- [ ] 5.5 Document GitHub secret scanning enablement in the proof artifacts (Settings → Code security)

### [ ] 6.0 Deployment Scaffold (Dockerfile + App Runner)

Create a multi-stage Dockerfile that builds the Vite production bundle and serves it, plus an App Runner configuration file. Verify the image builds and the container serves the placeholder page.

#### 6.0 Proof Artifact(s)

- CLI: `docker build -t emoji-wizz .` succeeds demonstrates the image builds
- CLI: `docker run -p 8080:8080 emoji-wizz` serves the placeholder page demonstrates the container runs
- File: `apprunner.yaml` exists with valid configuration demonstrates App Runner readiness

#### 6.0 Tasks

- [ ] 6.1 Create a multi-stage `Dockerfile`: stage 1 uses Node 22 to `npm run build`, stage 2 uses nginx to serve the `dist/` output on port 8080
- [ ] 6.2 Create a `.dockerignore` to exclude node_modules, .git, and other unnecessary files
- [ ] 6.3 Create `apprunner.yaml` with service configuration (port 8080, health check path, build command)
- [ ] 6.4 Verify `docker build -t emoji-wizz .` succeeds
- [ ] 6.5 Verify `docker run -p 8080:8080 emoji-wizz` serves the placeholder page
