import * as animations from '@/lib/svg/animations';
import * as shapes from '@/lib/svg/shapes';
import { SVGShape } from '@/lib/svg/SVGShape';
import { createSVGElement } from '@/lib/svg/utils';

const clearCanvas = canvas => {
  const defs = canvas.querySelector('defs');
  canvas.innerHTML = '';
  if (defs) {
    canvas.appendChild(defs);
  }
};

// Helper function to find matching closing parenthesis
const findClosingParen = (str, start) => {
  let count = 1;
  let i = start;

  while (count > 0 && i < str.length) {
    if (str[i] === '(') count++;
    if (str[i] === ')') count--;
    i++;
  }

  return i - 1;
};

// Convert animation method calls to template literals
const processCode = code => {
  let result = '';
  let i = 0;

  while (i < code.length) {
    // Look for animation method calls
    const methodMatch = /\.(scale|rotate|moveX|moveY|colour)\s*\(/.exec(
      code.slice(i)
    );

    if (!methodMatch) {
      result += code.slice(i);
      break;
    }

    // Add everything up to the method call
    const methodStart = i + methodMatch.index;
    result += code.slice(i, methodStart);

    // Find the end of the arguments
    const argsStart = methodStart + methodMatch[0].length;
    const argsEnd = findClosingParen(code, argsStart);

    // Get the arguments
    const args = code.slice(argsStart, argsEnd);

    // Split on commas that aren't within parentheses
    let depth = 0;
    let splitPoints = [];
    for (let j = 0; j < args.length; j++) {
      if (args[j] === '(') depth++;
      if (args[j] === ')') depth--;
      if (args[j] === ',' && depth === 0) splitPoints.push(j);
    }

    // Handle the arguments
    if (splitPoints.length === 0) {
      // Single argument
      result += `${methodMatch[0]}\`${args.trim()}\`)`;
    } else {
      // Multiple arguments - only wrap the first one
      const firstArg = args.slice(0, splitPoints[0]).trim();
      const restArgs = args.slice(splitPoints[0] + 1).trim();
      result += `${methodMatch[0]}\`${firstArg}\`, ${restArgs})`;
    }

    i = argsEnd + 1;
  }

  return result;
};

const createSandbox = (code, utilities) => {
  const wrappedCode = wrapCodeWithAutoAppend(code);
  return new Function(...Object.keys(utilities), 'canvas', wrappedCode);
};

// Split code into blocks
const splitCodeIntoBlocks = code => {
  return code
    .trim()
    .split(/\n\s*\n/)
    .filter(block => block.trim().length > 0)
    .map(block => block.trim());
};

// Enhanced wrapCodeWithAutoAppend - no changes needed yet
const wrapCodeWithAutoAppend = code => {
  const processedCode = processCode(code);
  console.log('Processed code:', processedCode);
  return `
    const result = ${processedCode}
    if (result instanceof SVGShape) {
      result.appendTo(canvas);
    }
    return result;
  `;
};

// Enhanced runCode function
export const runCode = ({ code, canvas, onError }) => {
  const utilities = {
    createSVGElement,
    SVGShape,
    ...shapes,
    ...animations,
  };

  try {
    clearCanvas(canvas);
    const codeBlocks = splitCodeIntoBlocks(code);

    // Track errors for each block
    const errors = [];

    // Process each block
    codeBlocks.forEach((block, index) => {
      try {
        const sandbox = createSandbox(block, utilities);
        sandbox(...Object.values(utilities), canvas);
      } catch (err) {
        const blockError = {
          blockNumber: index + 1,
          code: block,
          error: err.message,
        };
        errors.push(blockError);
        onError?.(`Block ${index + 1}: ${err.message}`);
        console.log('Block error', blockError);
      }
    });

    // Return success only if no blocks had errors
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    // Handle any errors that occur outside of block processing
    const error = {
      error: err.message,
      code: code,
    };
    onError?.(err.message);
    console.log('General error', error);
    return { success: false, error };
  }
};
