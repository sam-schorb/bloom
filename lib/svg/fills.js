// @/lib/svg/fills.js
import { toRGBA } from './utils';

// Normalizers for different fill properties
const normalizers = {
  fill: {
    single: value => (Array.isArray(value) ? toRGBA(value) : value),
    array: values =>
      values.map(v => (Array.isArray(v) ? toRGBA(v) : v)).join(';'),
  },
  'fill-opacity': {
    single: value => Math.max(0, Math.min(1, value)),
    array: values => values.map(v => Math.max(0, Math.min(1, v))).join(';'),
  },
  'fill-rule': {
    single: value =>
      ['nonzero', 'evenodd'].includes(value) ? value : 'nonzero',
    array: values =>
      values
        .map(v => (['nonzero', 'evenodd'].includes(v) ? v : 'nonzero'))
        .join(';'),
  },
};

function createFillTransformer(type) {
  return {
    type: 'style', // Generic type for non-transform animations
    attributeName: type,
    normalize: value => normalizers[type].single(value),
    normalizeArray: values => normalizers[type].array(values),
  };
}

export const fills = {
  colour: createFillTransformer('fill'),
  opacity: createFillTransformer('fill-opacity'),
  fillRule: createFillTransformer('fill-rule'),
};

// Direct style application (no animation)
export function applyFill(element, type, value) {
  const normalized = normalizers[type].single(value);
  Array.from(element.children).forEach(child =>
    child.setAttribute(type, normalized)
  );
  return element;
}
