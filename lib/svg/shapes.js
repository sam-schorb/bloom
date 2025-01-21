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
  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI) / sides;
    return `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`;
  }).join(' ');

  return new SVGShape(createSVGElement('polygon', { points, fill: 'blue' }));
}
