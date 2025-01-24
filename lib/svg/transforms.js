// @/lib/svg/transforms.js
import { CANVAS_CENTER_X, CANVAS_CENTER_Y } from './utils';

// @/lib/svg/transforms.js
function createTransformer(type, axis = null) {
  return {
    type,
    attributeName: 'transform',
    normalize: value => normalizers[type].single(value, axis),
    normalizeArray: values => normalizers[type].array(values, axis),
  };
}

export const transforms = {
  scale: createTransformer('scale'),
  rotate: createTransformer('rotate'),
  moveX: createTransformer('translate', 'x'),
  moveY: createTransformer('translate', 'y'),
  skewX: createTransformer('skewX'),
  skewY: createTransformer('skewY'),
};

export function applyTransformStack(element, transforms) {
  // Define transform order priority (lower number = applied first)
  const transformOrder = {
    translate: 1,
    rotate: 2,
    skewX: 3,
    skewY: 3,
    scale: 4,
  };

  // Sort transforms based on their type
  const sortedTransforms = [...transforms].sort((a, b) => {
    const typeA = a.split('(')[0];
    const typeB = b.split('(')[0];
    return transformOrder[typeA] - transformOrder[typeB];
  });

  // Join the sorted transforms with spaces
  const combinedTransform = sortedTransforms.join(' ');
  element.setAttribute('transform', combinedTransform);
  return element;
}

export const normalizers = {
  scale: {
    single: x => x,
    array: values => values.join(';'),
  },
  rotate: {
    single: value => value * 360,
    array: values => values.map(v => v * 360).join(';'),
  },
  translate: {
    single: (value, axis) =>
      axis === 'x'
        ? `${value * CANVAS_CENTER_X}, 0`
        : `0, ${value * CANVAS_CENTER_Y}`,
    array: (values, axis) =>
      values
        .map(v =>
          axis === 'x'
            ? `${v * CANVAS_CENTER_X}, 0`
            : `0, ${v * CANVAS_CENTER_Y}`
        )
        .join(';'),
  },
  skewX: {
    single: value => value * 90,
    array: values => values.map(v => v * 90).join(';'),
  },
  skewY: {
    single: value => value * 90,
    array: values => values.map(v => v * 90).join(';'),
  },
};
