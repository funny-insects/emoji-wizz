# 01-spec-project-foundation

## Introduction/Overview

Emoji Wizz is an internal tool for creating custom Slack emojis that look great at small sizes with proper transparent backgrounds. Before any features can be built, the project needs a solid foundation: a scaffolded React + TypeScript app, code quality tooling, testing infrastructure, CI pipeline, and deployment scaffold. This spec covers all of that so the team can start feature work on a stable, well-tooled codebase.

## Goals

- Scaffold a Vite + React + TypeScript project with a working dev server and placeholder UI
- Establish code quality tooling (ESLint, Prettier, Taskfile) with consistent, enforced standards
- Set up testing infrastructure (Vitest for unit tests, Playwright for e2e tests)
- Configure pre-commit hooks (Husky + lint-staged) that catch issues before they reach CI
- Create a GitHub Actions CI pipeline that runs lint, typecheck, and tests on every PR
- Provide a Dockerfile and App Runner configuration so the app is deployable from day one
- Remove DynamoDB from the tech stack documentation (no longer used)

## User Stories

- **As a developer**, I want to clone the repo and run a single command to start the dev server so that I can begin feature work immediately.
- **As a developer**, I want linting and formatting to run automatically on commit so that code style stays consistent without manual effort.
- **As a developer**, I want a CI pipeline that catches type errors, lint violations, and test failures on PRs so that the main branch stays healthy.
- **As a developer**, I want Taskfile commands (`task lint`, `task test`, `task typecheck`) so that I have a single, consistent interface for all quality checks.
- **As a developer**, I want a Dockerfile and deployment config so that the app can be deployed to AWS App Runner without additional setup work.

## Demoable Units of Work

### Unit 1: Project Scaffold & Dev Server

**Purpose:** Establish the base React + TypeScript application so developers can clone, install, and run a dev server immediately.

**Functional Requirements:**

- The project shall be scaffolded with Vite, React 19, and TypeScript targeting Node 22 LTS
- The project shall use npm as the package manager with a lock file committed to the repo
- The source code shall follow a layer-based directory structure: `src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/assets/`
- The dev server shall start with `npm run dev` and display a placeholder page
- A `.gitignore` shall be configured for Node.js, Vite, and IDE artifacts
- An `.nvmrc` file shall pin Node 22

**Proof Artifacts:**

- Screenshot: Browser showing the placeholder page at `localhost:5173` demonstrates the dev server works
- CLI: `npm run dev` starts without errors demonstrates the scaffold is functional

### Unit 2: Code Quality Tooling (ESLint + Prettier + Taskfile)

**Purpose:** Enforce consistent code quality and formatting across the codebase with a unified task runner interface.

**Functional Requirements:**

- ESLint shall be configured with TypeScript and React rules
- Prettier shall be configured as the code formatter with an `.prettierrc` config
- ESLint and Prettier shall not conflict (use `eslint-config-prettier`)
- A `Taskfile.yml` shall define tasks: `lint`, `format`, `typecheck`
- `task lint` shall run ESLint on the `src/` directory
- `task format` shall run Prettier on the project
- `task typecheck` shall run `tsc --noEmit`
- All Taskfile commands shall exit with non-zero codes on failure

**Proof Artifacts:**

- CLI: `task lint` runs successfully on clean code demonstrates linting works
- CLI: `task typecheck` runs successfully demonstrates type checking works
- CLI: `task format` runs successfully demonstrates formatting works

### Unit 3: Testing Infrastructure (Vitest + Playwright)

**Purpose:** Provide unit and e2e testing frameworks so feature specs can include testable requirements from the start.

**Functional Requirements:**

- Vitest shall be configured for unit testing with React Testing Library
- Playwright shall be configured for e2e testing
- A sample unit test shall exist and pass (e.g., placeholder component renders)
- A sample e2e test shall exist and pass (e.g., placeholder page loads)
- `task test` shall run Vitest unit tests
- `task test:e2e` shall run Playwright e2e tests
- Test configuration files shall be committed to the repo

**Proof Artifacts:**

- CLI: `task test` passes with sample unit test demonstrates unit testing works
- CLI: `task test:e2e` passes with sample e2e test demonstrates e2e testing works

### Unit 4: Pre-commit Hooks (Husky + lint-staged)

**Purpose:** Catch code quality issues before they reach the remote repository by running checks on staged files at commit time.

**Functional Requirements:**

- Husky shall be installed and configured with a pre-commit hook
- lint-staged shall run ESLint and Prettier on staged `.ts` and `.tsx` files
- lint-staged shall run `tsc --noEmit` for type checking
- A commit with a lint error shall be blocked by the pre-commit hook
- The hook setup shall be automatic via `npm install` (Husky `prepare` script)

