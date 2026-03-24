# Task 3.0 Proofs — Download Pipeline & File Size Warning

## CLI Output

### Test Suite

```
RUN  v4.1.0 /Users/nico/Dev/LEB-C6/emoji-wizz

Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package
Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package
Not implemented: HTMLCanvasElement's getContext() method: without installing the canvas npm package

 Test Files  8 passed (8)
       Tests  33 passed (33)
    Start at  16:57:29
    Duration  606ms (transform 194ms, setup 301ms, import 290ms, tests 232ms, environment 2.67s)
```

### Lint

```
task: [lint] npx eslint src/
(no errors)
```

### Typecheck

```
task: [typecheck] npx tsc --noEmit
(no errors)
```

## Implementation Summary

All changes are in `src/App.tsx`:

### 3.1 — `sizeWarning` state

```ts
const [sizeWarning, setSizeWarning] = useState<string | null>(null);
```

### 3.2 & 3.3 — `handleDownload` function

```ts
function handleDownload(format: ExportFormat) {
  if (!image) return;
  const canvas = buildExportCanvas(image, activePreset);
  const mimeMap: Record<ExportFormat, string> = {
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  canvas.toBlob((blob) => {
    if (!blob) {
      setSizeWarning(
        "Export failed: this format is not supported by your browser.",
      );
      return;
    }
    setSizeWarning(checkFileSizeWarning(blob.size, activePreset));
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = buildFilename(format);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  }, mimeMap[format]);
}
```

### 3.4 & 3.5 — Props wired up

```tsx
<ExportControls
  image={image}
  preset={activePreset}
  onDownload={handleDownload}
  sizeWarning={sizeWarning}
/>
```

### 3.6 — sizeWarning reset on preset change

```ts
setActivePreset(preset);
setSizeWarning(null);
```

## Verification

- All 33 unit tests pass with no regressions
- `task lint` and `task typecheck` both pass with no errors
- `handleDownload` covers: null-image guard, toBlob null guard, size warning check, anchor-click download, URL cleanup
- `sizeWarning` is reset to `null` when the active preset changes
