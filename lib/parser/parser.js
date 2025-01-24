// @/lib/parser/parser.js

import { TokenType } from './tokeniser.js';

class ParserError extends Error {
  constructor(message, token) {
    super(message);
    this.name = 'ParserError';
    this.token = token;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  isAtEnd() {
    return this.current >= this.tokens.length;
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  match(type) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  error(message) {
    throw new ParserError(message, this.peek());
  }

  consume(type, message) {
    if (this.peek().type === type) {
      return this.advance();
    }
    throw this.error(message);
  }

  /**
   * Entry point
   */
  parse() {
    try {
      const ast = this.expression();

      // If there are leftover tokens, that's a parse error
      if (!this.isAtEnd()) {
        const remaining = this.tokens.slice(this.current);
        throw new ParserError(
          `Unexpected tokens after complete expression: ${JSON.stringify(
            remaining
          )}`,
          this.peek()
        );
      }

      // Validate the AST structure
      validateAST(ast);

      return ast;
    } catch (e) {
      if (e instanceof ParserError) {
        // Re-throw as a standard Error with more info
        throw new Error(`Parse error: ${e.message}`);
      }
      throw e;
    }
  }

  /**
   * Grammar
   */
  expression() {
    return this.additive();
  }

  // additive → multiplicative ( ("+" | "-") multiplicative )* ;
  additive() {
    let expr = this.multiplicative();

    while (
      !this.isAtEnd() &&
      this.peek().type === TokenType.OPERATOR &&
      ['+', '-'].includes(this.peek().value)
    ) {
      const operator = this.advance().value;
      const right = this.multiplicative();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  // multiplicative → primary ( ("*" | "/") primary )* ;
  multiplicative() {
    let expr = this.primary();

    while (
      !this.isAtEnd() &&
      this.peek().type === TokenType.OPERATOR &&
      ['*', '/'].includes(this.peek().value)
    ) {
      const operator = this.advance().value;
      const right = this.primary();
      expr = {
        type: 'BinaryExpression',
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  // primary → "(" expr(s) ")" | "[" ... ] | "{" ... } | NUMBER | IDENTIFIER ;
  primary() {
    // Handle colors
    if (this.peek().type === TokenType.COLOR) {
      return {
        type: 'Color',
        value: this.advance().value,
      };
    }

    // Parentheses
    if (this.peek().type === TokenType.PAREN && this.peek().value === '(') {
      this.advance(); // consume "("

      const lists = [];
      // Parse the first expression inside parentheses
      let firstExpr = this.expression();
      lists.push(firstExpr);

      // Sometimes we can have multiple list-y expressions in the same parentheses
      while (
        !this.isAtEnd() &&
        this.peek().type !== TokenType.PAREN &&
        this.peek().type !== TokenType.OPERATOR
      ) {
        lists.push(this.expression());
      }

      if (this.peek().type !== TokenType.PAREN || this.peek().value !== ')') {
        this.error("Expected closing ')'");
      }
      this.advance(); // consume ")"

      // If multiple expressions, treat them as a grouped list
      if (lists.length > 1) {
        return {
          type: 'ListGroup',
          elements: lists,
        };
      }

      return firstExpr;
    }

    // Square brackets => static list
    if (this.peek().type === TokenType.BRACKET && this.peek().value === '[') {
      this.advance(); // consume "["
      return this.parseStaticList();
    }

    // Curly braces => dynamic list
    if (
      this.peek().type === TokenType.CURLY_BRACE &&
      this.peek().value === '{'
    ) {
      this.advance(); // consume "{"
      return this.parseDynamicList();
    }

    // Numeric literal
    if (this.peek().type === TokenType.NUMBER) {
      return {
        type: 'NumericLiteral',
        value: parseFloat(this.advance().value),
      };
    }

    // Pattern name
    if (this.peek().type === TokenType.IDENTIFIER) {
      const name = this.advance().value;
      if (!['sin', 'tri', 'saw'].includes(name)) {
        this.error(`Invalid pattern name: ${name}`);
      }
      return {
        type: 'Pattern',
        name,
      };
    }

    // Fallback
    this.error(`Unexpected token: ${JSON.stringify(this.peek())}`);
  }

  parseStaticList() {
    const elements = [];

    // Check if the list is empty
    if (this.peek().type === TokenType.BRACKET && this.peek().value === ']') {
      this.advance(); // consume "]"
      return {
        type: 'StaticList',
        elements,
      };
    }

    // Read elements until we find a closing bracket
    do {
      if (this.isAtEnd()) {
        this.error('Unterminated static list');
      }
      elements.push(this.expression());
    } while (
      this.peek().type !== TokenType.BRACKET ||
      this.peek().value !== ']'
    );

    if (this.peek().value !== ']') {
      this.error("Expected closing ']'");
    }
    this.advance();

    return {
      type: 'StaticList',
      elements,
    };
  }

  parseDynamicList() {
    const elements = [];

    // Check if empty
    if (
      this.peek().type === TokenType.CURLY_BRACE &&
      this.peek().value === '}'
    ) {
      this.advance(); // consume "}"
      return {
        type: 'DynamicList',
        elements,
      };
    }

    // Read until closing curly brace
    do {
      if (this.isAtEnd()) {
        this.error('Unterminated dynamic list');
      }
      elements.push(this.expression());
    } while (
      this.peek().type !== TokenType.CURLY_BRACE ||
      this.peek().value !== '}'
    );

    if (this.peek().value !== '}') {
      this.error("Expected closing '}'");
    }
    this.advance();

    return {
      type: 'DynamicList',
      elements,
    };
  }
}

function containsPattern(node) {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'Pattern') return true;

  if (node.type === 'BinaryExpression') {
    return containsPattern(node.left) || containsPattern(node.right);
  }

  if (node.type === 'StaticList' || node.type === 'DynamicList') {
    return node.elements.some(element => containsPattern(element));
  }

  if (node.type === 'ListGroup') {
    return node.elements.some(element => containsPattern(element));
  }

  return false;
}

function containsColor(node) {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'Color') return true;

  if (node.type === 'BinaryExpression') {
    return containsColor(node.left) || containsColor(node.right);
  }

  if (node.type === 'StaticList' || node.type === 'DynamicList') {
    return node.elements.some(element => containsColor(element));
  }

  if (node.type === 'ListGroup') {
    return node.elements.some(element => containsColor(element));
  }

  return false;
}

function containsList(node) {
  if (!node || typeof node !== 'object') return false;

  if (node.type === 'StaticList' || node.type === 'DynamicList') return true;

  if (node.type === 'BinaryExpression') {
    return containsList(node.left) || containsList(node.right);
  }

  if (node.type === 'ListGroup') {
    return true;
  }

  return false;
}

// Modified validation for BinaryExpression in validateAST
function validateAST(node) {
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid AST node');
  }

  switch (node.type) {
    case 'BinaryExpression':
      if (!node.operator || !node.left || !node.right) {
        throw new Error('Invalid binary expression');
      }
      if (!['+', '-', '*', '/'].includes(node.operator)) {
        throw new Error(`Invalid operator: ${node.operator}`);
      }

      // Prevent mathematical operations on colors
      if (containsColor(node)) {
        throw new Error('Cannot perform mathematical operations on colors');
      }

      // Existing pattern and list validation
      if (containsPattern(node) && containsList(node)) {
        throw new Error(
          'Cannot combine patterns and lists in the same expression'
        );
      }

      validateAST(node.left);
      validateAST(node.right);
      break;

    case 'StaticList':
    case 'DynamicList':
      if (!Array.isArray(node.elements)) {
        throw new Error(`Invalid ${node.type}: elements must be an array`);
      }
      node.elements.forEach(element => {
        if (element.type === 'BinaryExpression') {
          throw new Error(
            `${node.type} cannot contain expressions (parentheses not allowed inside lists)`
          );
        }
        if (element.type === 'ListGroup') {
          throw new Error(
            `${node.type} cannot contain grouped lists (parentheses only allowed at outer level)`
          );
        }
        if (element.type === 'StaticList' && node.type === 'DynamicList') {
          throw new Error('DynamicList cannot contain StaticList elements');
        }
        if (element.type === 'DynamicList' && node.type === 'StaticList') {
          throw new Error('StaticList cannot contain DynamicList elements');
        }
        if (
          !['NumericLiteral', 'Color', 'StaticList', 'DynamicList'].includes(
            element.type
          )
        ) {
          throw new Error(
            `${node.type} can only contain numbers, colors, and nested lists of the same type`
          );
        }
        validateAST(element);
      });
      break;

    case 'Color':
      // Color values are already validated by the tokenizer
      break;

    case 'ListGroup':
      if (!Array.isArray(node.elements)) {
        throw new Error('Invalid ListGroup: elements must be an array');
      }
      if (node.elements.length < 2) {
        throw new Error('ListGroup must contain at least 2 elements');
      }

      // Ensure the group is either all StaticList or all DynamicList
      const firstType = node.elements[0].type;
      if (firstType !== 'StaticList' && firstType !== 'DynamicList') {
        throw new Error(
          'ListGroup can only contain StaticList or DynamicList nodes'
        );
      }

      node.elements.forEach(element => {
        if (element.type !== firstType) {
          throw new Error(
            'ListGroup cannot mix StaticList and DynamicList elements'
          );
        }
        validateAST(element);
      });
      break;

    case 'Pattern':
      if (!['sin', 'tri', 'saw'].includes(node.name)) {
        throw new Error(`Invalid pattern name: ${node.name}`);
      }
      break;

    case 'NumericLiteral':
      if (typeof node.value !== 'number' || isNaN(node.value)) {
        throw new Error(`Invalid number: ${node.value}`);
      }
      break;

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Public function to parse an array of tokens into an AST
 */
export function parseTokens(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}
