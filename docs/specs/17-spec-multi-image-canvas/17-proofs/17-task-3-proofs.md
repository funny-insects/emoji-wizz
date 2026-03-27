# 17 Task 3.0 Proofs — Layer Panel

## Functionality Demonstrated

- `LayerPanel` renders a thumbnail (`<canvas>` 32×32) + filename label per item
- Items displayed in **reverse array order** (last item = top z-order = first row)
- Drag-to-reorder: HTML5 drag events (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) — no external DnD library
- `onReorder` callback called with the new items array (re-reversed from display order)
- `onSelectImage` called when a row is clicked
- Active row gets `.layer-row--active` CSS class (blue highlight via `var(--accent-dim)` and `var(--accent)` border)
- Panel only visible in Multi-Image mode (conditional render in `App.tsx`)
- Reorder calls `multiImage.reorderItems(newOrder)` + `multiImage.pushHistory()` — layer order is part of the undo/redo history

---

## CLI Output — All Quality Gates

```
task lint     → exit 0
task typecheck → exit 0
task test

 Test Files  23 passed (23)
       Tests  182 passed (182)
```

## Test Coverage (`LayerPanel.test.tsx`)

| Test | Result |
|------|--------|
| Shows "No images yet" when empty | ✓ |
| Renders one row per item | ✓ |
| Displays items in reverse order (top z-order first) | ✓ |
| Applies `.layer-row--active` to selected item | ✓ |
| Calls `onSelectImage` with correct id on click | ✓ |
| Calls `onReorder` with correct new order on drag | ✓ |
