import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { transpileModule } from './transpile';

describe('parse exportable mixin', () => {
  describe('hasExportableMixins detection', () => {
    it('detects abstract class with Stencil decorators as exportable mixin', () => {
      const t = transpileModule(
        `
        // An abstract class with Stencil decorators but NO @Component
        class AbstractMixin {
          @Prop() mixinProp: string = 'default';
          @State() mixinState: string = 'state';
          @Method()
          async mixinMethod() {
            return 'method';
          }
          @Watch('mixinProp')
          mixinPropChanged() {}
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends AbstractMixin {
          @Prop() cmpProp: string = 'cmp';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('detects mixin factory pattern as exportable mixin', () => {
      const t = transpileModule(
        `
        // A mixin factory function
        const MixinFactory = (Base) => {
          class Mixin extends Base {
            @Prop() factoryProp: string = 'factory';
            @State() factoryState: string = 'state';
          }
          return Mixin;
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends Mixin(MixinFactory) {
          @Prop() cmpProp: string = 'cmp';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('does NOT set hasExportableMixins for regular components', () => {
      const t = transpileModule(
        `
        @Component({tag: 'cmp-a'})
        class CmpA {
          @Prop() prop1: string = 'default';
          @State() state1: string = 'state';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBeFalsy();
    });

    it('does NOT set hasExportableMixins for classes without Stencil decorators', () => {
      const t = transpileModule(
        `
        // A plain class without Stencil decorators
        class PlainClass {
          plainProp: string = 'default';
          plainMethod() {
            return 'method';
          }
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends PlainClass {
          @Prop() cmpProp: string = 'cmp';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBeFalsy();
    });

    it('detects mixin with only @Prop as exportable', () => {
      const t = transpileModule(
        `
        class PropOnlyMixin {
          @Prop() mixinProp: string = 'default';
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends PropOnlyMixin {}
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('detects mixin with only @State as exportable', () => {
      const t = transpileModule(
        `
        class StateOnlyMixin {
          @State() mixinState: string = 'default';
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends StateOnlyMixin {}
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('detects mixin with only @Method as exportable', () => {
      const t = transpileModule(
        `
        class MethodOnlyMixin {
          @Method()
          async mixinMethod() {
            return 'method';
          }
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends MethodOnlyMixin {}
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('detects mixin with only @Event as exportable', () => {
      const t = transpileModule(
        `
        class EventOnlyMixin {
          @Event() mixinEvent: EventEmitter<string>;
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends EventOnlyMixin {}
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('detects mixin with only @Watch as exportable', () => {
      const t = transpileModule(
        `
        class WatchOnlyMixin {
          someProp: string = 'default';
          @Watch('someProp')
          somePropChanged() {}
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends WatchOnlyMixin {
          @Prop() someProp: string = 'cmp';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });

    it('creates staticSourceFile for modules with exportable mixins', () => {
      const t = transpileModule(
        `
        class AbstractMixin {
          @Prop() mixinProp: string = 'default';
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends AbstractMixin {}
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.staticSourceFile).toBeDefined();
    });

    it('detects multi-level inheritance with abstract mixin', () => {
      const t = transpileModule(
        `
        // Grandparent mixin
        class GrandparentMixin {
          @Prop() grandparentProp: string = 'grandparent';
        }

        // Parent mixin extends grandparent
        class ParentMixin extends GrandparentMixin {
          @Prop() parentProp: string = 'parent';
        }

        @Component({tag: 'cmp-a'})
        class CmpA extends ParentMixin {
          @Prop() cmpProp: string = 'cmp';
        }
      `,
        undefined,
        undefined,
        [],
        [],
        [],
        { target: ts.ScriptTarget.ESNext },
      );

      expect(t.moduleFile.hasExportableMixins).toBe(true);
    });
  });
});
