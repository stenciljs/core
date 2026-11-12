import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { transpile } from '../../transpile';

/**
 * A component extending a component published by another Stencil library, which itself mixes in
 * one of that library's mixin factories. Files mirror a real library build: the package's
 * `types` entry is an ambient `.d.ts` (no metadata), its JS entry is `dist/collection`.
 */
const LIB_FILES: Record<string, string> = {
  'package.json': JSON.stringify({
    name: '@acme/behaviors',
    exports: {
      './mixins': {
        types: './dist/types/mixins.d.ts',
        default: './dist/collection/mixins.js',
      },
      './lib-base': {
        types: './dist/types/components/lib-base/lib-base.d.ts',
        default: './dist/collection/components/lib-base/lib-base.js',
      },
    },
  }),
  'dist/types/components/lib-base/lib-base.d.ts': `
    declare const LibBase_base: abstract new (...args: any[]) => {
      [x: string]: any;
      label: string;
      touched: boolean;
    };
    export declare class LibBase extends LibBase_base {
      own: string;
    }
    export {};
  `,
  'dist/collection/components/lib-base/lib-base.js': `
    import { Mixin } from "@stencil/core";
    import { labelMixin } from "../../mixins/label.js";
    export class LibBase extends Mixin(labelMixin) {
      own = 'own';
      static get is() { return "lib-base"; }
      static get properties() {
        return {
          "own": {
            "type": "string", "mutable": false,
            "complexType": { "original": "string", "resolved": "string", "references": {} },
            "required": false, "optional": false, "docs": { "tags": [], "text": "" },
            "getter": false, "setter": false, "reflect": false, "attribute": "own"
          }
        };
      }
    }
  `,
  'dist/types/mixins.d.ts': `export * from './mixins/label';`,
  'dist/types/mixins/label.d.ts': `export declare function labelMixin(Base: any): any;`,
  'dist/collection/mixins.js': `export * from './mixins/label.js';`,
  'dist/collection/mixins/label.js': `
    export function labelMixin(Base) {
      class LabelMixinClass extends Base {
        label = 'from-mixin';
        touched = false;
        static get properties() {
          return {
            "label": {
              "type": "string", "mutable": false,
              "complexType": { "original": "string", "resolved": "string", "references": {} },
              "required": false, "optional": false, "docs": { "tags": [], "text": "" },
              "getter": false, "setter": false, "reflect": false, "attribute": "label"
            }
          };
        }
        static get states() { return { "touched": {} }; }
      }
      return LabelMixinClass;
    }
  `,
};

const CMP = `
  import { Component } from '@stencil/core';
  import { LibBase } from '@acme/behaviors/lib-base';

  @Component({ tag: 'app-cmp' })
  export class AppCmp extends LibBase {}
`;

describe('transpile() - extending a component from another Stencil library', () => {
  let root: string;

  const writeLib = (libDir: string) => {
    for (const [file, code] of Object.entries(LIB_FILES)) {
      const abs = path.join(libDir, file);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, code);
    }
  };

  const compile = () =>
    transpile(CMP, {
      file: path.join(root, 'app/src/app-cmp.tsx'),
      target: 'es2022',
      currentDirectory: path.join(root, 'app'),
    });

  const expectInherited = async () => {
    const results = await compile();
    expect(results.diagnostics).toEqual([]);
    const cmp = results.data?.[0];
    expect(cmp.properties.map((p: any) => p.name).sort()).toEqual(['label', 'own']);
    expect(cmp.states.map((s: any) => s.name)).toEqual(['touched']);
  };

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stencil-extends-pkg-')));
    fs.mkdirSync(path.join(root, 'app/src'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('inherits the component and its mixin from an installed package', async () => {
    writeLib(path.join(root, 'app/node_modules/@acme/behaviors'));
    await expectInherited();
  });

  it('inherits a mixin from a package entry that re-exports it with `export *`', async () => {
    writeLib(path.join(root, 'app/node_modules/@acme/behaviors'));
    const results = await transpile(
      `
      import { Component, Mixin } from '@stencil/core';
      import { labelMixin } from '@acme/behaviors/mixins';

      @Component({ tag: 'app-cmp' })
      export class AppCmp extends Mixin(labelMixin) {}
    `,
      {
        file: path.join(root, 'app/src/app-cmp.tsx'),
        target: 'es2022',
        currentDirectory: path.join(root, 'app'),
      },
    );
    expect(results.diagnostics).toEqual([]);
    expect(results.data?.[0].properties.map((p: any) => p.name)).toEqual(['label']);
    expect(results.data?.[0].states.map((s: any) => s.name)).toEqual(['touched']);
  });

  it('inherits the component and its mixin from a symlinked workspace package', async () => {
    writeLib(path.join(root, 'lib'));
    fs.mkdirSync(path.join(root, 'app/node_modules/@acme'), { recursive: true });
    fs.symlinkSync(
      path.join(root, 'lib'),
      path.join(root, 'app/node_modules/@acme/behaviors'),
      'dir',
    );
    await expectInherited();
  });
});
