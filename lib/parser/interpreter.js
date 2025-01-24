// @/lib/parser/interpreter.js

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
      case 'Color':
        return node.value;
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

class ExpressionAnalyzer {
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

  calculateKeyTimes(ast) {
    const keyTimes = [];

    const processNode = (node, start = 0, duration = 1) => {
      if (!node) return;

      if (node.type === 'NumericLiteral' || node.type === 'Color') {
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

    const outermostList = this.findOutermostList(ast);
    if (outermostList) {
      processNode(outermostList);
    }

    return keyTimes;
  }

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

  isColor(value) {
    return (
      typeof value === 'string' &&
      (value.startsWith('rgba(') ||
        [
          'red',
          'green',
          'blue',
          'black',
          'white',
          'yellow',
          'purple',
          'orange',
          'pink',
          'brown',
          'gray',
          'cyan',
          'magenta',
        ].includes(value))
    );
  }

  formatResult(value) {
    if (Array.isArray(value)) {
      return `[${value
        .map(v =>
          this.isColor(v) ? v : typeof v === 'number' ? v.toFixed(4) : String(v)
        )
        .join(', ')}]`;
    }
    if (this.isColor(value)) {
      return value;
    }
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  }

  formatValues(value, expressionMode) {
    if (expressionMode === 'NumericValue') {
      return [0, value].map(v => v.toFixed(4)).join(';');
    }

    if (Array.isArray(value)) {
      const isColorList = value.some(v => this.isColor(v));
      const formattedValues = value
        .map(v =>
          this.isColor(v) ? v : typeof v === 'number' ? v.toFixed(4) : String(v)
        )
        .join(';');

      // Only append first value for numeric lists
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

  formatKeyTimes(keyTimes) {
    if (keyTimes.length === 0) return '';
    const formattedTimes = keyTimes.map(t => t.toFixed(4)).join(';');
    return `${formattedTimes};1.0000`;
  }
}

export function interpretAST(ast) {
  const evaluator = new ASTEvaluator();
  const analyzer = new ExpressionAnalyzer();

  const evaluatedResult = evaluator.evaluateNode(ast);
  const expressionMode = analyzer.determineExpressionMode(ast, evaluatedResult);
  const keyTimes = analyzer.calculateKeyTimes(ast);

  const output = {
    expressionMode,
    evaluated: evaluatedResult,
    formattedResult: analyzer.formatResult(evaluatedResult),
    values: '',
    keyTimes: '',
    keySplines: '',
    calcMode: '',
  };

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
