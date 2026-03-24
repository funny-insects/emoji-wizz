# Task 4.0 Proofs — E2E Tests

## CLI Output

### E2E Test Suite

```
Running 12 tests using 7 workers

  ✓  e2e/app.spec.ts:3:1 › app renders a canvas element
  ✓  e2e/app.spec.ts:8:1 › app renders a preset selector dropdown
  ✓  e2e/canvas.spec.ts:7:1 › canvas renders with Slack preset dimensions
  ✓  e2e/canvas.spec.ts:15:1 › canvas renders non-empty pixel data (checkerboard is drawing)
  ✓  e2e/canvas.spec.ts:31:1 › switching to Apple preset with no image resizes canvas silently
  ✓  e2e/canvas.spec.ts:44:1 › switching preset after image upload shows confirm dialog and resizes canvas
  ✓  e2e/canvas.spec.ts:61:1 › canvas pixel data changes after file upload
  ✓  e2e/export.spec.ts:8:1 › Download button is disabled before image upload
  ✓  e2e/export.spec.ts:14:1 › Download button is enabled after image upload
  ✓  e2e/export.spec.ts:21:1 › clicking Download PNG triggers a file download with correct filename
  ✓  e2e/export.spec.ts:32:1 › clicking Download WebP triggers a file download with .webp extension
  ✓  e2e/export.spec.ts:44:1 › no size warning is shown after a normal download

  12 passed (2.2s)
```

## Files Created / Modified

- `e2e/export.spec.ts` — 5 new export E2E tests
- `e2e/app.spec.ts` — fixed strict-mode violation (`locator('select')` → `.first()`)
- `e2e/canvas.spec.ts` — fixed strict-mode violations (2 occurrences of `locator('select')` → `.first()`)

## Notes

Adding the ExportControls `<select>` introduced a second `<select>` in the DOM, breaking pre-existing tests that used the ambiguous `page.locator('select')` in strict mode. Fixed by using `.first()` to target the preset selector specifically.

## Verification

- All 5 new export tests pass
- All 7 pre-existing E2E tests continue to pass (12/12 total)
- No regressions in unit test suite (33/33 pass)
