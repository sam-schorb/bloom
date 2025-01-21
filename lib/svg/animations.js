// @/lib/svg/animations.js
import { parseAndInterpret } from '@/lib/parser/handler';
import { CANVAS_HEIGHT, CANVAS_WIDTH, createSVGElement } from './utils';

// @/lib/svg/animations.js
export const createAnimation = (
  type,
  to, // Keep this for translate type checks
  duration,
  timeMultiplier,
  expression
) => {
  const animate = createSVGElement('animateTransform');
  console.log('\n=== Creating Animation ===');
  console.log('Input Expression:', expression);

  const parsedResult = parseAndInterpret(expression);
  console.log('\nParsed Result:', JSON.stringify(parsedResult, null, 2));

  // Split the values and normalize them based on transform type
  const values = parsedResult.values.split(';').map(Number);

  // Apply appropriate normalization based on transform type
  let normalizedValues;
  switch (type) {
    case 'rotate':
      normalizedValues = values.map(v => v * 360).join(';');
      break;
    case 'scale':
      normalizedValues = parsedResult.values;
      break;
    case 'translate':
      if (to.includes(', 0')) {
        normalizedValues = values.map(v => `${v * CANVAS_WIDTH}, 0`).join(';');
      } else if (to.includes('0, ')) {
        normalizedValues = values.map(v => `0, ${v * CANVAS_HEIGHT}`).join(';');
      }
      break;
    default:
      normalizedValues = parsedResult.values;
  }

  const attributes = {
    attributeName: 'transform',
    type,
    repeatCount: 'indefinite',
    additive: 'sum',
    dur: `${duration * timeMultiplier}s`,
    values: normalizedValues,
    keyTimes: parsedResult.keyTimes,
    calcMode: parsedResult.calcMode,
    ...(parsedResult.keySplines && { keySplines: parsedResult.keySplines }),
  };

  console.log('\nFinal Animation Attributes:');
  Object.entries(attributes).forEach(([key, value]) => {
    console.log(`${key.padEnd(15)}: ${value}`);
  });

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      animate.setAttribute(key, value);
    }
  });

  animate.dataset.baseDuration = duration;
  return animate;
};
