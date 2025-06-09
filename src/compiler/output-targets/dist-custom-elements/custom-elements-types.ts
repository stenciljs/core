import { dashToPascalCase, isOutputTargetDistCustomElements, join, normalizePath, relative } from '@utils';
import { dirname } from 'path';

import type * as d from '../../../declarations';

/**
 * Entrypoint for generating types for one or more `dist-custom-elements` output targets defined in a Stencil project's
 * configuration
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param typesDir the path to the directory where type declarations are saved
 */
export const generateCustomElementsTypes = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  typesDir: string,
): Promise<void> => {
  const outputTargets = config.outputTargets.filter(isOutputTargetDistCustomElements);

  await Promise.all(
    outputTargets.map((outputTarget) =>
      generateCustomElementsTypesOutput(config, compilerCtx, buildCtx, typesDir, outputTarget),
    ),
  );
};

/**
 * Generates types for a single `dist-custom-elements` output target definition in a Stencil project's configuration
 *
 * @param config the Stencil configuration associated with the project being compiled
 * @param compilerCtx the current compiler context
 * @param buildCtx the context associated with the current build
 * @param typesDir path to the directory where type declarations are saved
 * @param outputTarget the output target for which types are being currently generated
 */
const generateCustomElementsTypesOutput = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
  typesDir: string,
  outputTarget: d.OutputTargetDistCustomElements,
) => {
  const isBarrelExport = outputTarget.customElementsExportBehavior === 'single-export-module';
  const isBundleExport = outputTarget.customElementsExportBehavior === 'bundle';

  // the path where we're going to write the typedef for the whole dist-custom-elements output
  const customElementsDtsPath = join(outputTarget.dir!, 'index.d.ts');
  // the directory where types for the individual components are written
  const componentsTypeDirectoryRelPath = relative(outputTarget.dir!, typesDir);

  const components = buildCtx.components.filter((m) => !m.isCollectionDependency);

  const code = [
    // To mirror the index.js file and only export the typedefs for the
    // entities exported there, we will re-export the typedefs iff
    // the `customElementsExportBehavior` is set to barrel component exports
    ...(isBarrelExport
      ? [
          `/* ${config.namespace} custom elements */`,
          ...components.map((component) => {
            const exportName = dashToPascalCase(component.tagName);
            const importName = component.componentClassName;

            // typedefs for individual components can be found under paths like
            // $TYPES_DIR/components/my-component/my-component.d.ts
            //
            // To construct this path we:
            //
            // - get the relative path to the component's source file from the source directory
            // - join that relative path to the relative path from the `index.d.ts` file to the
            //   directory where typedefs are saved
            const componentSourceRelPath = relative(config.srcDir, component.sourceFilePath).replace(/\.tsx$/, '');
            const componentDTSPath = join(componentsTypeDirectoryRelPath, componentSourceRelPath);

            const defineFunctionExportName = `defineCustomElement${exportName}`;
            // Get the path to the sibling typedef file for the current component
            // When we bundle the code to generate the component JS files it generates
            // the JS and typedef files based on the component tag name. So, we can
            // just use the tagname to create the relative path
            const localComponentTypeDefFilePath = `./${component.tagName}`;

            return [
              `export { ${importName} as ${exportName} } from '${
                componentDTSPath.startsWith('.') ? componentDTSPath : './' + componentDTSPath
              }';`,
              // We need to alias each `defineCustomElement` function typedef to match the aliased name given to the
              // function in the `index.js`
              `export { defineCustomElement as ${defineFunctionExportName} } from '${localComponentTypeDefFilePath}';`,
            ].join('\n');
          }),
          ``,
        ]
      : []),
    `/**`,
    ` * Get the base path to where the assets can be found. Use "setAssetPath(path)"`,
    ` * if the path needs to be customized.`,
    ` */`,
    `export declare const getAssetPath: (path: string) => string;`,
    ``,
    `/**`,
    ` * Used to manually set the base path where assets can be found.`,
    ` * If the script is used as "module", it's recommended to use "import.meta.url",`,
    ` * such as "setAssetPath(import.meta.url)". Other options include`,
    ` * "setAssetPath(document.currentScript.src)", or using a bundler's replace plugin to`,
    ` * dynamically set the path at build time, such as "setAssetPath(process.env.ASSET_PATH)".`,
    ` * But do note that this configuration depends on how your script is bundled, or lack of`,
    ` * bundling, and where your assets can be loaded from. Additionally custom bundling`,
    ` * will have to ensure the static assets are copied to its build directory.`,
    ` */`,
    `export declare const setAssetPath: (path: string) => void;`,
    ``,
    `/**`,
    ` * Used to specify a nonce value that corresponds with an application's CSP.`,
    ` * When set, the nonce will be added to all dynamically created script and style tags at runtime.`,
    ` * Alternatively, the nonce value can be set on a meta tag in the DOM head`,
    ` * (<meta name="csp-nonce" content="{ nonce value here }" />) which`,
    ` * will result in the same behavior.`,
    ` */`,
    `export declare const setNonce: (nonce: string) => void`,
    ``,
    `export interface SetPlatformOptions {`,
    `  raf?: (c: FrameRequestCallback) => number;`,
    `  ael?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;`,
    `  rel?: (el: EventTarget, eventName: string, listener: EventListenerOrEventListenerObject, options: boolean | AddEventListenerOptions) => void;`,
    `}`,
    `export declare const setPlatformOptions: (opts: SetPlatformOptions) => void;`,
    ...(isBundleExport
      ? [
          ``,
          `/**`,
          ` * Utility to define all custom elements within this package using the tag name provided in the component's source.`,
          ` * When defining each custom element, it will also check it's safe to define by:`,
          ` *`,
          ` * 1. Ensuring the "customElements" registry is available in the global context (window).`,
          ` * 2. Ensuring that the component tag name is not already defined.`,
          ` *`,
          ` * Use the standard [customElements.define()](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define)`,
          ` * method instead to define custom elements individually, or to provide a different tag name.`,
          ` */`,
          `export declare const defineCustomElements: (opts?: any) => void;`,
        ]
      : []),
  ];

  const componentsDtsRelPath = relDts(outputTarget.dir!, join(typesDir, 'components.d.ts'));

  // To mirror the index.js file and only export the typedefs for the
  // entities exported there, we will re-export the typedefs iff
  // the `customElementsExportBehavior` is set to barrel component exports
  if (isBarrelExport) {
    // If there is an `index.ts` file in the src directory, we'll re-export anything
    // exported from that file
    // Otherwise, we'll export everything from the auto-generated `components.d.ts`
    // file in the output directory
    const usersIndexJsPath = join(config.srcDir, 'index.ts');
    const hasUserIndex = await compilerCtx.fs.access(usersIndexJsPath);
    if (hasUserIndex) {
      const userIndexRelPath = normalizePath(dirname(componentsDtsRelPath));
      code.push(`export * from '${userIndexRelPath}';`);
    } else {
      code.push(`export * from '${componentsDtsRelPath}';`);
    }
  }

  await compilerCtx.fs.writeFile(customElementsDtsPath, code.join('\n') + `\n`, {
    outputTargetType: outputTarget.type,
  });

  await Promise.all(
    components.map(async (cmp) => {
      const dtsCode = generateCustomElementType(componentsDtsRelPath, cmp);
      const fileName = `${cmp.tagName}.d.ts`;
      const filePath = join(outputTarget.dir!, fileName);
      await compilerCtx.fs.writeFile(filePath, dtsCode, { outputTargetType: outputTarget.type });
    }),
  );
};

