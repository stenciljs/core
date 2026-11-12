import type * as d from '@stencil/core';
import type { RolldownOutput } from 'rolldown';

import { SSR_PROP_REF_PREFIX, SSR_PROPS_REGISTRY_KEY } from '../../../runtime/runtime-constants';
import { hasError, join } from '../../../utils';
import { optimizeModule } from '../../optimize/optimize-module';
import { relocateSsrContextConst } from './relocate-ssr-context';
import { MODE_RESOLVER_DECLARATION } from './ssr-factory-closure';

/**
 * Applies post-processing transforms shared by both the `ssr` and `ssr-wasm` output targets.
 * Must be called on each chunk's code before writing to disk or passing to extism / javy.
 *
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param code The generated code for a single chunk output by Rolldown.
 * @returns The post-processed code.
 */
export const postProcessSsrCode = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  code: string,
): string => {
  code = relocateSsrContextConst(config, compilerCtx, code);

  code = code.replace(`//! let ${MODE_RESOLVER_DECLARATION}`, `let ${MODE_RESOLVER_DECLARATION}`);

  const tagTransformFunctionPattern = /function (setTagTransformer|transformTag)\(/;
  if (tagTransformFunctionPattern.test(code)) {
    const injectCode = `\nvar $stencilTagTransform = { setTagTransformer: setTagTransformer, transformTag: transformTag };\n`;
    const lastTransformTagIndex = code.lastIndexOf('function transformTag(');
    const lastSetTagTransformerIndex = code.lastIndexOf('function setTagTransformer(');
    const injectionPoint = Math.max(lastTransformTagIndex, lastSetTagTransformerIndex);

    if (injectionPoint !== -1) {
      let braceCount = 0;
      let foundStart = false;
      let injectionIndex = injectionPoint;
      for (let i = injectionPoint; i < code.length; i++) {
        if (code[i] === '{') {
          foundStart = true;
          braceCount++;
        } else if (code[i] === '}') {
          braceCount--;
          if (foundStart && braceCount === 0) {
            injectionIndex = i + 1;
            break;
          }
        }
      }
      code = code.slice(0, injectionIndex) + injectCode + code.slice(injectionIndex);
    }
  }

  return code;
};

/**
 * Writes the generated SSR app code to disk for each SSR output target.
 * @param config The validated Stencil configuration.
 * @param compilerCtx The compiler context.
 * @param buildCtx The build context.
 * @param outputTargets The array of SSR output targets.
 * @param rolldownOutput The Rolldown output containing the generated code.
 * @returns A promise that resolves when all SSR outputs have been written.
 */
export const writeSsrOutputs = (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTargets: d.OutputTargetSsr[],
  rolldownOutput: RolldownOutput,
) => {
  return Promise.all(
    outputTargets.map((outputTarget) => {
      return writeSsrOutput(config, compilerCtx, buildCtx, outputTarget, rolldownOutput);
    }),
  );
};

const writeSsrOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  outputTarget: d.OutputTargetSsr,
  rolldownOutput: RolldownOutput,
) => {
  const hydrateAppDirPath = outputTarget.dir;
  if (!hydrateAppDirPath) {
    throw new Error(`outputTarget config missing the "dir" property`);
  }

  await copySsrRunnerDts(config, compilerCtx, hydrateAppDirPath);
  await writeSsrPropModule(compilerCtx, hydrateAppDirPath, outputTarget.cjs === true);

  // always remember a path to the hydrate app that the prerendering may need later on
  buildCtx.ssrAppFilePath = join(hydrateAppDirPath, 'index.js');
  const minify = outputTarget.minify === true;

  await Promise.all(
    rolldownOutput.output.map(async (output) => {
      if (output.type === 'chunk') {
        let code = postProcessSsrCode(config, compilerCtx, output.code);

        if (minify) {
          const optimizeResults = await optimizeModule(config, compilerCtx, {
            input: code,
            isCore: output.isEntry,
            minify,
          });

          buildCtx.diagnostics.push(...optimizeResults.diagnostics);
          if (
            !hasError(optimizeResults.diagnostics) &&
            typeof optimizeResults.output === 'string'
          ) {
            code = optimizeResults.output;
          }
        }

        const filePath = join(hydrateAppDirPath, output.fileName);
        await compilerCtx.fs.writeFile(filePath, code, { immediateWrite: true });
      }
    }),
  );
};

