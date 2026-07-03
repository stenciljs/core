import { describe, expect, it } from 'vitest';

import { extractInheritedMeta } from '../static-to-meta/class-extension';

// Helper: run with a .tsx filename (decorator syntax path)
const fromDecorators = (code: string, className = 'Base') =>
  extractInheritedMeta(code, className, 'base.tsx');

// Helper: run with a .js filename (static getter path)
const fromStaticGetters = (code: string, className = 'Base') =>
  extractInheritedMeta(code, className, 'base.js');

describe('extractInheritedMeta', () => {
  it('returns null when className is not found', () => {
    expect(fromDecorators(`export class Other {}`, 'Missing')).toBeNull();
  });

  // Decorator syntax

  describe('decorator syntax — @Prop', () => {
    it('extracts a basic prop with derived attribute', () => {
      const result = fromDecorators(`
        import { Prop } from '@stencil/core';
        export class Base {
          @Prop() myValue: string;
        }
      `);
      expect(result?.properties).toHaveLength(1);
      const p = result!.properties[0];
      expect(p.name).toBe('myValue');
      expect(p.attribute).toBe('my-value');
      expect(p.reflect).toBe(false);
      expect(p.mutable).toBe(false);
      expect(p.optional).toBe(false);
    });

    it('respects explicit attribute, reflect, and mutable options', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop({ attribute: 'MY-ATTR', reflect: true, mutable: true }) val: string;
        }
      `);
      const p = result!.properties[0];
      expect(p.attribute).toBe('my-attr'); // lowercased
      expect(p.reflect).toBe(true);
      expect(p.mutable).toBe(true);
    });

    it('marks optional props', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop() required: string;
          @Prop() optional?: string;
        }
      `);
      expect(result!.properties.find((p) => p.name === 'required')!.optional).toBe(false);
      expect(result!.properties.find((p) => p.name === 'optional')!.optional).toBe(true);
    });
  });

  describe('decorator syntax — @State', () => {
    it('extracts state names', () => {
      const result = fromDecorators(`
        export class Base {
          @State() count: number;
          @State() isOpen: boolean;
        }
      `);
      expect(result!.states.map((s) => s.name)).toEqual(['count', 'isOpen']);
    });
  });

  describe('decorator syntax — @Event', () => {
    it('defaults event name to the member name', () => {
      const result = fromDecorators(`
        export class Base {
          @Event() myChange: any;
        }
      `);
      const e = result!.events[0];
      expect(e.name).toBe('myChange');
      expect(e.method).toBe('myChange');
      expect(e.bubbles).toBe(true);
      expect(e.cancelable).toBe(true);
      expect(e.composed).toBe(false);
    });

    it('uses explicit eventName when provided', () => {
      const result = fromDecorators(`
        export class Base {
          @Event({ eventName: 'my-custom-event', bubbles: false, composed: true }) change: any;
        }
      `);
      const e = result!.events[0];
      expect(e.name).toBe('my-custom-event');
      expect(e.method).toBe('change');
      expect(e.bubbles).toBe(false);
      expect(e.composed).toBe(true);
    });
  });

  describe('decorator syntax — @Method', () => {
    it('extracts public method names', () => {
      const result = fromDecorators(`
        export class Base {
          @Method() async doSomething(): Promise<void> {}
          @Method() getValue(): string { return ''; }
        }
      `);
      expect(result!.methods.map((m) => m.name)).toEqual(['doSomething', 'getValue']);
    });
  });

  describe('decorator syntax — @Watch', () => {
    it('extracts watched prop and handler method name', () => {
      const result = fromDecorators(`
        export class Base {
          @Watch('myProp') onMyPropChange(val: string) {}
        }
      `);
      expect(result!.watchers).toEqual([{ propName: 'myProp', methodName: 'onMyPropChange' }]);
    });
  });

  describe('decorator syntax — @Listen', () => {
    it('extracts basic listener', () => {
      const result = fromDecorators(`
        export class Base {
          @Listen('click') handleClick() {}
        }
      `);
      const l = result!.listeners[0];
      expect(l.name).toBe('click');
      expect(l.method).toBe('handleClick');
      expect(l.capture).toBe(false);
      expect(l.passive).toBe(false);
      expect(l.target).toBeUndefined();
    });

    it('extracts listener options including target', () => {
      const result = fromDecorators(`
        export class Base {
          @Listen('scroll', { capture: true, passive: true, target: 'window' }) onScroll() {}
        }
      `);
      const l = result!.listeners[0];
      expect(l.capture).toBe(true);
      expect(l.passive).toBe(true);
      expect(l.target).toBe('window');
    });
  });

  describe('lifecycle method names', () => {
    it('collects lifecycle method names from decorator-syntax class', () => {
      const result = fromDecorators(`
        export class Base {
          connectedCallback() {}
          componentDidLoad() {}
          render() { return null; }
          someHelper() {}
        }
      `);
      expect(result!.methodNames).toContain('connectedCallback');
      expect(result!.methodNames).toContain('componentDidLoad');
      expect(result!.methodNames).toContain('render');
      expect(result!.methodNames).toContain('someHelper');
    });
  });

  describe('decorator syntax — mixed class', () => {
    it('extracts all member types from one class', () => {
      const result = fromDecorators(`
        export class Base {
          @Prop() label: string;
          @State() count: number;
          @Event() changed: any;
          @Method() async reset(): Promise<void> {}
          @Watch('label') onLabel() {}
          @Listen('click') onClick() {}
          render() { return null; }
        }
      `);
      expect(result!.properties.map((p) => p.name)).toContain('label');
      expect(result!.states.map((s) => s.name)).toContain('count');
      expect(result!.events.map((e) => e.name)).toContain('changed');
      expect(result!.methods.map((m) => m.name)).toContain('reset');
      expect(result!.watchers[0].propName).toBe('label');
      expect(result!.listeners[0].name).toBe('click');
      expect(result!.methodNames).toContain('render');
    });
  });

  // Static getter syntax

  describe('static getter syntax (compiled collection .js)', () => {
    it('extracts props from static getter', () => {
      const result = fromStaticGetters(`
        class Base {
          static get properties() {
            return {
              label: { attribute: 'label', type: 'string', reflect: false, mutable: false },
              value: { attribute: 'my-value', type: 'number', reflect: true, mutable: true },
            };
          }
        }
      `);
      expect(result!.properties).toHaveLength(2);
      const label = result!.properties.find((p) => p.name === 'label')!;
      expect(label.attribute).toBe('label');
      expect(label.reflect).toBe(false);
      const value = result!.properties.find((p) => p.name === 'value')!;
      expect(value.attribute).toBe('my-value');
      expect(value.reflect).toBe(true);
      expect(value.mutable).toBe(true);
    });

    it('extracts states from static getter', () => {
      const result = fromStaticGetters(`
        class Base {
          static get states() { return { count: {}, isOpen: {} }; }
        }
      `);
      expect(result!.states.map((s) => s.name)).toEqual(['count', 'isOpen']);
    });

    it('extracts events from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get events() {
            return [{
              name: 'myChange',
              method: 'myChange',
              bubbles: true,
              cancelable: true,
              composed: false,
              docs: { text: '', tags: [] },
              complexType: { original: 'any', resolved: 'any', references: {} },
            }];
          }
        }
      `);
      expect(result!.events).toHaveLength(1);
      expect(result!.events[0].name).toBe('myChange');
      expect(result!.events[0].bubbles).toBe(true);
    });

    it('extracts listeners from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get listeners() {
            return [{ name: 'click', method: 'handleClick', capture: false, passive: false }];
          }
        }
      `);
      expect(result!.listeners[0].name).toBe('click');
      expect(result!.listeners[0].method).toBe('handleClick');
    });

    it('extracts watchers from static getter array', () => {
      const result = fromStaticGetters(`
        class Base {
          static get watchers() {
            return [{ propName: 'label', methodName: 'onLabelChange' }];
          }
        }
      `);
      expect(result!.watchers[0]).toEqual({ propName: 'label', methodName: 'onLabelChange' });
    });

    it('collects lifecycle method names alongside static getters', () => {
      const result = fromStaticGetters(`
        class Base {
          static get properties() { return { label: { attribute: 'label' } }; }
          connectedCallback() {}
          componentDidLoad() {}
        }
      `);
      expect(result!.methodNames).toContain('connectedCallback');
      expect(result!.methodNames).toContain('componentDidLoad');
    });
  });
});