/**
 * Generate a type declaration file for a specific Stencil component
 * @param componentsDtsRelPath the path to a root type declaration file from which commonly used entities can be
 * referenced from in the newly generated file
 * @param cmp the component to generate the type declaration file for
 * @returns the contents of the type declaration file for the provided `cmp`
 */
const generateCustomElementType = (componentsDtsRelPath: string, cmp: d.ComponentCompilerMeta): string => {
  const tagNameAsPascal = dashToPascalCase(cmp.tagName);
  const o: string[] = [
    `import type { Components, JSX } from "${componentsDtsRelPath}";`,
    ``,
    `interface ${tagNameAsPascal} extends Components.${tagNameAsPascal}, HTMLElement {}`,
    `export const ${tagNameAsPascal}: {`,
    `    prototype: ${tagNameAsPascal};`,
    `    new (): ${tagNameAsPascal};`,
    `};`,
    `/**`,
    ` * Used to define this component and all nested components recursively.`,
    ` */`,
    `export const defineCustomElement: () => void;`,
    ``,
  ];

  return o.join('\n');
};

/**
 * Determines the relative path between two provided paths. If a type declaration file extension is present on
 * `dtsPath`, it will be removed from the computed relative path.
 * @param fromPath the path from which to start at
 * @param dtsPath the destination path
 * @returns the relative path from the provided `fromPath` to the `dtsPath`
 */
const relDts = (fromPath: string, dtsPath: string): string => {
  dtsPath = relative(fromPath, dtsPath);

  return normalizePath(dtsPath.replace('.d.ts', ''), true);
};
