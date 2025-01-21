// @/lib/parser/interpreter.js

/**
 * This file contains:
 * 1) ASTEvaluator: The low-level logic that walks the AST and returns raw numeric/array results
 * 2) Helper methods to determine additional info about the expression (e.g. mode, keyTimes, etc.)
 * 3) A function interpretAST(ast) that returns a rich object similar to your old result format
 */

class ASTEvaluator {
  constructor() {
    // Example patterns
    this.patterns = {
      sin: [0, 1, 0],
      tri: [0, 1, 0],
      saw: [0, 1],
    };
  }

  evaluateNode(node) {
    if (!node) return null;

    switch (node.type) {
      case 'NumericLiteral':
        return node.value;
      case 'Pattern':
        return this.patterns[node.name];
      case 'StaticList':
      case 'DynamicList':
      case 'ListGroup':
        return this.evaluateList(node);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node);
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  evaluateList(node) {
    // Flatten nested lists
    return node.elements
      .map(element => {
        const result = this.evaluateNode(element);
        return Array.isArray(result) ? result.flat() : result;
      })
      .flat();
  }

  evaluateBinaryExpression(node) {
    const left = this.evaluateNode(node.left);
    const right = this.evaluateNode(node.right);

    // Applies +, -, *, / to numbers or arrays (broadcasting rules)
    const applyOp = (a, b, op) => {
      if (Array.isArray(a) && !Array.isArray(b)) {
        return a.map(val => applyOp(val, b, op));
      }
      if (!Array.isArray(a) && Array.isArray(b)) {
        return b.map(val => applyOp(a, val, op));
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        // Wrap-around for the shorter array
        return a.map((val, i) => applyOp(val, b[i % b.length], op));
      }

      switch (op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        default:
          throw new Error(`Unknown operator: ${op}`);
      }
    };

    return applyOp(left, right, node.operator);
  }
}

/**
 * Additional logic to replicate the "ResultProcessor" style
 */
class ExpressionAnalyzer {
  /**
   * Return the first pattern name found in the AST (sin, tri, saw)
   */
  findPatternName(ast) {
    if (!ast) return null;
    if (ast.type === 'Pattern') {
      return ast.name;
    }
    if (ast.type === 'BinaryExpression') {
      const leftPattern = this.findPatternName(ast.left);
      if (leftPattern) return leftPattern;
      return this.findPatternName(ast.right);
    }
    return null;
  }

  /**
   * Return a rough "mode" describing the expression type
   * (StaticList, DynamicList, NumericValue, Identifier, etc.)
   */
  determineExpressionMode(ast, evaluatedResult) {
    if (!ast) return 'Unknown';

    // If it's a direct pattern
    if (ast.type === 'Pattern') {
      return 'Identifier';
    }

    // If it's a top-level list
    if (ast.type === 'StaticList') return 'StaticList';
    if (ast.type === 'DynamicList') return 'DynamicList';

    // A group of lists
    if (ast.type === 'ListGroup') {
      // We know from validation all elements are the same type
      const firstType = ast.elements[0].type;
      return firstType === 'StaticList' ? 'StaticList' : 'DynamicList';
    }

    // Binary expression might produce numeric or list
    if (ast.type === 'BinaryExpression') {
      // Evaluate subtrees
      const leftType = this.determineExpressionMode(ast.left, null);
      const rightType = this.determineExpressionMode(ast.right, null);

      // If either side is a known list type, assume that's the "mode"
      if (leftType === 'StaticList' || rightType === 'StaticList') {
        return 'StaticList';
      }
      if (leftType === 'DynamicList' || rightType === 'DynamicList') {
        return 'DynamicList';
      }
      if (leftType === 'Identifier' || rightType === 'Identifier') {
        return 'Identifier';
      }

      // If everything else is numeric
      // (e.g., (2 + 3)), call it numeric
      if (typeof evaluatedResult === 'number') {
        return 'NumericValue';
      }
    }

    // Numeric literal
    if (ast.type === 'NumericLiteral' || typeof evaluatedResult === 'number') {
      return 'NumericValue';
    }

    return 'Unknown';
  }

  /**
   * For lists (Static/Dynamic/ListGroup), create a set of "keyTimes" in [0..1].
   * This is a simplified example that splits the total range by number of elements.
   */
  calculateKeyTimes(ast) {
    const keyTimes = [];

    // Recursively walk the list structure
    const processNode = (node, start = 0, duration = 1) => {
      if (!node) return;

      if (node.type === 'NumericLiteral') {
        keyTimes.push(start);
      } else if (
        node.type === 'StaticList' ||
        node.type === 'DynamicList' ||
        node.type === 'ListGroup'
      ) {
        const elements =
          node.type === 'ListGroup' ? node.elements : node.elements;
        const elementCount = elements.length || 1;
        const subDuration = duration / elementCount;

        elements.forEach((element, index) => {
          processNode(element, start + index * subDuration, subDuration);
        });
      }
    };

    // Find the top-most list so we can generate times
    const outermostList = this.findOutermostList(ast);
    if (outermostList) {
      processNode(outermostList);
    }

    return keyTimes;
  }