const copySsrRunnerDts = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  hydrateAppDirPath: string,
) => {
  const packageDir = join(config.sys.getCompilerExecutingPath(), '..', '..');
  const srcSsrDir = join(packageDir, 'runtime', 'server', 'runner.d.mts');

  const runnerDtsDestPath = join(hydrateAppDirPath, 'index.d.ts');

  const dts = await config.sys.readFile(srcSsrDir);
  if (dts == null) return;
  await compilerCtx.fs.writeFile(runnerDtsDestPath, stripSideEffectImports(dts), {
    immediateWrite: true,
  });
};

/**
 * The bundled runner types keep bare imports (`import "rolldown";`) of modules whose types were
 * tree-shaken away. They declare nothing, but a library's consumers won't have those packages
 * (often not even `@stencil/core`), which breaks under `noUncheckedSideEffectImports`.
 * @param dts the runner's `.d.mts` contents
 * @returns the contents without bare imports
 */
export const stripSideEffectImports = (dts: string) =>
  dts.replace(/^import\s*["'][^"']+["'];?[ \t]*\r?\n/gm, '');

const SSR_PROP_JS = `const PREFIX = ${JSON.stringify(SSR_PROP_REF_PREFIX)};
const REGISTRY = Symbol.for(${JSON.stringify(SSR_PROPS_REGISTRY_KEY)});
// a value nothing picked up (the page never reached renderToString()) is dropped after this long
const TTL = 60000;
let nextSweep = 0;

/**
 * Pass a value to a component's property from a framework template, so it reaches the component
 * when it's rendered on the server too. In the browser, returns the value. On the server, keeps
 * the value and returns a reference to it, which the template renders as an attribute and the
 * SSR module (in the same process) turns back into the value. Getting it on to the browser is the
 * prop's job: @Prop({ serialize: 'json' }), or a @PropSerialize() / @AttrDeserialize() pair.
 */
export function ssrProp(value) {
  if (typeof window !== 'undefined') return value;
  const registry = globalThis[REGISTRY] || (globalThis[REGISTRY] = new Map());
  const now = Date.now();
  if (now > nextSweep) {
    nextSweep = now + TTL;
    for (const [id, entry] of registry) if (entry.expires < now) registry.delete(id);
  }
  const id = globalThis.crypto && globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2) + now.toString(36);
  registry.set(id, { value, expires: now + TTL });
  return PREFIX + id;
}
`;

const SSR_PROP_DTS = `/**
 * Pass a value to a component's property from a framework template, so it reaches the component
 * when it's rendered on the server too.
 *
 * \`\`\`vue
 * <my-chart :data="ssrProp(data)" />
 * \`\`\`
 *
 * In the browser, returns the value. On the server, keeps the value and returns a reference to it
 * (a string the template renders as an attribute), which the SSR module turns back into the
 * value. Nothing is serialized, so any value works: a \`Map\`, a \`Date\`, a class instance.
 *
 * The SSR module must render the page in the same process, soon after the template runs: the
 * whole-document \`renderToString()\` hook every framework integration uses.
 *
 * This gets the value into the server render only. For the component to have it when it first
 * renders in the browser too, before the framework sets the property, the prop needs to carry it
 * in its attribute: \`@Prop({ serialize: 'json' })\`, or a \`@PropSerialize()\` /
 * \`@AttrDeserialize()\` pair for other formats. Without either, \`renderToString()\` adds a
 * warning to its \`diagnostics\`.
 * @param value the property value
 * @returns \`value\` in the browser, a reference to it (a string) typed as \`T\` on the server
 */
export declare function ssrProp<T>(value: T): T;
`;

/**
 * Write `ssr-prop.js` (`./ssr-prop` in export maps): `ssrProp()`, for framework templates. It runs
 * on both server and client, so it's separate from the server-only SSR module.
 * @param compilerCtx the compiler context
 * @param dir the ssr output directory
 * @param cjs whether to also write a CommonJS copy
 */
const writeSsrPropModule = async (compilerCtx: d.CompilerCtx, dir: string, cjs: boolean) => {
  const opts = { immediateWrite: true };
  await compilerCtx.fs.writeFile(join(dir, 'ssr-prop.js'), SSR_PROP_JS, opts);
  await compilerCtx.fs.writeFile(join(dir, 'ssr-prop.d.ts'), SSR_PROP_DTS, opts);
  if (cjs) {
    const cjsCode =
      SSR_PROP_JS.replace('export function ssrProp', 'function ssrProp') +
      'exports.ssrProp = ssrProp;\n';
    await compilerCtx.fs.writeFile(join(dir, 'ssr-prop.cjs'), cjsCode, opts);
  }
};
