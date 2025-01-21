// @/lib/parser/tokeniser.js

// Token types enum
export const TokenType = {
  PAREN: 'Paren',
  BRACKET: 'Bracket',
  CURLY_BRACE: 'CurlyBrace',
  OPERATOR: 'Operator',
  NUMBER: 'Number',
  IDENTIFIER: 'Identifier',
  WHITESPACE: 'Whitespace',
  UNKNOWN: 'Unknown',
};

/**
 * Tokenizes an input string into an array of tokens
 * @param {string} input - The input string to tokenize
 * @returns {Array<{type: string, value: string}>} Array of token objects
 */
export function tokenize(input) {
  const tokens = [];
  let current = 0;

  while (current < input.length) {
    let char = input[current];

    // Handle whitespace
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Handle parentheses
    if (char === '(' || char === ')') {
      tokens.push({
        type: TokenType.PAREN,
        value: char,
      });
      current++;
      continue;
    }

    // Handle square brackets
    if (char === '[' || char === ']') {
      tokens.push({
        type: TokenType.BRACKET,
        value: char,
      });
      current++;
      continue;
    }

    // Handle curly braces
    if (char === '{' || char === '}') {
      tokens.push({
        type: TokenType.CURLY_BRACE,
        value: char,
      });
      current++;
      continue;
    }

    // Handle numbers (including decimals and negative numbers)
    const numberRegex = /^-?\d*\.?\d+/;
    const numberMatch = input.slice(current).match(numberRegex);

    if (numberMatch) {
      // Check for valid number context
      const prevChar = input[current - 1];
      const isValidNumberStart =
        !prevChar || /[\s\(\[\{\+\-\*\/]/.test(prevChar);

      if (isValidNumberStart) {
        tokens.push({
          type: TokenType.NUMBER,
          value: numberMatch[0],
        });
        current += numberMatch[0].length;
        continue;
      }
    }

    // Handle operators
    if (/[+\-*/]/.test(char)) {
      tokens.push({
        type: TokenType.OPERATOR,
        value: char,
      });
      current++;
      continue;
    }

    // Handle identifiers (e.g., sin, tri, saw)
    if (/[a-zA-Z]/.test(char)) {
      let value = '';
      while (current < input.length && /[a-zA-Z]/.test(input[current])) {
        value += input[current];
        current++;
      }
      tokens.push({
        type: TokenType.IDENTIFIER,
        value,
      });
      continue;
    }

    // Handle unknown characters
    tokens.push({
      type: TokenType.UNKNOWN,
      value: char,
    });
    current++;
  }

  return tokens;
}
