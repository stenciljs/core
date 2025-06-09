import { Component, Host, h, State } from '@stencil/core';
import type StencilTypes from '@stencil/core/compiler';
import type TypeScriptTypes from 'typescript';
import type RollupTypes from 'rollup';
import { cssTemplatePlugin } from '../../utils/css-template-plugin';
import { loadDeps } from '../../utils/load-deps';
import { templates, templateList } from '../../utils/templates';
import { transpileWorker } from '../../compiler.worker';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
})
export class AppRoot {
  file: HTMLInputElement;
  sourceCodeInput: HTMLTextAreaElement;
  transpiledInput: HTMLTextAreaElement;
  bundledInput: HTMLTextAreaElement;
  htmlCodeInput: HTMLTextAreaElement;
  componentMetadata: HTMLSelectElement;
  proxy: HTMLSelectElement;
  module: HTMLSelectElement;
  target: HTMLSelectElement;
  sourceMap: HTMLSelectElement;
  style: HTMLSelectElement;
  styleImportData: HTMLSelectElement;
  componentExport: HTMLSelectElement;
  coreImportPath: HTMLSelectElement;
  build: HTMLSelectElement;
  fileTemplate: HTMLSelectElement;
  transpilerThread: HTMLSelectElement;
  iframe: HTMLIFrameElement;

  fs = new Map<string, string>();
  resolveLookup = new Map<string, string>();

  @State() wrap = 'off';
  @State() buildView: 'transpiled' | 'bundled' = 'transpiled';
  @State() minified: 'uncompressed' | 'pretty' | 'minified' = 'uncompressed';
  @State() bundledLength = 0;
  @State() diagnostics: any = [];

  componentWillLoad() {
    return loadDeps(this.resolveLookup, this.fs);
  }

  async componentDidLoad() {
    this.loadTemplate(templates.keys().next().value);
  }

  loadTemplate(fileName: string) {
    this.file.value = fileName;
    const tmp = templates.get(fileName);
    this.sourceCodeInput.value = tmp.source.trim();
    this.htmlCodeInput.value = tmp.html.trim();
    this.compile();
  }

  async compile() {
    console.log(`compile: stencil v${stencil.version}, typescript v${stencil.versions.typescript}`);

    const opts: StencilTypes.TranspileOptions = {
      file: this.file.value,
      componentExport: this.componentExport.value,
      componentMetadata: this.componentMetadata.value,
      coreImportPath: this.coreImportPath.value !== 'null' ? this.coreImportPath.value : null,
      proxy: this.proxy.value,
      module: this.module.value,
      target: this.target.value,
      sourceMap: this.sourceMap.value === 'true' ? true : this.sourceMap.value === 'inline' ? 'inline' : false,
      style: this.style.value,
      styleImportData: this.styleImportData.value,
    };

    const browserPromise = stencil.transpile(this.sourceCodeInput.value, opts);
    const workerPromise = transpileWorker(this.sourceCodeInput.value, opts);

    const browserResults = await browserPromise;
    const workerResults = await workerPromise;

    const results = this.transpilerThread.value === 'worker' ? workerResults : browserResults;

    results.imports.forEach((imprt) => {
      console.log('import:', imprt);
    });

    this.transpiledInput.value = results.code;
    this.diagnostics = results.diagnostics;
    this.wrap = 'off';

    this.diagnostics.forEach((d: any) => {
      if (d.level === 'error') {
        console.error(d.messageText);
      } else if (d.level === 'warn') {
        console.warn(d.messageText);
      } else {
        console.info(d.messageText);
      }
    });

    await this.bundle();
  }

