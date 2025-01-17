// app/lib/svg/SVGShape.js

import * as styles from './styles';
import * as transforms from './transforms';
import { createSVGElement } from './utils';

export class SVGShape {
  constructor(elementOrGroup) {
    if (elementOrGroup instanceof SVGGElement) {
      this.group = elementOrGroup;
    } else {
      this.group = createSVGElement('g');
      this.group.appendChild(elementOrGroup);
    }
  }

  appendTo(parent) {
    parent.appendChild(this.group);
    return this;
  }

  scale(factor = 1) {
    transforms.scale(this.group, factor);
    return this;
  }

  colour(...args) {
    styles.colour(this.group, ...args);
    return this;
  }
}
