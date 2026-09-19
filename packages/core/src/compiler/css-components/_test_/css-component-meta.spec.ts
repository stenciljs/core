import { describe, expect, it } from 'vitest';

import { createCssOnlyComponentMeta } from '../css-component-meta';
import type { CssOnlyComponentDef } from '../types';

describe('createCssOnlyComponentMeta', () => {
  const def: CssOnlyComponentDef = {
    tagName: 'my-badge',
    sourceFilePath: '/src/my-badge.css',
    docsText: 'A badge.',
    docsTags: [],
    properties: [{ name: '--badge-color', docs: 'Background color', source: 'explicit' }],
    attributes: [
      { name: 'variant', type: '"danger" | (string & {})', docs: '', source: 'auto' },
      { name: 'dismissible', type: 'boolean', docs: 'Dismissible', source: 'explicit' },
    ],
  };

  it('has no backing JS class and every feature flag off', () => {
    const meta = createCssOnlyComponentMeta(def);
    expect(meta.componentClassName).toBe('');
    expect(meta.encapsulation).toBe('none');
    expect(meta.tagName).toBe('my-badge');
    expect(meta.sourceFilePath).toBe('/src/my-badge.css');
    expect(meta.styles).toEqual([]);
    expect(meta.events).toEqual([]);
    expect(meta.methods).toEqual([]);
    expect(meta.hasProp).toBe(false);
    expect(meta.hasEvent).toBe(false);
    expect(meta.hasLifecycle).toBe(false);
    expect(meta.internal).toBe(false);
    expect(meta.isCollectionDependency).toBe(false);
  });

  it('maps attributes to properties with attribute reflection info', () => {
    const meta = createCssOnlyComponentMeta(def);
    expect(meta.properties).toHaveLength(2);

    const variant = meta.properties.find((p) => p.name === 'variant')!;
    expect(variant.attribute).toBe('variant');
    expect(variant.type).toBe('any');
    expect(variant.complexType.original).toBe('"danger" | (string & {})');
    expect(variant.getter).toBe(false);
    expect(variant.setter).toBe(false);
    expect(variant.mutable).toBe(false);

    const dismissible = meta.properties.find((p) => p.name === 'dismissible')!;
    expect(dismissible.type).toBe('boolean');
    expect(dismissible.docs.text).toBe('Dismissible');
  });

  it('maps properties to styleDocs with a "prop" annotation and default mode', () => {
    const meta = createCssOnlyComponentMeta(def);
    expect(meta.styleDocs).toEqual([
      { name: '--badge-color', docs: 'Background color', annotation: 'prop', mode: '$' },
    ]);
  });

  it('carries syntax/default through from a @property-sourced definition', () => {
    const withProperty: CssOnlyComponentDef = {
      ...def,
      properties: [
        {
          name: '--badge-radius',
          docs: 'Radius',
          source: 'property-rule',
          syntax: '<length>',
          default: '4px',
        },
      ],
    };
    const meta = createCssOnlyComponentMeta(withProperty);
    expect(meta.styleDocs[0].syntax).toBe('<length>');
    expect(meta.styleDocs[0].default).toBe('4px');
  });
});
