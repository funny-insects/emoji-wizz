# Task 1.0 Proofs: Replace Yours/Reference previews with Dark/Light background previews

## CSS Changes

Added `.emoji-frame-dark` (background: #1a1a1a) and `.emoji-frame-light` (background: #ffffff) classes in `src/App.css`.

## Component Changes

- Removed `referenceEmojiSrc` prop from `OptimizerPanelProps` interface
- Both preview figures now render `customEmojiDataUrl` with Dark/Light labels
- First figure uses `emoji-frame emoji-frame-dark`, second uses `emoji-frame emoji-frame-light`

## Test Results

```
 Test Files  17 passed (17)
      Tests  134 passed (134)
```

New test added: "renders two images with the same src on dark and light backgrounds" - verifies both `<img>` elements share the same `customEmojiDataUrl` src.

## CLI Output

```
$ task lint
task: [lint] npx eslint src/

$ task typecheck
task: [typecheck] npx tsc --noEmit

$ task test
 Test Files  17 passed (17)
      Tests  134 passed (134)
```

## Verification

- Lint: clean
- Typecheck: clean
- Tests: all 134 passing (including new dark/light preview test)
