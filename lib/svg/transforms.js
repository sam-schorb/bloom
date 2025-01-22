// @/lib/svg/transforms.js
import { normalizers } from './utils';

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
};

export function applyTransformStack(element, transforms) {
  const combinedTransform = transforms.join(' ');
  element.setAttribute('transform', combinedTransform);
  return element;
}
