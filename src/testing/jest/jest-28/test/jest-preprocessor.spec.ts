import { shouldTransform } from '../jest-preprocessor';

describe('jest preprocessor', () => {
  it('shouldTransform', () => {
    expect(shouldTransform('file.ts', '')).toBe(true);
    expect(shouldTransform('file.d.ts', '')).toBe(true);
    expect(shouldTransform('file.tsx', '')).toBe(true);
    expect(shouldTransform('file.jsx', '')).toBe(true);
    expect(shouldTransform('file.mjs', '')).toBe(true);
    expect(shouldTransform('file.css', '')).toBe(true);
    expect(shouldTransform('file.CsS', '')).toBe(true);
    expect(shouldTransform('file.css?tag=my-cmp', '')).toBe(true);
  });

  it('shouldTransform js ext with es module imports/exports', () => {
    expect(shouldTransform('file.js', 'import {} from "./file";')).toBe(true);
    expect(shouldTransform('file.js', 'import.meta.url')).toBe(true);
    expect(shouldTransform('file.js', 'export * from "./file";')).toBe(true);
    expect(shouldTransform('file.js', 'console.log("hi")')).toBe(false);
  });
});
