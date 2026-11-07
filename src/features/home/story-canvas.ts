/** The densest a canvas of the story is drawn at: a sharper screen costs pixels no one sees. */
const PIXEL_RATIO_LIMIT = 2;

/**
 * Sizes a canvas of the story to its box at the screen's density, up to the limit, and lets its pen
 * draw in CSS pixels. Returns the box.
 */
export function fitCanvas(canvas: HTMLCanvasElement, pen: CanvasRenderingContext2D) {
  const ratio = Math.min(window.devicePixelRatio, PIXEL_RATIO_LIMIT);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  pen.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { width, height };
}
