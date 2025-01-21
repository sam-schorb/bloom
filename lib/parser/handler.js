// @/lib/parser/handler.js

import { interpretAST } from './interpreter.js';
import { parseTokens } from './parser.js';
import { tokenize } from './tokeniser.js';

/**
 * Pass one string in, get the full chain of logic out.
 * - Tokenizes the input
 * - Parses into an AST
 * - Interprets the AST
 * - Returns an object with all relevant fields (similar to the old scripts)
 *
 * Example return:
 * {
 *   expressionMode: 'StaticList',
 *   evaluated: [0, 1],
 *   formattedResult: "[0.0000, 1.0000]",
 *   values: "0.0000;1.0000",
 *   keyTimes: "0;0.5",
 *   keySplines: undefined,
 *   calcMode: undefined
 * }
 */
export function parseAndInterpret(input) {
  // 1) Tokenize
  const tokens = tokenize(input);

  // 2) Parse
  const ast = parseTokens(tokens);

  // 3) Interpret to get a "rich" object
  const interpretation = interpretAST(ast);

  return interpretation;
}
