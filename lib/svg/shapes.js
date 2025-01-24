// @/lib/svg/shapes.js

import { SVGShape } from './SVGShape';
import { CANVAS_WIDTH, createSVGElement } from './utils';

function calculateRadius(size) {
  return (CANVAS_WIDTH * size) / 8;
}

export function circle(size = 1) {
  const radius = calculateRadius(size);
  const circle = createSVGElement('circle', {
    cx: 0,
    cy: 0,
    r: radius,
    fill: 'blue',
  });

  return new SVGShape(circle);
}

export function polygon(sides = 3, size = 1) {
  if (sides < 2 || sides > 20) {
    throw new Error('Polygon must have between 2 and 20 sides');
  }
  const radius = calculateRadius(size);

  // Rotate so the midpoint of the first side is at -π/2
  const angleOffset = Math.PI / 2 + Math.PI / sides;

  const points = Array.from({ length: sides }, (_, i) => {
    const angle = i * ((2 * Math.PI) / sides) + angleOffset;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  return new SVGShape(
    createSVGElement('polygon', {
      points,
      fill: 'blue',
    })
  );
}
