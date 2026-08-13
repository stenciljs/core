import {
  mockBuildCtx,
  mockCompilerCtx,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type * as d from '@stencil/core';

import { mergeExtendedClassMeta } from '..';
import { isStaticGetter } from '../../../transform-utils';

describe('mergeExtendedClassMeta', () => {
  it('re-anchors inherited type references end-to-end when the base class lives in a different directory', async () => {
    const config = mockValidatedConfig({ tsCompilerOptions: {} });
    const compilerCtx = mockCompilerCtx(config);
    const buildCtx = mockBuildCtx(config, compilerCtx);

    const baseFileName = '/src/components/shared/input/base-input.ts';
    await compilerCtx.fs.writeFile(baseFileName, `export class BaseInput {}`, {
      inMemoryOnly: true,
    });

    const baseSource = ts.createSourceFile(
      baseFileName,
      `export class BaseInput {
        static get properties() {
          return {
            "validator": {
              "complexType": {
                "original": "Validator",
                "resolved": "Validator",
                "references": {
                  "Validator": { "location": "import", "path": "./input.types", "id": "x::Validator" }
                }
              }
            }
          };
        }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    compilerCtx.moduleMap.set(
      baseFileName,
      mockModule({ sourceFilePath: baseFileName, staticSourceFile: baseSource }),
    );

    const cmpFileName = '/src/components/data-entry/checkbox/checkbox.tsx';
    const cmpSource = ts.createSourceFile(
      cmpFileName,
      `import { BaseInput } from '../../shared/input/base-input';
      export class Checkbox extends BaseInput {
        static get is() { return 'my-checkbox'; }
      }`,
      ts.ScriptTarget.ESNext,
      true,
    );
    const cmpModule = mockModule({ sourceFilePath: cmpFileName, staticSourceFile: cmpSource });

    const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
    const staticMembers = cmpClass.members.filter(isStaticGetter);

    const result = mergeExtendedClassMeta(
      compilerCtx,
      undefined as unknown as ts.TypeChecker,
      buildCtx,
      cmpClass,
      staticMembers,
      cmpModule,
    );

    expect(result.properties[0]?.complexType.references['Validator']).toEqual({
      location: 'import',
      path: '../../shared/input/input.types',
      id: 'x::Validator',
    });
  });

  describe('barrel / re-export resolution', () => {
    const setup = () => {
      const config = mockValidatedConfig({ tsCompilerOptions: {} });
      const compilerCtx = mockCompilerCtx(config);
      const buildCtx = mockBuildCtx(config, compilerCtx);
      return { config, compilerCtx, buildCtx };
    };

    const writeModule = async (
      compilerCtx: d.CompilerCtx,
      fileName: string,
      code: string,
    ): Promise<ts.SourceFile> => {
      await compilerCtx.fs.writeFile(fileName, code, { inMemoryOnly: true });
      const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.ESNext, true);
      compilerCtx.moduleMap.set(
        fileName,
        mockModule({ sourceFilePath: fileName, staticSourceFile: source }),
      );
      return source;
    };

    it('resolves an extends target reached through a single barrel re-export, without warning', async () => {
      const { compilerCtx, buildCtx } = setup();

      const baseFileName = '/src/components/shared/input/base-input.ts';
      await writeModule(
        compilerCtx,
        baseFileName,
        `export class BaseInput {
          disabled;
          static get properties() {
            return { disabled: { attribute: 'disabled', type: 'boolean', reflect: false, mutable: false } };
          }
        }`,
      );

      const barrelFileName = '/src/components/shared/input/index.ts';
      await writeModule(compilerCtx, barrelFileName, `export { BaseInput } from './base-input';`);

      const cmpFileName = '/src/components/data-entry/checkbox/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from '../../shared/input/index';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpModule = mockModule({ sourceFilePath: cmpFileName, staticSourceFile: cmpSource });
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const result = mergeExtendedClassMeta(
        compilerCtx,
        undefined as unknown as ts.TypeChecker,
        buildCtx,
        cmpClass,
        staticMembers,
        cmpModule,
      );

      expect(result.doesExtend).toBe(true);
      expect(result.properties.map((p) => p.name)).toEqual(['disabled']);
      expect(buildCtx.diagnostics).toHaveLength(0);
    });

    it('does not follow a second hop through a barrel-of-a-barrel, and warns instead', async () => {
      const { compilerCtx, buildCtx } = setup();

      const baseFileName = '/src/components/shared/input/base-input.ts';
      await writeModule(
        compilerCtx,
        baseFileName,
        `export class BaseInput {
          disabled;
          static get properties() {
            return { disabled: { attribute: 'disabled', type: 'boolean', reflect: false, mutable: false } };
          }
        }`,
      );

      const innerBarrelFileName = '/src/components/shared/input/inner-barrel.ts';
      await writeModule(
        compilerCtx,
        innerBarrelFileName,
        `export { BaseInput } from './base-input';`,
      );

      const outerBarrelFileName = '/src/components/shared/input/index.ts';
      await writeModule(
        compilerCtx,
        outerBarrelFileName,
        `export { BaseInput } from './inner-barrel';`,
      );

      const cmpFileName = '/src/components/data-entry/checkbox/checkbox.tsx';
      const cmpSource = ts.createSourceFile(
        cmpFileName,
        `import { BaseInput } from '../../shared/input/index';
        export class Checkbox extends BaseInput {
          static get is() { return 'my-checkbox'; }
        }`,
        ts.ScriptTarget.ESNext,
        true,
      );
      const cmpModule = mockModule({ sourceFilePath: cmpFileName, staticSourceFile: cmpSource });
      const cmpClass = cmpSource.statements.find(ts.isClassDeclaration)!;
      const staticMembers = cmpClass.members.filter(isStaticGetter);

      const result = mergeExtendedClassMeta(
        compilerCtx,
        undefined as unknown as ts.TypeChecker,
        buildCtx,
        cmpClass,
        staticMembers,
        cmpModule,
      );

      expect(result.doesExtend).toBe(false);
      expect(result.properties).toHaveLength(0);
      expect(buildCtx.diagnostics).toHaveLength(1);
      expect(buildCtx.diagnostics[0].messageText).toContain('Unable to find "BaseInput"');
    });
  });
});
