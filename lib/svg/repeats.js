import { CANVAS_HEIGHT, CANVAS_WIDTH, createSVGElement } from './utils';

function createRepeater(axis) {
  return {
    axis,
    getSpacing: (n, size) => size / (n + 1),
    getPosition: (index, spacing, size) => {
      const start = -size / 2;
      return start + index * spacing;
    },
  };
}

export const repeats = {
  x: createRepeater('x'),
  y: createRepeater('y'),
};

export function createRepeat(shape, type, n = 1) {
  const repeater = repeats[type];
  const size = type === 'x' ? CANVAS_WIDTH : CANVAS_HEIGHT;
  const spacing = repeater.getSpacing(n, size);

  const cloneWithAnimations = index => {
    const group = createSVGElement('g');
    const pos = repeater.getPosition(index, spacing, size);

    group.setAttribute(
      'transform',
      [
        `translate(${type === 'x' ? pos : 0}, ${type === 'y' ? pos : 0})`,
        ...shape.transforms,
      ].join(' ')
    );

    // Clone elements
    (shape.element
      ? [shape.element]
      : Array.from(shape.group.children).filter(
          el => !['animate', 'animateTransform'].includes(el.tagName)
        )
    ).forEach(el => group.appendChild(el.cloneNode(true)));

    // Clone animations
    shape.animations.forEach(anim => {
      (anim.getAttribute('attributeName') === 'transform'
        ? [group]
        : group.querySelectorAll('*:not(animate):not(animateTransform)')
      ).forEach(target => target.appendChild(anim.cloneNode(true)));
    });

    return group;
  };

  const parentGroup = createSVGElement('g');
  [...Array(n)].forEach((_, i) =>
    parentGroup.appendChild(cloneWithAnimations(i + 1))
  );

  return {
    group: parentGroup,
    transforms: [...shape.transforms],
  };
}
