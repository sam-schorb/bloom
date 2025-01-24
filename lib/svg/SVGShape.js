import { createAnimation } from './animations';
import { applyFill, fills } from './fills';
import { createRepeat } from './repeats';
import { applyTransformStack, transforms } from './transforms';
import { createSVGElement } from './utils';

export class SVGShape {
  static timeMultiplier = 1;

  static setTimeMultiplier(value) {
    SVGShape.timeMultiplier = value;
    document
      .querySelectorAll(
        'animate[data-base-duration], animateTransform[data-base-duration]'
      )
      .forEach(anim => {
        const baseDuration = parseFloat(anim.dataset.baseDuration);
        anim.setAttribute('dur', `${baseDuration * value}s`);
      });
  }

  constructor(elementOrGroup = {}) {
    if (elementOrGroup instanceof SVGGElement) {
      this.group = elementOrGroup;
      this.element = null;
    } else {
      this.element = elementOrGroup;
      this.group = createSVGElement('g');
      this.group.appendChild(this.element);
    }
    this.animations = [];
    this.transforms = [];
  }

  getAnimationTargets(animation) {
    const attrName = animation.getAttribute('attributeName');

    // Handle transform animations
    if (attrName === 'transform') {
      return [this.group];
    }

    // For fill animations, if we're dealing with a group of shapes
    // return the group itself rather than individual shapes
    if (attrName === 'fill' && !this.element) {
      return [this.group];
    }

    // For single elements or other animation types
    if (this.element) {
      return [this.element];
    }

    // For other attributes on groups, find all relevant shapes
    return Array.from(this.group.children).filter(
      shape => !['animate', 'animateTransform'].includes(shape.tagName)
    );
  }

  attachAnimation(animation) {
    const targets = this.getAnimationTargets(animation);
    const isGroupFillAnimation =
      animation.getAttribute('attributeName') === 'fill' &&
      targets[0] === this.group;

    if (isGroupFillAnimation) {
      // Remove fill attributes from all shapes in the group
      const shapes = this.group.querySelectorAll(
        '*:not(animate):not(animateTransform):not(g)'
      );
      shapes.forEach(shape => {
        if (shape.hasAttribute('fill')) {
          shape.removeAttribute('fill');
        }
      });
    }

    targets.forEach(target => {
      // Clone animation for multiple targets (except last)
      const animationNode =
        target === targets[targets.length - 1]
          ? animation
          : animation.cloneNode(true);
      target.appendChild(animationNode);
    });
  }

  appendTo(parent) {
    this.animations.forEach(anim => this.attachAnimation(anim));
    parent.appendChild(this.group);
    return this;
  }

  applyTransform(type, value) {
    this.transforms.push(`${type}(${value})`);
    applyTransformStack(this.group, this.transforms);
    return this;
  }

  transform(transformType) {
    const transformer = transforms[transformType];
    if (!transformer) {
      throw new Error(`Unknown transform type: ${transformType}`);
    }

    return (value = 1, duration) => {
      const expression = typeof value === 'string' ? value : String(value);

      if (duration) {
        const animation = createAnimation(
          transformer,
          duration,
          SVGShape.timeMultiplier,
          expression
        );
        this.animations.push(animation);
        return this;
      }

      return this.applyTransform(
        transformer.type,
        transformer.normalize(value)
      );
    };
  }

  applyFill(type, value) {
    applyFill(this.group, type, value);
    return this;
  }

  fill(fillType) {
    const transformer = fills[fillType];
    if (!transformer) {
      throw new Error(`Unknown fill type: ${fillType}`);
    }

    return (value = 1, duration) => {
      const expression = typeof value === 'string' ? value : String(value);

      if (duration) {
        const animation = createAnimation(
          transformer,
          duration,
          SVGShape.timeMultiplier,
          expression
        );
        this.animations.push(animation);
        return this;
      }

      return this.applyFill(transformer.attributeName, value);
    };
  }

  repeat(repeatType) {
    return (n = 1) => {
      const result = createRepeat(this, repeatType, n);
      const newShape = new SVGShape(result.group);
      newShape.transforms = result.transforms;
      return newShape;
    };
  }

  join(otherShape) {
    if (!(otherShape instanceof SVGShape)) {
      throw new Error('Can only join with another SVGShape');
    }

    const newGroup = createSVGElement('g');
    newGroup.appendChild(this.group);
    newGroup.appendChild(otherShape.group);
    const joinedShape = new SVGShape(newGroup);
    joinedShape.animations = [...this.animations, ...otherShape.animations];

    joinedShape.transforms = [];

    return joinedShape;
  }

  // Transform methods
  scale = this.transform('scale');
  rotate = this.transform('rotate');
  moveX = this.transform('moveX');
  moveY = this.transform('moveY');
  skewX = this.transform('skewX');
  skewY = this.transform('skewY');

  // Fill methods
  colour = this.fill('colour');
  opacity = this.fill('opacity');
  fillRule = this.fill('fillRule');

  // Repeat methods
  repeatX = this.repeat('x');
  repeatY = this.repeat('y');
}
