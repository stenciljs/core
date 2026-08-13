import {
  mockBuildCtx,
  mockCompilerCtx,
  mockModule,
  mockValidatedConfig,
} from '@stencil/core/testing';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

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
});
