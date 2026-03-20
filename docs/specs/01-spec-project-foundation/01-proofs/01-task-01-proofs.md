# 01-task-01-proofs: Project Scaffold & Dev Server

## CLI Output

### npm install
```
added 1 package, and audited 70 packages in 328ms
9 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
```

### npm run dev
```
> emoji-wizz@0.1.0 dev
> vite

  VITE v6.4.1  ready in 462 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### curl localhost:5173
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Emoji Wizz</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## File Verification

### .nvmrc
```
22
```

### .gitignore
Contains patterns for: node_modules, dist, .env files, IDE artifacts (.vscode, .idea), OS files (.DS_Store), Vite artifacts, testing output (coverage, test-results, playwright-report).

## Configuration

### Directory Structure
```
src/
  components/.gitkeep
  hooks/.gitkeep
  services/.gitkeep
  utils/.gitkeep
  assets/.gitkeep
  App.tsx          # Placeholder page: "Emoji Wizz" + tagline
  App.css
  index.css
  main.tsx
  vite-env.d.ts
```

## Verification

- Dev server starts on localhost:5173 without errors
- HTML page is served with correct `<title>Emoji Wizz</title>`
- npm install completes with 0 vulnerabilities
- .nvmrc contains `22`
- .gitignore covers Node, Vite, IDE, and environment files
- DynamoDB removed from specoverview.md tech stack
- README.md updated with setup instructions and no database references