  async bundle() {
    console.log(`bundle: rollup v${rollup.VERSION}`);

    let entryId = this.file.value;
    if (!entryId.startsWith('/')) {
      entryId = '/' + entryId;
    }

    this.fs.set(entryId, this.transpiledInput.value);

    const inputOptions: RollupTypes.InputOptions = {
      input: entryId,
      treeshake: true,
      plugins: [
        {
          name: 'browserPlugin',
          resolveId: (importee: string, importer: string) => {
            console.log('bundle resolveId, importee:', importee, 'importer:', importer);

            if (importee.startsWith('.')) {
              var u = new URL(importee, 'http://url.resolve' + (importer || ''));
              console.log('bundle path resolve:', u.pathname);
              return u.pathname + u.search;
            }

            const resolved = this.resolveLookup.get(importee);
            if (resolved) {
              console.log('bundle resolveLookup:', resolved);
              return resolved;
            }
            return importee;
          },
          load: (id: string) => {
            console.log('bundle load:', id);
            const code = this.fs.get(id.split('?')[0]);
            return code;
          },
        },
        cssTemplatePlugin,
      ],
      onwarn(warning: any) {
        console.group(warning.loc ? warning.loc.file : '');
        console.warn(warning.message);
        if (warning.frame) {
          console.log(warning.frame);
        }
        if (warning.url) {
          console.log(`See ${warning.url} for more information`);
        }
        console.groupEnd();
      },
    };

    const generateOptions: RollupTypes.OutputOptions = {
      format: this.module.value as any,
    };

    try {
      const build = await rollup.rollup(inputOptions);
      const generated = await build.generate(generateOptions);

      this.bundledInput.value = generated.output[0].code;
      this.wrap = 'off';

      if (this.minified === 'minified') {
        const results = await stencil.optimizeJs({
          input: this.bundledInput.value,
          target: this.target.value as any,
          pretty: false,
        });
        this.bundledInput.value = results.output;
        this.wrap = 'on';
      } else if (this.minified === 'pretty') {
        const results = await stencil.optimizeJs({
          input: this.bundledInput.value,
          target: this.target.value as any,
          pretty: true,
        });
        this.bundledInput.value = results.output;
      }

      this.preview();
    } catch (e: unknown) {
      this.bundledInput.value = e.toString();

      if (this.isRollupLogProps(e)) {
        if (e.loc?.file) {
          this.bundledInput.value += '\n\n\n' + e.loc.file;
        }

        if (e.frame) {
          this.bundledInput.value += '\n\n\n' + e.frame;
        }
      }
      this.wrap = 'on';
      this.iframe.contentWindow.document.body.innerHTML = '';
    }
  }

  /**
   * Type guard to verify the shape of some value that was caught during the bundling process is of type,
   * `RollupLogProps`, the base type of both `RollupWarning` and `RollupError`.
   *
   * At the time of this writing, the only requirement for a `RollupLogProps` entity is for it to have a
   * `message: string` property.
   *
   * @param entity the error that was caught
   * @returns `true` if the `entity` parameter is of type `RollupLogProps`, `false` otherwise
   */
  private isRollupLogProps(entity: unknown): entity is RollupTypes.RollupLog {
    return this.isObjectWithMessage(entity) && typeof entity.message === 'string';
  }

  /**
   * Type guard to verify an object has a 'message' field
   * @param entity the entity to test
   * @returns `true` if the `entity` parameter matches the type declared in the method signature, `false` otherwise
   */
  private isObjectWithMessage(entity: unknown): entity is { message: unknown } {
    return entity != null && typeof entity === 'object' && entity.hasOwnProperty('message');
  }

  preview() {
    console.log('preview reload');
    this.bundledLength = this.bundledInput.value.length;

    this.iframe.contentWindow.location.reload();

    (window as any).bundledInput = this.bundledInput.value;
    (window as any).htmlCodeInput = this.htmlCodeInput.value;

    setTimeout(() => {
      console.log('preview update');
      const doc = this.iframe.contentDocument;

      const script = doc.createElement('script');
      script.setAttribute('type', 'module');
      script.innerHTML = this.bundledInput.value;
      doc.head.appendChild(script);

      doc.body.innerHTML = this.htmlCodeInput.value;
    }, 20);
  }

  openInWindow = () => {
    window.open('/preview.html', '_blank');
  };

