import "@testing-library/jest-dom";

// ImageData is not available in jsdom without the optional `canvas` package.
// Provide a minimal polyfill so utility tests can construct pixel arrays.
if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  }
  globalThis.ImageData = ImageDataPolyfill as unknown as typeof ImageData;
}

// Konva requires a canvas 2D context; jsdom doesn't implement it by default.
// Use a Proxy that returns no-ops for most methods, but returns real values for
// methods Konva inspects (getImageData → data array, createLinearGradient → object,
// measureText → object with width, used by Konva.Text).
const mockCanvasContext = new Proxy(
  {
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => null,
    measureText: () => ({ width: 0 }),
    canvas: { width: 0, height: 0 },
  },
  {
    get: (target, prop) =>
      prop in target ? target[prop as keyof typeof target] : () => {},
  },
) as unknown as CanvasRenderingContext2D;

HTMLCanvasElement.prototype.getContext = (() =>
  mockCanvasContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;