  /**
   * Identify the highest-level list (StaticList, DynamicList, or ListGroup)
   */
  findOutermostList(node) {
    if (!node) return null;
    if (
      node.type === 'StaticList' ||
      node.type === 'DynamicList' ||
      node.type === 'ListGroup'
    ) {
      return node;
    }
    if (node.type === 'BinaryExpression') {
      const leftList = this.findOutermostList(node.left);
      if (leftList) return leftList;
      return this.findOutermostList(node.right);
    }
    return null;
  }

  /**
   * Format the final numeric/array result
   */
  formatResult(value) {
    if (Array.isArray(value)) {
      return `[${value
        .map(v => (typeof v === 'number' ? v.toFixed(4) : String(v)))
        .join(', ')}]`;
    }
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  }

  /**
   * Format a raw array or number for "values" attribute
   */
  formatValues(value, expressionMode) {
    if (expressionMode === 'NumericValue') {
      // For NumericValue, create a saw-like pattern scaled by the value
      return [0, value].map(v => v.toFixed(4)).join(';');
    }
    if (Array.isArray(value)) {
      const formattedValues = value
        .map(v => (typeof v === 'number' ? v.toFixed(4) : String(v)))
        .join(';');
      // Add the first value again at the end for StaticList and DynamicList
      if (expressionMode === 'StaticList' || expressionMode === 'DynamicList') {
        const firstValue = value[0];
        return `${formattedValues};${
          typeof firstValue === 'number'
            ? firstValue.toFixed(4)
            : String(firstValue)
        }`;
      }
      return formattedValues;
    }
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  }

  /**
   * Turn an array of times into a semicolon string
   */
  formatKeyTimes(keyTimes) {
    if (keyTimes.length === 0) return '';
    // Add 1 at the end for the final keyTime
    const formattedTimes = keyTimes.map(t => t.toFixed(4)).join(';');
    return `${formattedTimes};1.0000`;
  }
}

/**
 * Interpret an AST into an object with consistent output format:
 * {
 *   expressionMode: (StaticList, DynamicList, Identifier, NumericValue, etc.),
 *   evaluated: (raw numeric or array),
 *   formattedResult: (string representation),
 *   values: (semicolon-separated string),
 *   keyTimes: (semicolon-separated string),
 *   keySplines: (only for sin pattern),
 *   calcMode: (discrete for StaticList, linear for DynamicList/tri/saw, spline for sin)
 * }
 */
export function interpretAST(ast) {
  const evaluator = new ASTEvaluator();
  const analyzer = new ExpressionAnalyzer();

  const evaluatedResult = evaluator.evaluateNode(ast);
  const expressionMode = analyzer.determineExpressionMode(ast, evaluatedResult);
  const keyTimes = analyzer.calculateKeyTimes(ast);

  // Initialize base output with default values for consistent structure
  const output = {
    expressionMode,
    evaluated: evaluatedResult,
    formattedResult: analyzer.formatResult(evaluatedResult),
    values: '',
    keyTimes: '',
    keySplines: '',
    calcMode: '',
  };

  // Set values and keyTimes for list types, identifiers, and numeric values
  if (
    expressionMode === 'StaticList' ||
    expressionMode === 'DynamicList' ||
    expressionMode === 'Identifier' ||
    expressionMode === 'NumericValue'
  ) {
    output.values = analyzer.formatValues(evaluatedResult, expressionMode);
    if (expressionMode === 'Identifier') {
      output.keyTimes =
        analyzer.findPatternName(ast) === 'saw' ? '0;1' : '0;0.5;1';
    } else if (expressionMode === 'NumericValue') {
      output.keyTimes = '0;1';
    } else {
      output.keyTimes = analyzer.formatKeyTimes(keyTimes);
    }
  }

  // Set calcMode based on expressionMode and pattern type
  if (expressionMode === 'StaticList') {
    output.calcMode = 'discrete';
  } else if (expressionMode === 'DynamicList') {
    output.calcMode = 'linear';
  } else if (expressionMode === 'Identifier') {
    const patternName = analyzer.findPatternName(ast);
    if (patternName === 'sin') {
      output.calcMode = 'spline';
      output.keySplines = '0.4 0 0.6 1; 0.4 0 0.6 1';
    } else if (patternName === 'tri' || patternName === 'saw') {
      output.calcMode = 'linear';
    }
  } else if (expressionMode === 'NumericValue') {
    output.calcMode = 'linear';
  }

  return output;
}
