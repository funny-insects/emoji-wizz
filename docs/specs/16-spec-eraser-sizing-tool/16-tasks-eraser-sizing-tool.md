# 16-tasks-eraser-sizing-tool

## Relevant Files

- `src/App.tsx` — Holds all tool state; add `eraserSize` useState and pass it as a prop to both `<Toolbar>` and `<EmojiCanvas>`.
- `src/components/Toolbar.tsx` — Add `eraserSize`/`onEraserSizeChange` to `ToolbarProps`, destructure them in the function signature, and render the slider when `activeTool === "eraser"`.
- `src/components/Toolbar.css` — Add CSS rules for the eraser size slider container and input, mirroring the existing `.toolbar-brush-size` styles.
- `src/components/Toolbar.test.tsx` — Update `defaultTextProps` to include `eraserSize` and `onEraserSizeChange`; add a unit test for the eraser slider.
- `src/components/EmojiCanvas.tsx` — Add `eraserSize` to `EmojiCanvasProps`, remove the hardcoded `eraserRadius` formula, and use the prop in its place throughout.
- `e2e/eraser.spec.ts` — Add a Playwright test verifying a larger eraser size erases a larger canvas area than a smaller size.

### Notes

- Unit tests are colocated with source files (`Toolbar.test.tsx` sits alongside `Toolbar.tsx`).
- Run tests with `task test` (Vitest unit) and `task test:e2e` (Playwright).
- Pre-commit hooks enforce lint and formatting automatically — do not skip them.
- Follow the existing prop-drilling pattern: `App.tsx` → `Toolbar.tsx` (UI) and `App.tsx` → `EmojiCanvas.tsx` (canvas logic). No Context or Redux.

## Tasks

### [x] 1.0 Add eraserSize state and update prop interfaces

#### 1.0 Proof Artifact(s)

- CLI: `task typecheck` exits with no errors, demonstrating that the new state and updated prop interfaces are type-safe and accepted by the compiler.

#### 1.0 Tasks

- [x] 1.1 In `src/App.tsx`, add `const [eraserSize, setEraserSize] = useState<number>(12);` on the line after `const [brushSize, setBrushSize] = useState<number>(3);` (currently line 52). The value `12` matches the current hardcoded formula output for a 512px canvas (`Math.round((512 / 128) * 3)`).
- [x] 1.2 In `src/components/Toolbar.tsx`, add two new entries to the `ToolbarProps` interface (after `onBrushSizeChange`):
  ```
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  ```
- [x] 1.3 In `src/components/Toolbar.tsx`, add `eraserSize` and `onEraserSizeChange` to the destructured parameters of the `Toolbar` function (after `onBrushSizeChange`).
- [x] 1.4 In `src/components/EmojiCanvas.tsx`, add `eraserSize?: number;` to the `EmojiCanvasProps` interface (after `brushSize?: number;`).
- [x] 1.5 In `src/components/EmojiCanvas.tsx`, add `eraserSize = 12` to the destructured parameters of the `EmojiCanvas` function (after `brushSize`), using `12` as the default so behaviour is unchanged if the prop is omitted.
- [x] 1.6 Run `task typecheck` and confirm it exits with no errors.

---

### [x] 2.0 Add eraser size slider to Toolbar

#### 2.0 Proof Artifact(s)

- Visual inspection: Run `npm run dev`, upload an image, click the Eraser tool — a "Size" slider appears in the Toolbar. Switch to Brush, Pointer, or Text — the slider is not visible.

#### 2.0 Tasks

- [x] 2.1 In `src/components/Toolbar.tsx`, add the following block directly after the closing `)}` of the `activeTool === "brush"` block (after line 203):
  ```tsx
  {
    activeTool === "eraser" && (
      <div className="toolbar-eraser-size">
        <label className="toolbar-eraser-size-label" htmlFor="eraser-size">
          Size
        </label>
        <input
          id="eraser-size"
          type="range"
          className="toolbar-eraser-size-slider"
          value={eraserSize}
          min={1}
          max={100}
          onChange={(e) => onEraserSizeChange(Number(e.target.value))}
        />
      </div>
    );
  }
  ```
- [x] 2.2 In `src/components/Toolbar.css`, add CSS for the eraser size controls. Mirror the existing `.toolbar-brush-size` block (lines 103–131) and add:

  ```css
  .toolbar-eraser-size {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 4px 0;
  }

  .toolbar-eraser-size-label {
    font-size: 11px;
    color: var(--text-muted, #888);
  }

  .toolbar-eraser-size-slider {
    width: 80px;
    cursor: pointer;
  }
  ```

- [x] 2.3 In `src/App.tsx`, pass `eraserSize` and `onEraserSizeChange` to the `<Toolbar>` component (add the two lines after `onBrushSizeChange={setBrushSize}`):
  ```tsx
  eraserSize = { eraserSize };
  onEraserSizeChange = { setEraserSize };
  ```
