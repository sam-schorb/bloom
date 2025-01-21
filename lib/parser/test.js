import { parseAndInterpret } from '@/lib/parser/handler';

export default function ExamplePage() {
  const input = 'sin * (2+3)';
  try {
    const result = parseAndInterpret(input);

    return (
      <div>
        <h1>Parsing result for: {input}</h1>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    );
  } catch (err) {
    return (
      <div>
        <h1>Error parsing expression: {input}</h1>
        <p>{err.message}</p>
      </div>
    );
  }
}

/* const testCases = [
    'saw * (1 + [0.2 0.3])',
    '1+1',
    'tri / 0.5',
    '(saw + 1) - 0.25',
    'sin * (0.3 + 1)',
    '[0.1 0.2]',
    '[[0.1 0.2] [0.3 0.4]]',
    '([0.1 [0.2 [0.3 0.4]]] + 2) / 2',
    '2 * (2 + [0.1 [0.2 [0.3 0.4]]] + 2)',
    '{0.1 0.2}',
    '{{0.1 0.2} {0.3 0.4}}',
    '{{0.1 {0.2 0.3 0.4 {0.5 0.6 {0.8 0.9}}}} {0.3 0.4 {0.3 0.4 {0.5 0.6}}}}',
    '{{0.1 {0.2 0.3}} {0.4 0.5}}',
    '({{0.1 0.2} {0.3 0.4}})',
    '({0.1 0.2} {0.3 0.4}) * 3',
    '(( [0.1 [0.2 0.3]] * 4 ) - 1)',
  ]; */