**Proof Artifacts:**

- CLI: A commit with a lint error is blocked demonstrates pre-commit hooks work
- CLI: A clean commit succeeds demonstrates hooks don't block valid code

### Unit 5: CI Pipeline (GitHub Actions)

**Purpose:** Automate quality checks on every pull request so the main branch stays healthy.

**Functional Requirements:**

- A GitHub Actions workflow shall trigger on pull requests to `main`
- The workflow shall run on Node 22
- The workflow shall run `task lint`, `task typecheck`, and `task test` as separate steps
- The workflow shall fail if any step fails
- GitHub secret scanning shall be enabled for the repository

**Proof Artifacts:**

- Screenshot: GitHub Actions workflow passing on a PR demonstrates CI works end-to-end
- CLI: Workflow YAML is valid (no syntax errors) demonstrates correct configuration

### Unit 6: Deployment Scaffold (Dockerfile + App Runner)

**Purpose:** Make the application deployable to AWS App Runner from day one so deployment is never an afterthought.

**Functional Requirements:**

- A multi-stage Dockerfile shall build the Vite production bundle and serve it with a lightweight server (e.g., nginx or serve)
- The Docker image shall build successfully with `docker build`
- An App Runner configuration file shall define the service settings (port, health check, build command)
- The containerized app shall be accessible on the configured port
- The Dockerfile shall target Node 22 as the build stage base image

**Proof Artifacts:**

- CLI: `docker build -t emoji-wizz .` succeeds demonstrates the image builds
- CLI: `docker run -p 8080:8080 emoji-wizz` serves the app demonstrates the container runs
- File: `apprunner.yaml` exists with valid configuration demonstrates App Runner readiness

## Non-Goals (Out of Scope)

1. **Feature implementation**: No canvas, editor, overlays, or AI functionality — only the foundation
2. **Database setup**: DynamoDB has been removed from the tech stack entirely
3. **Authentication / authorization**: The app is internal-only with no login (per spec overview)
4. **Custom domain or HTTPS configuration**: Deployment scaffold only; DNS and TLS are ops concerns
5. **Production deployment**: The scaffold proves deployability but does not deploy to a live environment

## Design Considerations

No specific design requirements identified for the foundation spec. The placeholder page should display the app name ("Emoji Wizz") so it's clear the app is running.

## Repository Standards

This is a greenfield project, so this spec **establishes** the repository standards:

- **Language**: TypeScript (strict mode)
- **Framework**: React 19 + Vite
- **Package manager**: npm
- **Node version**: 22 LTS (pinned in `.nvmrc`)
- **Linting**: ESLint with TypeScript + React plugins
- **Formatting**: Prettier
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Task runner**: Taskfile (`task lint`, `task test`, `task typecheck`, `task format`, `task test:e2e`)
- **Pre-commit**: Husky + lint-staged
- **CI**: GitHub Actions
- **Directory structure**: Layer-based (`src/components/`, `src/hooks/`, `src/services/`, `src/utils/`, `src/assets/`)

## Technical Considerations

- **Taskfile** requires [Task](https://taskfile.dev/) to be installed on the developer's machine. The README should document this prerequisite.
- **Playwright** requires browser binaries installed via `npx playwright install`. This should be documented and included in CI setup.
- **App Runner configuration** uses `apprunner.yaml` in the project root. The service expects the app to be served on port 8080.
- **ESLint + Prettier integration** requires `eslint-config-prettier` to disable formatting rules in ESLint that conflict with Prettier.

## Security Considerations

- GitHub secret scanning shall be enabled to catch accidentally committed credentials
- The `.gitignore` shall exclude `.env` files to prevent credential leaks
- No API keys or tokens are required for this foundation spec
- Proof artifacts should not contain any sensitive data

## Success Metrics

1. **Developer onboarding**: A new developer can go from `git clone` to running dev server in under 5 minutes
2. **All Taskfile commands pass**: `task lint`, `task typecheck`, `task test`, `task format`, `task test:e2e` all exit cleanly
3. **Pre-commit hooks enforce quality**: A deliberately bad commit is blocked
4. **CI pipeline passes**: GitHub Actions workflow completes successfully on a test PR
5. **Docker image builds and runs**: The containerized app serves the placeholder page

## Open Questions

1. Should the App Runner config include auto-scaling settings, or use defaults for now?
2. What nginx/serve configuration should be used for the production container (caching headers, gzip, etc.)?
