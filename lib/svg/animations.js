// @/lib/svg/animations.js
import { parseAndInterpret } from '@/lib/parser/handler';
import { createSVGElement } from './utils';

export const createAnimation = (
  transformType,
  duration,
  timeMultiplier,
  expression
) => {
  const animate = createSVGElement('animateTransform');

  const parsedResult = parseAndInterpret(expression);
  const values = parsedResult.values.split(';').map(Number);
  const normalizedValues = transformType.normalizeArray(values);

  const attributes = {
    attributeName: transformType.attributeName,
    type: transformType.type,
    repeatCount: 'indefinite',
    additive: 'sum',
    dur: `${duration * timeMultiplier}s`,
    values: normalizedValues,
    keyTimes: parsedResult.keyTimes,
    calcMode: parsedResult.calcMode,
    ...(parsedResult.keySplines && { keySplines: parsedResult.keySplines }),
  };

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      animate.setAttribute(key, value);
    }
  });

  animate.dataset.baseDuration = duration;
  return animate;
};
