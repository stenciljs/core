import { transpileModule } from './transpile';

describe('parse component tags', () => {
  it('createElement', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        connectedCallback() {
          const elm = document.createElement('some-cmp');
        }
        render() {
          return <div/>
        }
      }
    `);

    expect(t.cmp.potentialCmpRefs).toHaveLength(1);
    expect(t.cmp.potentialCmpRefs[0]).toBe('some-cmp');
  });

  it('createElementNS', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        connectedCallback() {
          const elm = document.createElementNS('http://www.w3.org/2000/svg', 'some-cmp');
        }
        render() {
          return <div/>
        }
      }
    `);

    expect(t.cmp.potentialCmpRefs).toHaveLength(1);
    expect(t.cmp.potentialCmpRefs[0]).toBe('some-cmp');
  });

  it('jsx tagged component', () => {
    const t = transpileModule(`
      @Component({tag: 'cmp-a'})
      export class CmpA {
        render() {
          return <some-cmp/>
        }
      }
    `);

    expect(t.cmp.potentialCmpRefs).toHaveLength(1);
    expect(t.cmp.potentialCmpRefs[0]).toBe('some-cmp');
  });
});
