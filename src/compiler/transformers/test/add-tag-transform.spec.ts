import { mockBuildCtx } from '@stencil/core/testing';
// import { ScriptTarget } from 'typescript';
// import type * as d from '../../../declarations';

import { addTagTransform } from '../add-tag-transform';
import { transpileModule } from './transpile';
import { formatCode } from './utils';

describe('add-tag-transform', () => {
  it('does something', async () => {
    const buildCtx = mockBuildCtx();
    const compilerCtx = buildCtx.compilerCtx;

    const cmp = `
    @Component({ tag: 'cmp-a' })
      export class CmpA { 
        someMethod() {
          const el = document.createElement('cmp-a');
          const queriedEl = document.querySelector('cmp-b#id');
          const queriedEls = document.querySelectorAll('cmp-a[data-attr], cmp-b.class, cmp-left-alone');
        }
      }
    `;
    // @ts-ignore - just testing
    buildCtx.components.push(
      {
        tagName: 'cmp-a',
      },
      {
        tagName: 'cmp-b',
      },
    );
    const transformer = addTagTransform(compilerCtx, buildCtx);

    const transpileResult = transpileModule(cmp, buildCtx.config, compilerCtx, [], [transformer]);
    const res = await formatCode(transpileResult.outputText);
    expect(transpileResult.diagnostics).toHaveLength(0);

    expect(res).toContain("const el = document.createElement(`${transformTag('cmp-a')}`);");
    expect(res).toContain("const queriedEl = document.querySelector(`${transformTag('cmp-b')}#id`);");
    expect(res).toContain("`${transformTag('cmp-a')}[data-attr], ${transformTag('cmp-b')}.class, cmp-left-alone`");
  });
});
