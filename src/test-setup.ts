import "@testing-library/jest-dom";

// Konva requires a canvas 2D context; jsdom doesn't implement it by default.
// Use a Proxy that returns no-ops for most methods, but returns real values for
// methods Konva inspects (getImageData → data array, createLinearGradient → object).
const mockCanvasContext = new Proxy(
  {
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => null,
    canvas: { width: 0, height: 0 },
  },
  {
    get: (target, prop) =>
      prop in target ? target[prop as keyof typeof target] : () => {},
  },
) as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = () => mockCanvasContext;
