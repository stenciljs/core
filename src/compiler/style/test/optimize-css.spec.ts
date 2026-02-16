import type * as d from '@stencil/core/declarations';
import { mockCompilerCtx, mockValidatedConfig } from '@stencil/core/testing';
import os from 'os';
import path from 'path';

import { optimizeCss } from '../optimize-css';

describe('optimizeCss', () => {
  const MOCK_FILE_PATH = './mock/path/to/file.css';

  let config: d.ValidatedConfig;
  let compilerCtx: d.CompilerCtx;
  let diagnostics: d.Diagnostic[];

  // TODO(STENCIL-307): Remove usage of the Jasmine global
  // eslint-disable-next-line jest/no-jasmine-globals -- these will be removed when we migrate to jest-circus
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

  beforeEach(() => {
    config = mockValidatedConfig({ maxConcurrentWorkers: 0, minifyCss: true });
    compilerCtx = mockCompilerCtx(config);
    diagnostics = [];
  });

  it('handles error', async () => {
    const filePath = path.join(os.tmpdir(), 'my.css');
    const styleText = `/* css */ body color: #ff0000; }`;
    await optimizeCss(config, compilerCtx, diagnostics, styleText, filePath);

    expect(diagnostics).toHaveLength(1);
  });

  it('discard-comments', async () => {
    const styleText = `/* css */ body { color: #ff0000; }`;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`body{color:#ff0000}`);
  });

  it('minify-gradients', async () => {
    config.autoprefixCss = false;
    const styleText = `
      h1 {
        background: linear-gradient(to bottom, #ffe500 0%, #ffe500 50%, #121 50%, #121 100%);
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{background:linear-gradient(to bottom, #ffe500 0%, #ffe500 50%, #121 50%, #121 100%)}`);
  });

  it('reduce-initial', async () => {
    const styleText = `
      h1 {
        min-width: initial;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{min-width:initial}`);
  });

  it('normalize-display-values', async () => {
    const styleText = `
      h1 {
        display: inline flow-root;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{display:inline flow-root}`);
  });

  it('reduce-transforms', async () => {
    config.autoprefixCss = false;
    const styleText = `
      h1 {
        transform: rotate3d(0, 0, 1, 20deg);
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{transform:rotate3d(0, 0, 1, 20deg)}`);
  });

  it('colormin', async () => {
    const styleText = `body { color: #ff0000; }`;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`body{color:#ff0000}`);
  });

  it('convert-values', async () => {
    const styleText = `
      h1 {
        width: 0em;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{width:0em}`);
  });

  it('ordered-values', async () => {
    const styleText = `
      h1 {
        border: red solid .5em;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{border:red solid .5em}`);
  });

  it('minify-selectors', async () => {
    const styleText = `
      h1 + p, h2, h3, h2{color:red}
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1+p,h2,h3{color:red}`);
  });

  it('minify-params', async () => {
    const styleText = `
      @media only screen   and ( min-width: 400px, min-height: 500px ) {
        h2 {
          color: red;
        }
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`@media only screen and ( min-width: 400px, min-height: 500px ){h2{color:red}}`);
  });

  it('normalize-string', async () => {
    const styleText = `
      p:after {
        content: '\\'string\\' is intact';
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`p:after{content:'\\'string\\' is intact'}`);
  });

  it('minify-font-values', async () => {
    const styleText = `
      p {
        font-family: "Helvetica Neue", Arial, sans-serif, Helvetica;
        font-weight: normal;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`p{font-family:\"Helvetica Neue\", Arial, sans-serif, Helvetica;font-weight:normal}`);
  });

  it('normalize-repeat-style', async () => {
    const styleText = `
      h1 {
        background: url(image.jpg) repeat no-repeat;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{background:url(image.jpg) repeat no-repeat}`);
  });

  it('normalize-positions', async () => {
    const styleText = `
      h1 {
        background-position: bottom left;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{background-position:bottom left}`);
  });

  it('normalize-whitespace', async () => {
    const styleText = `
      h1 {
        width: calc(10px -  ( 100px / var(--test)  )) ;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{width:calc(10px -  ( 100px / var(--test)  ))}`);
  });

  it('unique-selectors', async () => {
    const styleText = `
      h1, h3, h2, h1 {
        color: red;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1,h3,h2{color:red}`);
  });

  it('prevent autoprefix with null', async () => {
    config.autoprefixCss = null;
    const styleText = `
      h1 {
        box-shadow: 1px;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{box-shadow:1px}`);
  });

  it('prevent autoprefix with false', async () => {
    config.autoprefixCss = false;
    const styleText = `
      h1 {
        box-shadow: 1px;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{box-shadow:1px}`);
  });

  it('autoprefix by default', async () => {
    const styleText = `
      h1 {
        box-shadow: 1px;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{-webkit-box-shadow:1px;box-shadow:1px}`);
  });

  it('runs autoprefixerCss true config', async () => {
    config.autoprefixCss = true;
    const styleText = `
      h1 {
        box-shadow: 1px;
      }
    `;
    const output = await optimizeCss(config, compilerCtx, diagnostics, styleText, MOCK_FILE_PATH);

    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(`h1{-webkit-box-shadow:1px;box-shadow:1px}`);
  });

  it('do nothing for invalid data', async () => {
    // we intentionally pass `null` as an argument for the provided styles, hence the type assertion
    let output = await optimizeCss(config, compilerCtx, diagnostics, null as unknown as string, MOCK_FILE_PATH);
    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(null);

    // we intentionally pass `null` as an argument for the provided styles, hence the type assertion
    output = await optimizeCss(config, compilerCtx, diagnostics, undefined as unknown as string, MOCK_FILE_PATH);
    expect(diagnostics).toHaveLength(0);
    expect(output).toBe(undefined);

    output = await optimizeCss(config, compilerCtx, diagnostics, '', MOCK_FILE_PATH);
    expect(diagnostics).toHaveLength(0);
    expect(output).toBe('');
  });
});
