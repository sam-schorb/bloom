// Import core utilities
import * as shapes from '@/lib/svg/shapes';
import { SVGShape } from '@/lib/svg/SVGShape';
import * as transforms from '@/lib/svg/transforms';
import { createSVGElement } from '@/lib/svg/utils';

const clearCanvas = canvas => {
  const defs = canvas.querySelector('defs');
  canvas.innerHTML = '';
  canvas.appendChild(defs);
};

const wrapCodeWithAutoAppend = code => {
  const cleanCode = code.trim().replace(/;?\s*$/, ';');
  return `
    const result = ${cleanCode}
    if (result instanceof SVGShape) {
      result.appendTo(canvas);
    }
    return result;
  `;
};

const createSandbox = (code, utilities) => {
  const wrappedCode = wrapCodeWithAutoAppend(code);
  return new Function(...Object.keys(utilities), 'canvas', wrappedCode);
};

export const runCode = ({ code, canvas, onError }) => {
  // Combine all utilities that should be available in the sandbox
  const utilities = {
    // Core utilities
    createSVGElement,
    SVGShape,
    ...shapes,
    ...transforms,
  };

  try {
    clearCanvas(canvas);
    const sandbox = createSandbox(code, utilities);
    sandbox(...Object.values(utilities), canvas);
    return { success: true };
  } catch (err) {
    onError?.(err.message);
    return { success: false, error: err.message };
  }
};
