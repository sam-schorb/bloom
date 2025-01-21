// app/lib/svg/utils.js

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export function setupCanvas(canvas) {
  canvas.setAttribute('width', CANVAS_WIDTH.toString());
  canvas.setAttribute('height', CANVAS_HEIGHT.toString());
  canvas.appendChild(createSVGElement('defs'));
}

export function createSVGElement(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, val);
  }
  return el;
}

export const toRGBA = args => {
  const [r = 0, g = 0, b = 0, a = 1] =
    args.length === 1 ? [args[0], 0, 0, 1] : args;

  const rgb = [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
  const alpha = Math.max(0, Math.min(1, Number(a)));

  return `rgba(${rgb.join(', ')}, ${alpha})`;
};
