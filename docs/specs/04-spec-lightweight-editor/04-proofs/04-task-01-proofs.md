# Task 1.0 Proof Artifacts — Toolbar Sidebar & Undo/Redo Infrastructure

## CLI Output

### TypeScript Typecheck

```
$ npx tsc --noEmit
(no output — zero errors)
```

### ESLint

```
$ npx eslint src/ --max-warnings=0
(no output — zero warnings, zero errors)
```

### Unit Tests

```
$ npx vitest run

 RUN  v4.1.0 /Users/stephendumore/emoji-wizz

 Test Files  7 passed (7)
      Tests  33 passed (33)
   Start at  18:06:08
   Duration  1.31s
```

All 33 tests pass across 7 test files, including the 9 new `useHistory` tests and 6 new `Toolbar` tests.

---

## New Test Files

### src/hooks/useHistory.test.ts — 9 tests passing

| Test                                              | Status |
| ------------------------------------------------- | ------ |
| starts with canUndo=false and canRedo=false       | ✅     |
| pushState with a single item does not enable undo | ✅     |
| pushState with two items enables undo             | ✅     |
| undo returns the previous snapshot                | ✅     |
| undo when empty returns null                      | ✅     |
| undo when only one item in stack returns null     | ✅     |
| redo returns null when redo stack is empty        | ✅     |
| redo restores the undone snapshot                 | ✅     |
| pushState after undo clears the redo stack        | ✅     |
| clear resets both stacks and disables undo/redo   | ✅     |

### src/components/Toolbar.test.tsx — 6 tests passing

| Test                                                                   | Status |
| ---------------------------------------------------------------------- | ------ |
| renders all 5 buttons when image is provided                           | ✅     |
| does not render when image is null                                     | ✅     |
| calls onToolChange with the correct tool when a tool button is clicked | ✅     |
| active tool button has the active CSS class                            | ✅     |
| undo button is disabled when canUndo is false                          | ✅     |
| redo button is disabled when canRedo is false                          | ✅     |

---

## New Files Created

| File                              | Purpose                                                           |
| --------------------------------- | ----------------------------------------------------------------- |
| `src/hooks/useHistory.ts`         | Undo/redo stack hook with push, undo, redo, clear                 |
| `src/hooks/useHistory.test.ts`    | Unit tests for history hook                                       |
| `src/components/Toolbar.tsx`      | Vertical toolbar sidebar with Eraser/Brush/Text/Undo/Redo buttons |
| `src/components/Toolbar.css`      | Toolbar styles with active state, disabled state                  |
| `src/components/Toolbar.test.tsx` | Unit tests for toolbar rendering and interaction                  |

## Modified Files

| File                             | Change                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                    | Added `EditorTool` type, `activeTool` state, `useHistory` hook, keyboard shortcuts (Cmd+Z / Cmd+Shift+Z), `Toolbar` component in flex layout |
| `src/App.css`                    | Added `.editor-area` flex row layout                                                                                                         |
| `src/components/EmojiCanvas.tsx` | Added optional `activeTool` and `onToolChange` props to interface                                                                            |

---

## Architecture Notes

- `EditorTool = "eraser" | "brush" | "text"` exported from `App.tsx`
- `useHistory` stores snapshots in a ref-backed undo stack; `canUndo`/`canRedo` are React state for re-render triggers
- `undo()` requires ≥2 items to be actionable — the bottom item is always the baseline state
- `Toolbar` renders `null` when `image` prop is falsy (hidden when no image loaded)
- Keyboard listener is added/removed via `useEffect` cleanup in `App.tsx`
