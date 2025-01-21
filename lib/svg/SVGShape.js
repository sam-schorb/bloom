// @/lib/svg/SVGShape.js

import { createAnimation } from './animations';
import * as styles from './styles';
import { applyTransformStack, transforms } from './transforms';
import { createSVGElement } from './utils';

export class SVGShape {
  static timeMultiplier = 1;

  static setTimeMultiplier(value) {
    SVGShape.timeMultiplier = value;
    document
      .querySelectorAll('animateTransform[data-base-duration]')
      .forEach(anim => {
        const baseDuration = parseFloat(anim.dataset.baseDuration);
        anim.setAttribute('dur', `${baseDuration * value}s`);
      });
  }

  constructor(elementOrGroup = {}) {
    if (elementOrGroup instanceof SVGGElement) {
      this.group = elementOrGroup;
    } else {
      this.group = createSVGElement('g');
      this.group.appendChild(elementOrGroup);
    }
    this.animations = [];
    this.transforms = [];
  }

  appendTo(parent) {
    this.animations.forEach(anim => this.group.appendChild(anim));
    parent.appendChild(this.group);
    return this;
  }

  applyTransform(type, value) {
    this.transforms.push(`${type}(${value})`); // Also fixed missing closing parenthesis
    applyTransformStack(this.group, this.transforms);
    return this;
  }

  transform(transformType) {
    const { type, normalize } = transforms[transformType];

    return (value = 1, duration) => {
      const expression = typeof value === 'string' ? value : String(value);
      console.log('expression', expression);

      if (duration) {
        const animation = createAnimation(
          type,
          normalize(value),
          duration,
          SVGShape.timeMultiplier,
          expression
        );
        this.animations.push(animation);
        return this;
      }

      return this.applyTransform(type, normalize(value));
    };
  }

  // Transform methods
  scale = this.transform('scale');
  rotate = this.transform('rotate');
  moveX = this.transform('moveX');
  moveY = this.transform('moveY');

  colour(...args) {
    styles.colour(this.group, ...args);
    return this;
  }
}
