// app/lib/svg/Shapes.js

import { SVGShape } from './SVGShape';
import { center, createSVGElement } from './utils';

export function circle(radius) {
  const circle = createSVGElement('circle', {
    cx: center.x,
    cy: center.y,
    r: radius,
    fill: 'blue',
  });
  return new SVGShape(circle);
}

export function polygon(sides = 6, radius) {
  if (sides < 2 || sides > 20) {
    throw new Error('Polygon must have between 2 and 20 sides');
  }

  const points = Array.from({ length: sides }, (_, i) => {
    const angle = (i * 2 * Math.PI) / sides + Math.PI / 2 - Math.PI / sides;
    return `${center.x + radius * Math.cos(angle)},${
      center.y + radius * Math.sin(angle)
    }`;
  }).join(' ');

  return new SVGShape(createSVGElement('polygon', { points, fill: 'blue' }));
}
