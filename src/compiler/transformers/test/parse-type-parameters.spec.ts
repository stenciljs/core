import { getStaticGetter, transpileModule } from './transpile';

describe('parse type parameters', () => {
  it('stores no type parameters for a non-generic component', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        @Prop() val: string;
      }
    `);

    expect(t.cmp.typeParameters).toEqual([]);
    expect(t.outputText).not.toContain('typeParameters');
  });

  it('stores type parameter names, constraints, defaults and references', () => {
    const t = transpileModule(`
      export interface Row { id: string; }
      @Component({tag: 'cmp-a'})
      export class CmpA<T extends Row = Row, K extends keyof T = keyof T, U = unknown> {
        @Prop() data: T[];
        @Prop() sortKey: K;
        @Prop() extra: U;
      }
    `);

    expect(t.cmp.typeParameters).toEqual([
      {
        name: 'T',
        constraint: 'Row',
        default: 'Row',
        references: {
          Row: { location: 'local', path: expect.any(String), id: expect.stringContaining('Row') },
        },
      },
      {
        name: 'K',
        constraint: 'keyof T',
        default: 'keyof T',
        references: {
          T: { location: 'global', id: 'global::T' },
        },
      },
      {
        name: 'U',
        default: 'unknown',
        references: {},
      },
    ]);
    expect(getStaticGetter(t.outputText, 'typeParameters')).toEqual(t.cmp.typeParameters);
  });
});
