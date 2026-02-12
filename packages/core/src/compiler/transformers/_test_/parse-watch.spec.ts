import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { getStaticGetter, transpileModule } from './transpile';

describe('parse watch', () => {
  it('watch', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() prop1;
        @Prop() prop2;
        @State() state1;

        @Watch('prop1')
        @Watch('prop2')
        onUpdate() {
          console.log('update');
        }

        @Watch('prop1')
        @Watch('state1')
        onStateUpdated() {
          console.log('state updated');
        }

        @Watch('state1')
        @Watch('prop2', {immediate: true})
        onUpdateImmediate() {
          console.log('update');
        }
      }
    `);

    expect(getStaticGetter(t.outputText, 'watchers')).toEqual([
      { methodName: 'onUpdate', propName: 'prop1' },
      { methodName: 'onUpdate', propName: 'prop2' },
      { methodName: 'onStateUpdated', propName: 'prop1' },
      { methodName: 'onStateUpdated', propName: 'state1' },
      { methodName: 'onUpdateImmediate', propName: 'state1' },
      { methodName: 'onUpdateImmediate', propName: 'prop2', handlerOptions: { immediate: true } },
    ]);
  });

  it('should merge extended class watchers meta', async () => {
    const t = transpileModule(
      `
      @Component({tag: 'cmp-a'})
      class CmpA extends Parent {
        @Watch('foo') 
        fooHandler() {
          return 'CmpA';
        }
      }
      class Parent extends GrandParent {
        @Watch('foo') 
        anotherFooHandler() {
          return 'Parent';
        }
      }
      class GrandParent {
        @Watch('bar', {immediate: true}) 
        barHandler() {
          return 'GrandParent';
        }

        @Watch('foo') 
        fooHandler() {
          return 'GrandParent';
        }
      }
    `,
      undefined,
      undefined,
      [],
      [],
      [],
      { target: ts.ScriptTarget.ESNext },
    );

    expect(t.watchers).toEqual([
      {
        methodName: 'barHandler',
        propName: 'bar',
        handlerOptions: { immediate: true },
      },
      {
        methodName: 'anotherFooHandler',
        propName: 'foo',
      },
      {
        methodName: 'fooHandler',
        propName: 'foo',
      },
    ]);
  });
});
