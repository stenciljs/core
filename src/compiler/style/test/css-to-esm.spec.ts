// Mock the shadow-css module before any imports
jest.mock('@utils/shadow-css', () => {
  const originalModule = jest.requireActual('@utils/shadow-css');
  return {
    ...originalModule,
    scopeCss: jest.fn((cssText: string, scopeId: string) => {
      // Simple mock implementation that adds scoped classes
      return cssText.replace(/(\.[a-zA-Z-_][a-zA-Z0-9-_]*)/g, `$1.${scopeId}`);
    }),
  };
});

import { transformCssToEsm, transformCssToEsmSync } from '../css-to-esm';
import type * as d from '../../../declarations';

describe('transformCssToEsm', () => {
  let mockInput: d.TransformCssToEsmInput;

  beforeEach(() => {
    mockInput = {
      input: '.my-class { color: red; }',
      file: '/src/components/my-component/my-component.css',
      tag: 'my-component',
      encapsulation: 'none',
      mode: 'md',
      module: 'esm',
      autoprefixer: null,
      sourceMap: false,
      docs: false,
      addTagTransformers: false,
      tags: [],
      styleImportData: '',
    };
  });

  describe('basic transformation', () => {
    it('should transform basic CSS to ESM module', async () => {
      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain('const mdMyComponentCss = `.my-class{color:red}`;');
      expect(result.output).toContain('export default mdMyComponentCss;');
      expect(result.diagnostics).toEqual([]);
      expect(result.imports).toEqual([]);
    });

    it('should transform basic CSS to ESM module synchronously', () => {
      const result = transformCssToEsmSync(mockInput);

      expect(result.output).toContain('const mdMyComponentCss = `.my-class { color: red; }`;');
      expect(result.output).toContain('export default mdMyComponentCss;');
      expect(result.diagnostics).toEqual([]);
      expect(result.imports).toEqual([]);
    });

    it('should transform CSS to CommonJS module', async () => {
      mockInput.module = 'cjs';

      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain('const mdMyComponentCss = `.my-class{color:red}`;');
      expect(result.output).toContain('module.exports = mdMyComponentCss;');
    });
  });

  describe('scoped encapsulation', () => {
    it('should apply scoped styles when encapsulation is scoped', async () => {
      mockInput.encapsulation = 'scoped';
      mockInput.input = '.my-class { color: red; }';

      const result = await transformCssToEsm(mockInput);

      expect(result.styleText).toContain('.sc-my-component');
      expect(result.output).toContain('.sc-my-component');
    });

    it('should not apply scoped styles when encapsulation is none', async () => {
      mockInput.encapsulation = 'none';
      mockInput.input = '.my-class { color: red; }';

      const result = await transformCssToEsm(mockInput);

      expect(result.styleText).not.toContain('.sc-my-component');
      expect(result.output).not.toContain('.sc-my-component');
    });

    it('should not apply scoped styles when encapsulation is shadow', async () => {
      mockInput.encapsulation = 'shadow';
      mockInput.input = '.my-class { color: red; }';

      const result = await transformCssToEsm(mockInput);

      expect(result.styleText).not.toContain('.sc-my-component');
      expect(result.output).not.toContain('.sc-my-component');
    });
  });

  describe('CSS imports', () => {
    it('should handle CSS imports correctly', async () => {
      mockInput.input = `
        @import './variables.css';
        .my-class { color: red; }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.imports).toHaveLength(1);
      expect(result.imports[0].varName).toMatch(/mdVariablesCss/);
      expect(result.output).toContain('import mdVariablesCss from');
      expect(result.output).toContain('mdVariablesCss +');
      expect(result.styleText).not.toContain('@import');
    });

    it('should handle multiple CSS imports', async () => {
      mockInput.input = `
        @import './variables.css';
        @import './mixins.css';
        .my-class { color: red; }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.imports).toHaveLength(2);
      expect(result.output).toContain('import mdVariablesCss from');
      expect(result.output).toContain('import mdMixinsCss from');
      expect(result.output).toContain('mdVariablesCss + mdMixinsCss +');
    });

    it('should ignore external URL imports', async () => {
      mockInput.input = `
        @import url('https://fonts.googleapis.com/css?family=Roboto');
        .my-class { color: red; }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.imports).toHaveLength(0);
      expect(result.styleText).toContain('https://fonts.googleapis.com');
    });

    it('should ignore node module imports with ~', async () => {
      mockInput.input = `
        @import '~normalize.css/normalize.css';
        .my-class { color: red; }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.imports).toHaveLength(0);
      expect(result.styleText).toContain('~normalize.css');
    });

    it('should handle imports with CommonJS module', async () => {
      mockInput.module = 'cjs';
      mockInput.input = `
        @import './variables.css';
        .my-class { color: red; }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain('const mdVariablesCss = require(');
      expect(result.output).toContain('module.exports = mdMyComponentCss;');
    });
  });

  describe('variable name generation', () => {
    it('should create appropriate variable names based on file path and mode', async () => {
      mockInput.file = '/src/components/button/button.ios.css';
      mockInput.mode = 'ios';

      const result = await transformCssToEsm(mockInput);

      expect(result.defaultVarName).toBe('buttonIosCss');
      expect(result.output).toContain('const buttonIosCss =');
    });

    it('should handle file paths without mode in filename', async () => {
      mockInput.file = '/src/components/button/button.css';
      mockInput.mode = 'ios';

      const result = await transformCssToEsm(mockInput);

      expect(result.defaultVarName).toBe('iosButtonCss');
    });

    it('should handle default mode', async () => {
      mockInput.file = '/src/components/button/button.css';
      mockInput.mode = '';

      const result = await transformCssToEsm(mockInput);

      expect(result.defaultVarName).toBe('buttonCss');
    });
  });

  describe('tag transformers', () => {
    it('should add tag transformers when requested for ESM', async () => {
      mockInput.addTagTransformers = true;
      mockInput.tags = ['my-tag'];

      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain("import { transformTag as __stencil_transformTag  } from '@stencil/core'");
    });

    it('should add tag transformers when requested for CommonJS', async () => {
      mockInput.addTagTransformers = true;
      mockInput.tags = ['my-tag'];
      mockInput.module = 'cjs';

      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain("const __stencil_transformTag = require('@stencil/core').transformTag;");
    });
  });

  describe('style documentation', () => {
    it('should parse style docs when requested', async () => {
      mockInput.docs = true;
      mockInput.input = `
        /**
         * @prop --color: The text color
         * @prop --background: The background color
         */
        .my-class { 
          color: var(--color);
          background: var(--background);
        }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.styleDocs).toHaveLength(2);
      expect(result.styleDocs[0].name).toBe('--color');
      expect(result.styleDocs[0].docs).toBe('The text color');
      expect(result.styleDocs[1].name).toBe('--background');
      expect(result.styleDocs[1].docs).toBe('The background color');
    });

    it('should not parse style docs when not requested', async () => {
      mockInput.docs = false;
      mockInput.input = `
        /**
         * @prop --color: The text color
         */
        .my-class { color: var(--color); }
      `;

      const result = await transformCssToEsm(mockInput);

      expect(result.styleDocs).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle malformed CSS gracefully', async () => {
      mockInput.input = '.my-class { color: red'; // Missing closing brace

      const result = await transformCssToEsm(mockInput);

      // Should still produce output, as CSS parsing is generally permissive
      expect(result.output).toBeTruthy();
      expect(result.styleText).toContain('.my-class { color: red');
    });

    it('should handle empty CSS input', async () => {
      mockInput.input = '';

      const result = await transformCssToEsm(mockInput);

      expect(result.output).toContain('const mdMyComponentCss = ``;');
      expect(result.diagnostics).toEqual([]);
    });

    it('should handle CSS with only comments', () => {
      mockInput.input = '/* This is just a comment */';

      const result = transformCssToEsmSync(mockInput);

      expect(result.output).toContain('const mdMyComponentCss = `/* This is just a comment */`;');
    });
  });

  describe('source maps', () => {
    it('should handle source map requests', async () => {
      mockInput.sourceMap = true;

      const result = await transformCssToEsm(mockInput);

      // Source map handling is done in optimization phase
      expect(result.map).toBeNull(); // Before optimization
    });
  });
});
