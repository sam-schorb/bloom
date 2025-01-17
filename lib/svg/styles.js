// @/lib/svg/Transforms.js

import { toRGBA } from './utils';

/**
 * Applies color to shape(s)
 * @param {...(string|number)} args - Color name or r,g,b,a values
 * @returns {SVGShape}
 */
export function colour(group, ...args) {
  const fill =
    args.length === 1 && typeof args[0] === 'string'
      ? args[0].toLowerCase()
      : toRGBA(args);

  Array.from(group.children).forEach(child => child.setAttribute('fill', fill));
}
