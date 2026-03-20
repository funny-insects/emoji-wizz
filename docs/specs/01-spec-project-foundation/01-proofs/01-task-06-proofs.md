# Task 6.0 Proof Artifacts — Deployment Scaffold (Dockerfile + App Runner)

## Files

### `Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config to listen on port 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen\s*\[::\]:80;/listen [::]:8080;/g' /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### `.dockerignore`

```
node_modules
dist
.git
.husky
.github
e2e
playwright-report
test-results
*.md
.env*
.prettierrc
.prettierignore
eslint.config.js
Taskfile.yml
vitest.config.ts
playwright.config.ts
tsconfig*.json
docs
```

### `apprunner.yaml`

```yaml
version: 1.0
runtime: nodejs22

build:
  commands:
    build:
      - npm ci
      - npm run build

run:
  command: npx serve -s dist -l 8080
  network:
    port: 8080
    env: APP_PORT
  env:
    - name: NODE_ENV
      value: production
  healthcheck:
    path: /
    interval: 10
    timeout: 5
    healthy_threshold: 1
    unhealthy_threshold: 5
```

## CLI Output

### `docker build -t emoji-wizz .`

```
#14 [builder 6/6] RUN npm run build
> emoji-wizz@0.1.0 build
> tsc -b && vite build
✓ built in 1.12s
DONE

IMAGE               ID             DISK USAGE   CONTENT SIZE
emoji-wizz:latest   f27cd58a4fe9       92.1MB         25.9MB
```

### `docker run -p 8080:8080 emoji-wizz` + content check

```bash
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
200

$ curl -s http://localhost:8080 | grep -o "Emoji Wizz"
Emoji Wizz
```

## Verification

| Proof Artifact                                       | Status |
| ---------------------------------------------------- | ------ |
| `Dockerfile` exists with multi-stage build           | ✅     |
| Stage 1: Node 22 alpine → `npm ci` + `npm run build` | ✅     |
| Stage 2: nginx alpine → serves `dist/` on port 8080  | ✅     |
| `.dockerignore` excludes node_modules, .git, dist    | ✅     |
| `apprunner.yaml` with port 8080 + health check       | ✅     |
| `docker build -t emoji-wizz .` succeeds (92MB image) | ✅     |
| `docker run -p 8080:8080` → HTTP 200 + "Emoji Wizz"  | ✅     |
