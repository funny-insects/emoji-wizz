# Task 2.0 Proof Artifacts — ExportControls Component

## Test Results

```
RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

 Test Files  8 passed (8)
      Tests  33 passed (33)
   Start at  16:45:45
   Duration  584ms
```

All 33 tests pass (includes 6 new ExportControls tests + regression on all existing tests).

## TypeCheck & Lint

```
npx tsc --noEmit
(no output — no type errors)

npx eslint src/components/ExportControls.tsx src/components/ExportControls.test.tsx src/App.tsx
(no output — no lint errors)
```

## Test Coverage — ExportControls

| Test                                                                           | Status |
| ------------------------------------------------------------------------------ | ------ |
| Download button is `disabled` when `image` is null                             | ✅     |
| Download button is not `disabled` when `image` is HTMLImageElement             | ✅     |
| `onDownload` called with `'png'` when PNG selected and Download clicked        | ✅     |
| `onDownload` called with `'webp'` after switching format and clicking Download | ✅     |
| Warning `<p>` not rendered when `sizeWarning` is null                          | ✅     |
| Warning `<p>` rendered with text when `sizeWarning` is non-null                | ✅     |

## Files Created/Modified

- `src/components/ExportControls.tsx` — format select, Download button, sizeWarning display
- `src/components/ExportControls.test.tsx` — 6 unit tests
- `src/App.tsx` — imports and mounts ExportControls below EmojiCanvas (placeholder props)
- `src/App.test.tsx` — updated `getByRole → getAllByRole` to handle two comboboxes