- [x] 2.4 In `src/components/Toolbar.test.tsx`, add `eraserSize: 12` and `onEraserSizeChange: () => {}` to the `defaultTextProps` object so existing tests continue to compile and pass.
- [x] 2.5 In `src/components/Toolbar.test.tsx`, add a new test inside the existing `describe("Toolbar")` block that verifies the eraser size slider appears when `activeTool === "eraser"` and is absent for other tools:

  ```tsx
  it("renders eraser size slider when eraser tool is active", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="eraser"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        {...defaultTextProps}
      />,
    );
    expect(screen.getByRole("slider", { name: "Size" })).toBeInTheDocument();
  });

  it("does not render eraser size slider when brush tool is active", () => {
    render(
      <Toolbar
        image={mockImage}
        activeTool="brush"
        onToolChange={() => {}}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        {...defaultTextProps}
      />,
    );
    expect(
      screen.queryByRole("slider", { name: "Size" }),
    ).not.toBeInTheDocument();
  });
  ```

- [x] 2.6 Run `task test` and confirm all unit tests pass.

---

### [x] 3.0 Wire EmojiCanvas to use eraserSize prop

#### 3.0 Proof Artifact(s)

- Visual inspection: Run `npm run dev`, upload an image, activate the eraser, drag the Size slider — the circular cursor on the canvas visibly grows and shrinks. Erase at size 5, then erase at size 60; the second erased region is clearly larger.

#### 3.0 Tasks

- [x] 3.1 In `src/components/EmojiCanvas.tsx`, remove the hardcoded formula on line 168:
  ```ts
  const eraserRadius = Math.round((width / 128) * 3);
  ```
  The variable `eraserRadius` will no longer exist; subsequent steps rename all its usages to `eraserSize`.
- [x] 3.2 In `src/components/EmojiCanvas.tsx`, replace every remaining reference to `eraserRadius` with `eraserSize`. There are three locations:
  - The `ctx.arc(...)` call inside `applyEraserAt` (was line 257): change `eraserRadius` → `eraserSize`.
  - The `useCallback` dependency array (was line 261): change `eraserRadius` → `eraserSize`.
  - The Konva `<Circle radius={...}>` prop (was line 676): change `eraserRadius` → `eraserSize`.
- [x] 3.3 In `src/App.tsx`, pass `eraserSize={eraserSize}` to the `<EmojiCanvas>` component (add the line after `brushSize={brushSize}`).
- [x] 3.4 Run `task typecheck` and `task test` to confirm no type errors and all unit tests pass.

---

### [ ] 4.0 Add E2E test and verify all quality gates pass

#### 4.0 Proof Artifact(s)

- CLI: `task test:e2e` passes, including the new eraser-sizing test.
- CLI: `task lint` exits with no errors.
- CLI: `task typecheck` exits with no errors.
- CLI: `task test` (unit tests) exits with no errors.

#### 4.0 Tasks

- [ ] 4.1 In `e2e/eraser.spec.ts`, add a helper function below the existing `getImageLayerPixel` helper that counts the number of transparent pixels (alpha = 0) in a square region on the image layer canvas:
  ```ts
  async function countTransparentPixels(
    page: Parameters<typeof test>[1]["page"],
    x: number,
    y: number,
    size: number,
  ): Promise<number> {
    return page.evaluate(
      ([px, py, sz]: [number, number, number]) => {
        const canvases = document.querySelectorAll(".konvajs-content canvas");
        const el = canvases[1] as HTMLCanvasElement;
        const ctx = el.getContext("2d");
        if (!ctx) return 0;
        const data = ctx.getImageData(px, py, sz, sz).data;
        let count = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] === 0) count++;
        }
        return count;
      },
      [x, y, size] as [number, number, number],
    );
  }
  ```
- [ ] 4.2 In `e2e/eraser.spec.ts`, add a new test after the existing two tests:

  ```ts
  test("eraser size slider changes the size of the erased area", async ({
    page,
  }) => {
    await page.goto("/");

    const fixturePath = path.join(__dirname, "fixtures", "test-emoji.png");
    await page.locator('input[type="file"]').setInputFiles(fixturePath);

    await page.waitForFunction(() => {
      const canvases = document.querySelectorAll(".konvajs-content canvas");
      const el = canvases[1] as HTMLCanvasElement;
      const ctx = el.getContext("2d");
      if (!ctx) return false;
      return ctx
        .getImageData(0, 0, el.width, el.height)
        .data.some((v) => v !== 0);
    });

    await page.getByRole("button", { name: "Eraser" }).click();
    const stageBox = await page
      .locator(".konvajs-content")
      .first()
      .boundingBox();
    expect(stageBox).not.toBeNull();

    // --- Erase with a small eraser (size 5) ---
    await page.locator("#eraser-size").evaluate((el: HTMLInputElement) => {
      el.value = "5";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const smallX = stageBox!.x + 80;
    const smallY = stageBox!.y + 80;
    await page.mouse.move(smallX, smallY);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    const smallCount = await countTransparentPixels(page, 60, 60, 40);

    // --- Erase with a large eraser (size 60) ---
    await page.locator("#eraser-size").evaluate((el: HTMLInputElement) => {
      el.value = "60";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const largeX = stageBox!.x + 200;
    const largeY = stageBox!.y + 200;
    await page.mouse.move(largeX, largeY);
    await page.mouse.down();
    await page.mouse.up();
    await page.waitForTimeout(100);

    const largeCount = await countTransparentPixels(page, 140, 140, 120);

    expect(largeCount).toBeGreaterThan(smallCount);
  });
  ```

- [ ] 4.3 Run `task test:e2e` and confirm all three eraser tests pass.
- [ ] 4.4 Run `task lint` and confirm no errors.
- [ ] 4.5 Run `task typecheck` and confirm no errors.
- [ ] 4.6 Run `task test` and confirm all unit tests pass.
