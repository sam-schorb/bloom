// lib/codeWindowUtils.js
export function formatSVGCode(svgElement) {
  if (!svgElement) return '';

  const serializer = new XMLSerializer();
  return serializer
    .serializeToString(svgElement)
    .replace(/></g, '>\n<')
    .split('\n')
    .map(line => '  ' + line)
    .join('\n');
}
