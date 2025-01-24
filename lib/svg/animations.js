// @/lib/svg/animations.js
import { parseAndInterpret } from '@/lib/parser/handler';
import { createSVGElement } from './utils';

export const createAnimation = (
  transformType,
  duration,
  timeMultiplier,
  expression
) => {
  const animate = createSVGElement(
    transformType.attributeName === 'transform' ? 'animateTransform' : 'animate'
  );

  const parsedResult = parseAndInterpret(expression);

  // Handle both numeric and color values
  const values =
    transformType.attributeName === 'fill'
      ? parsedResult.values // Keep as string for colors
      : parsedResult.values.split(';').map(Number); // Convert to numbers for transforms

  // Only normalize if it's not a fill animation
  const normalizedValues =
    transformType.attributeName === 'fill'
      ? values // Pass through color values
      : transformType.normalizeArray(values); // Normalize numeric values

  const attributes = {
    attributeName: transformType.attributeName,
    ...(transformType.attributeName === 'transform' && {
      type: transformType.type,
    }),
    repeatCount: 'indefinite',
    ...(transformType.attributeName === 'transform' && { additive: 'sum' }),
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