  render() {
    return (
      <Host>
        <section class="source">
          <header>Source</header>
          <textarea
            spellcheck="false"
            wrap="off"
            autocapitalize="off"
            ref={(el) => (this.sourceCodeInput = el)}
            onInput={() => this.compile()}
          />

          <div class="options">
            <label>
              <span>Templates:</span>
              <select
                ref={(el) => (this.fileTemplate = el)}
                onInput={(ev: any) => {
                  this.loadTemplate(ev.target.value);
                }}
              >
                {templateList.map((fileName) => (
                  <option value={fileName}>{fileName.replace('.tsx', '')}</option>
                ))}
              </select>
            </label>
            <label>
              <span>File:</span>
              <input ref={(el) => (this.file = el)} onInput={this.compile.bind(this)} />
            </label>
            <label>
              <span>Export:</span>
              <select ref={(el) => (this.componentExport = el)} onInput={this.compile.bind(this)}>
                <option value="customelement">customelement</option>
                <option value="module">module</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Module:</span>
              <select ref={(el) => (this.module = el)} onInput={this.compile.bind(this)}>
                <option value="esm">esm</option>
                <option value="cjs">cjs</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Target:</span>
              <select ref={(el) => (this.target = el)} onInput={this.compile.bind(this)}>
                <option value="latest">latest</option>
                <option value="esnext">esnext</option>
                <option value="es2020">es2020</option>
                <option value="es2017">es2017</option>
                <option value="es2015">es2015</option>
                <option value="es5">es5</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Source Map:</span>
              <select ref={(el) => (this.sourceMap = el)} onInput={this.compile.bind(this)}>
                <option value="true">true</option>
                <option value="inline">inline</option>
                <option value="false">false</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Style:</span>
              <select ref={(el) => (this.style = el)} onInput={this.compile.bind(this)}>
                <option value="static">static</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Style Import Data:</span>
              <select ref={(el) => (this.styleImportData = el)} onInput={this.compile.bind(this)}>
                <option value="queryparams">queryparams</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Proxy:</span>
              <select ref={(el) => (this.proxy = el)} onInput={this.compile.bind(this)}>
                <option value="defineproperty">defineproperty</option>
                <option value="null">null</option>
              </select>
            </label>
            <label>
              <span>Metadata:</span>
              <select ref={(el) => (this.componentMetadata = el)} onInput={this.compile.bind(this)}>
                <option value="null">null</option>
                <option value="compilerstatic">compilerstatic</option>
              </select>
            </label>
            <label>
              <span>Core:</span>
              <select ref={(el) => (this.coreImportPath = el)} onInput={this.compile.bind(this)}>
                <option value="null">null</option>
                <option value="@stencil/core/internal/client">@stencil/core/internal/client</option>
                <option value="@stencil/core/internal/testing">@stencil/core/internal/testing</option>
              </select>
            </label>
            <label>
              <span>Transpiler:</span>
              <select ref={(el) => (this.transpilerThread = el)} onInput={this.compile.bind(this)}>
                <option value="main">Main thread</option>
                <option value="worker">Worker thread</option>
              </select>
            </label>
          </div>
        </section>

        <section class="build" hidden={this.diagnostics.length > 0}>
          <header>{this.buildView === 'transpiled' ? 'Transpiled Build' : 'Bundled Build'}</header>

          <textarea
            ref={(el) => (this.transpiledInput = el)}
            onInput={this.bundle.bind(this)}
            hidden={this.buildView !== 'transpiled'}
            spellcheck="false"
            autocapitalize="off"
            wrap="off"
          />

          <textarea
            ref={(el) => (this.bundledInput = el)}
            onInput={this.preview.bind(this)}
            hidden={this.buildView !== 'bundled'}
            spellcheck="false"
            autocapitalize="off"
            wrap={this.wrap}
          />

          <div class="options">
            <label>
              <span>Build:</span>
              <select
                ref={(el) => (this.build = el)}
                onInput={(ev: any) => {
                  this.buildView = ev.target.value;
                }}
              >
                <option value="transpiled">Transpiled</option>
                <option value="bundled">Bundled</option>
              </select>
            </label>

            <label hidden={this.buildView !== 'bundled'}>
              <span>Minify:</span>
              <select
                onInput={(ev: any) => {
                  this.minified = ev.target.value;
                  this.bundle();
                }}
              >
                <option value="uncompressed">Uncompressed</option>
                <option value="pretty">Pretty Minified</option>
                <option value="minified">Minified</option>
              </select>
              <span class="file-size">{this.bundledLength} b</span>
            </label>
          </div>
        </section>

        <section class="diagnostics" hidden={this.diagnostics.length === 0}>
          <header>Diagnostics</header>
          {this.diagnostics.map((d: any) => (
            <div>{d.messageText}</div>
          ))}
        </section>

        <section class="preview">
          <header>HTML</header>
          <textarea
            spellcheck="false"
            wrap="off"
            autocapitalize="off"
            ref={(el) => (this.htmlCodeInput = el)}
            onInput={this.preview.bind(this)}
          />
          <div class="options"></div>

          <div class="view">
            <header>
              Preview
              <a href="#" onClick={this.openInWindow}>
                Open in window
              </a>
            </header>
            <iframe ref={(el) => (this.iframe = el)}></iframe>
          </div>
        </section>
      </Host>
    );
  }
}

declare const stencil: typeof StencilTypes;
declare const ts: typeof TypeScriptTypes;
declare const rollup: typeof RollupTypes;
