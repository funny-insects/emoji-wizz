export function removeBackground(
  imageData: ImageData,
  tolerance: number,
): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // Sample the four corner pixels and compute average RGB background color
  const corners: [number, number][] = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let totalR = 0,
    totalG = 0,
    totalB = 0;
  for (const [cx, cy] of corners) {
    const i = (cy * width + cx) * 4;
    totalR += data[i]!;
    totalG += data[i + 1]!;
    totalB += data[i + 2]!;
  }
  const bgR = totalR / 4;
  const bgG = totalG / 4;
  const bgB = totalB / 4;

  // BFS flood-fill from the four corners
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  for (const [cx, cy] of corners) {
    const idx = cy * width + cx;
    if (!visited[idx]) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const idx = queue[head++]!;
    const x = idx % width;
    const y = Math.floor(idx / width);
    const i = idx * 4;

    const dr = data[i]! - bgR;
    const dg = data[i + 1]! - bgG;
    const db = data[i + 2]! - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    if (dist <= tolerance) {
      output[i + 3] = 0;

      const neighbors: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  return new ImageData(output, width, height);
}
