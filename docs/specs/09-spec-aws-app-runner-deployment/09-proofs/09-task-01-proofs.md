# Task 1.0 Proof Artifacts — Fix Dockerfile for SPA Routing & Remove apprunner.yaml

## CLI Output: Docker Build

```
$ docker build -t emoji-wizz .

#12 [builder 6/6] RUN npm run build
#12 > emoji-wizz@0.1.0 build
#12 > tsc -b && vite build
#12 vite v6.4.1 building for production...
#12 ✓ 143 modules transformed.
#12 dist/index.html                   0.40 kB │ gzip:   0.27 kB
#12 dist/assets/index-e-zkMfoh.css    9.03 kB │ gzip:   2.10 kB
#12 dist/assets/index-D6zl2KD7.js   558.24 kB │ gzip: 178.90 kB
#12 ✓ built in 1.62s

#13 [runner 2/3] COPY --from=builder /app/dist /usr/share/nginx/html  DONE
#14 [runner 3/3] COPY nginx.conf /etc/nginx/conf.d/default.conf  DONE
#15 naming to docker.io/library/emoji-wizz  done
```

Build completes successfully — demonstrates multi-stage build works.

## CLI Output: SPA Routing Verification

```
$ docker run -d -p 8080:8080 --name emoji-wizz-test emoji-wizz
44a1bbd8434864c45d30c7a08204038dd2bf9b492d4f0223f9a7a4adc5e465ef

$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
200

$ curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/some/deep/route
200
```

Both root (`/`) and deep routes (`/some/deep/route`) return HTTP 200 — demonstrates SPA routing fallback works via `try_files $uri $uri/ /index.html`.

## File Changes: apprunner.yaml Removed

`apprunner.yaml` was deleted from the repository root. `git status` confirms it is removed:

```
$ git status
deleted: apprunner.yaml
new file: nginx.conf
modified: Dockerfile
```

Demonstrates cleanup of unused source-based App Runner config.

## nginx.conf Content

```nginx
server {
    listen 8080;
    listen [::]:8080;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Listens on port 8080 (required for App Runner), serves SPA with `try_files` fallback.

## Dockerfile Stage 2 (Updated)

```dockerfile
# Stage 2: Serve
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

Replaced `sed` commands with `COPY nginx.conf` — cleaner and includes SPA routing.

## Test Results

```
Test Files  16 passed (16)
      Tests  110 passed (110)
   Duration  2.41s
```

All 110 tests pass. Also fixed pre-existing TypeScript errors from the merged background
removal feature that blocked the Docker build (`noUncheckedIndexedAccess` violations in
`removeBackground.ts`, `detectContentBounds.ts`, `EmojiCanvas.test.tsx`, `EmojiCanvas.tsx`,
`App.tsx`, and `test-setup.ts`).
