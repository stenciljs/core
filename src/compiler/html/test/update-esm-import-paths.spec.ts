import { updateImportPaths } from '../inline-esm-import';

describe('updateImportPaths', () => {
  const newAbsDir = '/build/';

  it('should transform qualified JS imports', () => {
    const input = `import{p as e,b as o}from"./p-f6a9428b.js"`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe('import{p as e,b as o}from"/build/p-f6a9428b.js"');
  });

  it(`import"./p-f86dea13.js";`, () => {
    const input = `import"./p-f86dea13.js";`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import"/build/p-f86dea13.js";`);
  });

  it('should transform multiple JS module specifiers', () => {
    const input = `import'./a.js';import'./b.js';import'./c.js';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import'/build/a.js';import'/build/b.js';import'/build/c.js';`);
  });

  it('should transform a single JS module specifier', () => {
    const input = `import './p-f86dea13.js';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import '/build/p-f86dea13.js';`);
  });

  it('should transform multiple ESM module specifiers', () => {
    const input = `import'./a.mjs';import'./b.mjs';import'./c.mjs';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import'/build/a.mjs';import'/build/b.mjs';import'/build/c.mjs';`);
  });

  it('should transform a single ESM module specifier', () => {
    const input = `import './p-f86dea13.mjs';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import '/build/p-f86dea13.mjs';`);
  });

  it('should not transform non-JS extensions', () => {
    const input = `import './no-touch.xml';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import './no-touch.xml';`);
  });

  it('should only transform relative paths', () => {
    const input = `import '/no-touch.js';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import '/no-touch.js';`);
  });

  it('should not transform a module specifier without an extension', () => {
    const input = `import 'leave-me-be';`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import 'leave-me-be';`);
  });

  it('should update both an import and an export statement', () => {
    const input = `import './p-010101.js'; export { foo } from './p-010101.js'`;
    const o = updateImportPaths(input, newAbsDir);
    expect(o.code).toBe(`import '/build/p-010101.js'; export { foo } from '/build/p-010101.js'`);
  });
});
