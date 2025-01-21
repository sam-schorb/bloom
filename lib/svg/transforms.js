// @/lib/svg/transforms.js
import { createAnimation } from './animations';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './utils';

function createTransformer(type, normalizer) {
  return {
    type,
    normalize: normalizer,
    transform: (value, duration, timeMultiplier) => {
      if (duration) {
        return createAnimation(
          type,
          normalizer(value),
          duration,
          timeMultiplier,
          value
        );
      }

      const normalizedValue = normalizer(value);
      return `${type}(${normalizedValue})`;
    },
  };
}

export const transforms = {
  scale: createTransformer('scale', x => x),
  rotate: createTransformer('rotate', value => value * 360),
  moveX: createTransformer('translate', x => `${x * CANVAS_WIDTH}, 0`),
  moveY: createTransformer('translate', y => `0, ${y * CANVAS_HEIGHT}`),
};

export function applyTransformStack(element, transforms) {
  const combinedTransform = transforms.join(' ');
  element.setAttribute('transform', combinedTransform);
  return element;
}
