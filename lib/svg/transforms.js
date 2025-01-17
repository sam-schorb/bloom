// @/lib/svg/Transforms.js

/**
 * Scales shape(s) by modifying their radius
 * @param {number} factor - Scale factor (1 = original size)
 * @returns {SVGShape}
 */
export function scale(group, factor = 1) {
  // Static cache for trig values
  const ANGLE_CACHE = new Map();
  const MAX_SIDES = 12; // Reasonable maximum for polygons
  const cosCache = new Float32Array(MAX_SIDES);
  const sinCache = new Float32Array(MAX_SIDES);

  const getPrecomputedTrig = sides => {
    if (!ANGLE_CACHE.has(sides)) {
      // Compute both sin and cos at once
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides + Math.PI / 2 - Math.PI / sides;
        cosCache[i] = Math.cos(angle);
        sinCache[i] = Math.sin(angle);
      }
      ANGLE_CACHE.set(sides, [
        cosCache.slice(0, sides),
        sinCache.slice(0, sides),
      ]);
    }
    return ANGLE_CACHE.get(sides);
  };

  // String buffer for building points string
  const parts = [];

  const scalers = {
    circle(shape) {
      const cx = shape.cx.baseVal.value;
      const cy = shape.cy.baseVal.value;
      shape.r.baseVal.value *= factor;
    },
    polygon(shape) {
      const points = shape.points;

      // Calculate center point of the polygon
      let centerX = 0,
        centerY = 0;
      for (let i = 0; i < points.length; i++) {
        centerX += points[i].x;
        centerY += points[i].y;
      }
      centerX /= points.length;
      centerY /= points.length;

      const x = points[0].x - centerX;
      const y = points[0].y - centerY;
      const newRadius = Math.sqrt(x * x + y * y) * factor;

      const sides = points.length;
      const [cosValues, sinValues] = getPrecomputedTrig(sides);

      // Reuse array and build string only once
      parts.length = 0;
      for (let i = 0; i < sides; i++) {
        parts[i] =
          centerX +
          newRadius * cosValues[i] +
          ',' +
          (centerY + newRadius * sinValues[i]);
      }

      shape.setAttribute('points', parts.join(' '));
    },
  };

  const children = group.children;
  for (let i = 0; i < children.length; i++) {
    const scaler = scalers[children[i].tagName];
    if (scaler) scaler(children[i]);
  }
}
