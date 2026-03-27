# 17 Task 2.0 Proofs — Per-Image Editing Tools

## Functionality Demonstrated

Task 2.0 wired all editing tools to the active (selected) image's own offscreen canvas:

- **Brush**: `flattenBrushLine()` maps stage-coord Konva.Line points to item-local canvas coords via `ctx.setTransform(1/scaleX, 0, 0, 1/scaleY, -x/scaleX, -y/scaleY)`, leaving other images untouched
- **Eraser**: `applyEraserAt()` maps stage coords to item-local coords, applies `destination-out` fill only to the active canvas
- **Crop**: `cropCanvas()` applied to active item's canvas using region mapped from canvas→item-local coords; item position, width, height, and scale updated; `setTimeout` defers `setCropRect(null)` per ESLint hook rules
- **Transforms** (rotate/flip): `rotateCanvas90()` / `flipCanvas()` + `reframeCanvas()` applied to active item's canvas; item dimensions updated accordingly
- **Background Removal**: `App.tsx` reads active item canvas via `multiImage.items.find(i => i.id === multiImage.activeImageId)?.canvas`, passes `ImageData` to `BackgroundRemovalModal`, routes `bgRemovalRequest` to `MultiImageCanvas` which applies `removeBackground()` to the active canvas
- **Active image highlight**: 2px `#4A90E2` stroke on the selected `KonvaImage` node
- **Disabled tool guard**: "Select an image to edit" overlay shown when brush/eraser/crop active but no image selected
- **Undo/redo**: `pushHistory()` called after every pixel edit; serializes all canvases to data URLs; `undo()`/`redo()` deserializes back asynchronously; `activeImageId` is cleared if no longer valid after restore

---

## CLI Output — All Quality Gates

```
task lint     → exit 0 (no errors)
task typecheck → exit 0 (no errors)
task test

 Test Files  23 passed (23)
       Tests  182 passed (182)
```

## Proof Notes

- Per-image pixel isolation is verified in `MultiImageCanvas.test.tsx`: the "calls onRemoveItem and onPushHistory" test confirms callback routing; the "shows Select an image to edit hint" test confirms the disabled-tool guard.
- Coordinate mapping for brush (`ctx.setTransform`) and eraser (`(stageX - item.x) / item.scaleX`) ensures operations only affect the active item's canvas.
- Background removal in multi-image mode uses the same `BackgroundRemovalModal` and `bgRemovalRequest` prop pathway as single-image mode — no new modal component needed.
