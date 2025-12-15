import type { ConfigFlags } from '../cli/config-flags';
import type { PrerenderUrlResults, PrintLine } from '../internal';
import type { BuildCtx, CompilerCtx } from './stencil-private';
import type { JsonDocs } from './stencil-public-docs';
import type { ResolutionHandler } from './stencil-public-runtime';

export * from './stencil-public-docs';

/**
 * https://stenciljs.com/docs/config/
 */
export interface StencilConfig {
  /**
   * By default, Stencil will attempt to optimize small scripts by inlining them in HTML. Setting
   * this flag to `false` will prevent this optimization and keep all scripts separate from HTML.
   */
  allowInlineScripts?: boolean;
  /**
   * By setting `autoprefixCss` to `true`, Stencil will use the appropriate config to automatically
   * prefix css. For example, developers can write modern and standard css properties, such as
   * "transform", and Stencil will automatically add in the prefixed version, such as "-webkit-transform".
   * As of Stencil v2, autoprefixing CSS is no longer the default.
   * Defaults to `false`
   */
  autoprefixCss?: boolean | any;

  /**
   * By default, Stencil will statically analyze the application and generate a component graph of
   * how all the components are interconnected.
   *
   * From the component graph it is able to best decide how components should be grouped
   * depending on their usage with one another within the app.
   * By doing so it's able to bundle components together in order to reduce network requests.
   * However, bundles can be manually generated using the bundles config.
   *
   * The bundles config is an array of objects that represent how components are grouped together
   * in lazy-loaded bundles.
   * This config is rarely needed as Stencil handles this automatically behind the scenes.
   */
  bundles?: ConfigBundle[];

  /**
   * Stencil will cache build results in order to speed up rebuilds.
   * To disable this feature, set enableCache to false.
   */
  enableCache?: boolean;
  /**
   * The directory where sub-directories will be created for caching when `enableCache` is set
   * `true` or if using Stencil's Screenshot Connector.
   *
   * @default '.stencil'
   *
   * @example
   *
   * A Stencil config like the following:
   * ```ts
   * export const config = {
   *  ...,
   *  enableCache: true,
   *  cacheDir: '.cache',
   *  testing: {
   *    screenshotConnector: 'connector.js'
   *  }
   * }
   * ```
   *
   * Will result in the following file structure:
   * ```tree
   * stencil-project-root
   * └── .cache
   *     ├── .build <-- Where build related file caching is written
   *     |
   *     └── screenshot-cache.json <-- Where screenshot caching is written
   * ```
   */
  cacheDir?: string;

  /**
   * Stencil is traditionally used to compile many components into an app,
   * and each component comes with its own compartmentalized styles.
   * However, it's still common to have styles which should be "global" across all components and the website.
   * A global CSS file is often useful to set CSS Variables.
   *
   * Additionally, the globalStyle config can be used to precompile styles with Sass, PostCSS, etc.
   * Below is an example folder structure containing a webapp's global sass file, named app.css.
   */
  globalStyle?: string;

  /**
   * Will generate {@link https://nodejs.org/api/packages.html#packages_exports export map} entry points
   * for each component in the build when `true`.
   *
   * @default false
   */
  generateExportMaps?: boolean;

  /**
   * When the hashFileNames config is set to true, and it is a production build,
   * the hashedFileNameLength config is used to determine how many characters the file name's hash should be.
   */
  hashedFileNameLength?: number;

  /**
   * During production builds, the content of each generated file is hashed to represent the content,
   * and the hashed value is used as the filename. If the content isn't updated between builds,
   * then it receives the same filename. When the content is updated, then the filename is different.
   *
   * By doing this, deployed apps can "forever-cache" the build directory and take full advantage of
   * content delivery networks (CDNs) and heavily caching files for faster apps.
   */
  hashFileNames?: boolean;

  /**
   * The namespace config is a string representing a namespace for the app.
   * For apps that are not meant to be a library of reusable components,
   * the default of App is just fine. However, if the app is meant to be consumed
   * as a third-party library, such as Ionic, a unique namespace is required.
   */
  namespace?: string;

  /**
   * Stencil is able to take an app's source and compile it to numerous targets,
   * such as an app to be deployed on an http server, or as a third-party library
   * to be distributed on npm. By default, Stencil apps have an output target type of www.
   *
   * The outputTargets config is an array of objects, with types of www and dist.
   */
  outputTargets?: OutputTarget[];

  /**
   * The plugins config can be used to add your own rollup plugins.
   * By default, Stencil does not come with Sass or PostCSS support.
   * However, either can be added using the plugin array.
   */
  plugins?: any[];

  /**
   * Generate js source map files for all bundles
   */
  sourceMap?: boolean;

  /**
   * The srcDir config specifies the directory which should contain the source typescript files
   * for each component. The standard for Stencil apps is to use src, which is the default.
   */
  srcDir?: string;

  /**
   * Sets whether or not Stencil should transform path aliases set in a project's
   * `tsconfig.json` from the assigned module aliases to resolved relative paths.
   *
   * This behavior defaults to `true`, but may be opted-out of by setting this flag to `false`.
   */
  transformAliasedImportPaths?: boolean;
  /**
   * When `true`, Stencil will suppress diagnostics which warn about public members using reserved names
   * (for example, decorating a method named `focus` with `@Method()`). Defaults to `false`.
   */
  suppressReservedPublicNameWarnings?: boolean;
  /**
   * When `true`, we will validate a project's `package.json` based on the output target the user has designated
   * as `isPrimaryPackageOutputTarget: true` in their Stencil config.
   */
  validatePrimaryPackageOutputTarget?: boolean;

  /**
   * Passes custom configuration down to the "@rollup/plugin-commonjs" that Stencil uses under the hood.
   * For further information: https://stenciljs.com/docs/module-bundling
   */
  commonjs?: BundlingConfig;

  /**
   * Passes custom configuration down to the "@rollup/plugin-node-resolve" that Stencil uses under the hood.
   * For further information: https://stenciljs.com/docs/module-bundling
   */
  nodeResolve?: NodeResolveConfig;

  /**
   * Passes custom configuration down to rollup itself, not all rollup options can be overridden.
   */
  rollupConfig?: RollupConfig;

  /**
   * Sets if the ES5 build should be generated or not. Stencil generates a modern build without ES5,
   * whereas this setting to `true` will also create es5 builds for both dev and prod modes. Setting
   * `buildEs5` to `prod` will only build ES5 in prod mode. Basically if the app does not need to run
   * on legacy browsers (IE11 and Edge 18 and below), it's safe to not build ES5, which will also speed
   * up build times. Defaults to `false`.
   */
  buildEs5?: boolean | 'prod';

  /**
   * Sets if the JS browser files are minified or not. Stencil uses `terser` under the hood.
   * Defaults to `false` in dev mode and `true` in production mode.
   */
  minifyJs?: boolean;

  /**
   * Sets if the CSS is minified or not.
   * Defaults to `false` in dev mode and `true` in production mode.
   */
  minifyCss?: boolean;

  /**
   * Forces Stencil to run in `dev` mode if the value is `true` and `production` mode
   * if it's `false`.
   *
   * Defaults to `false` (ie. production) unless the `--dev` flag is used in the CLI.
   */
  devMode?: boolean;

  /**
   * Object to provide a custom logger. By default a `logger` is already provided for the
   * platform the compiler is running on, such as NodeJS or a browser.
   */
  logger?: Logger;

  /**
   * Config to add extra runtime for DOM features that require more polyfills. Note
   * that not all DOM APIs are fully polyfilled when using the slot polyfill. These
   * are opt-in since not all users will require the additional runtime.
   */
  extras?: ConfigExtras;

  /**
   * The hydrated flag identifies if a component and all of its child components
   * have finished hydrating. This helps prevent any flash of unstyled content (FOUC)
   * as various components are asynchronously downloaded and rendered. By default it
   * will add the `hydrated` CSS class to the element. The `hydratedFlag` config can be used
   * to change the name of the CSS class, change it to an attribute, or change which
   * type of CSS properties and values are assigned before and after hydrating. This config
   * can also be used to not include the hydrated flag at all by setting it to `null`.
   */
  hydratedFlag?: HydratedFlag | null;

  /**
   * Ionic prefers to hide all components prior to hydration with a style tag appended
   * to the head of the document containing some `visibility: hidden;` css rules.
   *
   * Disabling this will remove the style tag that sets `visibility: hidden;` on all
   * un-hydrated web components. This more closely follows the HTML spec, and allows
   * you to set your own fallback content.
   *
   */
  invisiblePrehydration?: boolean;

  /**
   * Sets the task queue used by stencil's runtime. The task queue schedules DOM read and writes
   * across the frames to efficiently render and reduce layout thrashing. By default,
   * `async` is used. It's recommended to also try each setting to decide which works
   * best for your use-case. In all cases, if your app has many CPU intensive tasks causing the
   * main thread to periodically lock-up, it's always recommended to try
   * [Web Workers](https://stenciljs.com/docs/web-workers) for those tasks.
   *
   * - `async`: DOM read and writes are scheduled in the next frame to prevent layout thrashing.
   *   During intensive CPU tasks it will not reschedule rendering to happen in the next frame.
   *   `async` is ideal for most apps, and if the app has many intensive tasks causing the main
   *   thread to lock-up, it's recommended to try [Web Workers](https://stenciljs.com/docs/web-workers)
   *   rather than the congestion async queue.
   *
   * - `congestionAsync`: DOM reads and writes are scheduled in the next frame to prevent layout
   *   thrashing. When the app is heavily tasked and the queue becomes congested it will then
   *   split the work across multiple frames to prevent blocking the main thread. However, it can
   *   also introduce unnecessary reflows in some cases, especially during startup. `congestionAsync`
   *   is ideal for apps running animations while also simultaneously executing intensive tasks
   *   which may lock-up the main thread.
   *
   * - `immediate`: Makes writeTask() and readTask() callbacks to be executed synchronously. Tasks
   *   are not scheduled to run in the next frame, but do note there is at least one microtask.
   *   The `immediate` setting is ideal for apps that do not provide long running and smooth
   *   animations. Like the async setting, if the app has intensive tasks causing the main thread
   *   to lock-up, it's recommended to try [Web Workers](https://stenciljs.com/docs/web-workers).
   */
  taskQueue?: 'async' | 'immediate' | 'congestionAsync';

  /**
   * Provide a object of key/values accessible within the app, using the `Env` object.
   */
  env?: { [prop: string]: string | undefined };

  docs?: StencilDocsConfig;

  globalScript?: string;
  srcIndexHtml?: string;
  testing?: TestingConfig;
  maxConcurrentWorkers?: number;
  preamble?: string;
  rollupPlugins?: { before?: any[]; after?: any[] };

  entryComponentsHint?: string[];
  /**
   * Sets whether Stencil will write files to `dist/` during the build or not.
   *
   * By default this value is set to the opposite value of {@link devMode},
   * i.e. it will be `true` when building for production and `false` when
   * building for development.
   */
  buildDist?: boolean;
  buildLogFilePath?: string;
  devInspector?: boolean;
  devServer?: StencilDevServerConfig;
  sys?: CompilerSystem;
  tsconfig?: string;
  validateTypes?: boolean;

  /**
   * Sets whether Stencil will watch for changes in the source files and rebuild the project automatically.
   * @default true
   */
  watch?: boolean;
  /**
   * External directories to watch for changes. By default, Stencil will watch the root and {@link StencilConfig.srcDir}
   * directory for changes. If you want to watch additional directories, including e.g. `node_modules`, you can add them here.
   * @default []
   */
  watchExternalDirs?: string[];
  /**
   * An array of RegExp patterns that are matched against all source files before adding
   * to the watch list in watch mode. If the file path matches any of the patterns, when it
   * is updated, it will not trigger a re-run of tests.
   */
  watchIgnoredRegex?: RegExp | RegExp[];

  /**
   * Set whether unused dependencies should be excluded from the built output.
   */
  excludeUnusedDependencies?: boolean;
  stencilCoreResolvedId?: string;
}

interface ConfigExtrasBase {
  /**
   * Experimental flag. Projects that use a Stencil library built using the `dist` output target may have trouble lazily
   * loading components when using a bundler such as Vite or Parcel. Setting this flag to `true` will change how Stencil
   * lazily loads components in a way that works with additional bundlers. Setting this flag to `true` will increase
   * the size of the compiled output. Defaults to `false`.
   * @deprecated This flag has been deprecated in favor of `enableImportInjection`, which provides the same
   * functionality. `experimentalImportInjection` will be removed in a future major version of Stencil.
   */
  experimentalImportInjection?: boolean;

  /**
   * Projects that use a Stencil library built using the `dist` output target may have trouble lazily
   * loading components when using a bundler such as Vite or Parcel. Setting this flag to `true` will change how Stencil
   * lazily loads components in a way that works with additional bundlers. Setting this flag to `true` will increase
   * the size of the compiled output. Defaults to `false`.
   */
  enableImportInjection?: boolean;

  /**
   * Dispatches component lifecycle events. Mainly used for testing. Defaults to `false`.
   */
  lifecycleDOMEvents?: boolean;

  /**
   * It is possible to assign data to the actual `<script>` element's `data-opts` property,
   * which then gets passed to Stencil's initial bootstrap. This feature is only required
   * for very special cases and rarely needed. Defaults to `false`.
   * @deprecated This option has been deprecated and will be removed in a future major version of Stencil.
   */
  scriptDataOpts?: boolean;

  /**
   * When a component is first attached to the DOM, this setting will wait a single tick before
   * rendering. This works around an Angular issue, where Angular attaches the elements before
   * settings their initial state, leading to double renders and unnecessary event dispatches.
   * Defaults to `false`.
   */
  initializeNextTick?: boolean;

  /**
   * Enables the tagNameTransform option of `defineCustomElements()`, so the component tagName
   * can be customized at runtime. Defaults to `false`.
   * @deprecated This option has been deprecated in favour of `setTagTransformer` and `transformTag`. It will be removed in a future major version of Stencil.
   */
  tagNameTransform?: boolean;

  /**
   * Adds `transformTag` calls to css strings and querySelector(All) calls
   */
  additionalTagTransformers?: boolean | 'prod';

  // TODO(STENCIL-1086): remove this option when it's the default behavior
  /**
   * Experimental flag.
   * Updates the behavior of scoped components to align more closely with the behavior of the native
   * Shadow DOM when using `slot`s.
   * Defaults to `false`.
   */
  experimentalScopedSlotChanges?: boolean;

  /**
   * By default Stencil turns the stylesheet provided to `globalStyle` into a constructable stylesheet
   * and adds it to each component which can be useful for sharing styles efficiently across components.
   * In some cases this can be undesirable:
   * - If `globalStyle` is intended to configure the lightDOM only
   * - If `globalStyle` is large it can bloat the size of SSR output when using declarative-shadow-dom
   * Setting this to `false` will prevent Stencil from adding any `globalStyle` to each component.
   *
   * Defaults to `true`.
   */
  addGlobalStyleToComponents?: boolean;
}

// TODO(STENCIL-914): delete this interface when `experimentalSlotFixes` is the default behavior
type ConfigExtrasSlotFixes<ExperimentalFixesEnabled extends boolean, IndividualFlags extends boolean> = {
  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  /**
   * By default, the slot polyfill does not update `appendChild()` so that it appends
   * new child nodes into the correct child slot like how shadow dom works. This is an opt-in
   * polyfill for those who need it when using `element.appendChild(node)` and expecting the
   * child to be appended in the same location shadow dom would. This is not required for
   * IE11 or Edge 18, but can be enabled if the app is using `appendChild()`. Defaults to `false`.
   */
  appendChildSlotFix?: IndividualFlags;

  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  /**
   * By default, the runtime does not polyfill `cloneNode()` when cloning a component
   * that uses the slot polyfill. This is an opt-in polyfill for those who need it.
   * This is not required for IE11 or Edge 18, but can be enabled if the app is using
   * `cloneNode()` and unexpected node are being cloned due to the slot polyfill
   * simulating shadow dom. Defaults to `false`.
   */
  cloneNodeFix?: IndividualFlags;

  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  /**
   * Experimental flag to align the behavior of invoking `textContent` on a scoped component to act more like a
   * component that uses the shadow DOM. Defaults to `false`
   */
  scopedSlotTextContentFix?: IndividualFlags;

  // TODO(STENCIL-914): remove this option when `experimentalSlotFixes` is the default behavior
  /**
   * For browsers that do not support shadow dom (IE11 and Edge 18 and below), slot is polyfilled
   * to simulate the same behavior. However, the host element's `childNodes` and `children`
   * getters are not patched to only show the child nodes and elements of the default slot.
   * Defaults to `false`.
   */
  slotChildNodesFix?: IndividualFlags;

  // TODO(STENCIL-914): remove `experimentalSlotFixes` when it's the default behavior
  /**
   * Enables all slot-related fixes such as {@link slotChildNodesFix}, and
   * {@link scopedSlotTextContentFix}.
   */
  experimentalSlotFixes?: ExperimentalFixesEnabled;
};

export type ConfigExtras = ConfigExtrasBase &
  (ConfigExtrasSlotFixes<true, true> | ConfigExtrasSlotFixes<false, boolean>);

export interface Config extends StencilConfig {
  buildAppCore?: boolean;
  buildDocs?: boolean;
  configPath?: string;
  writeLog?: boolean;
  devServer?: DevServerConfig;
  flags?: ConfigFlags;
  fsNamespace?: string;
  logLevel?: LogLevel;
  rootDir?: string;
  packageJsonFilePath?: string;
  suppressLogs?: boolean;
  profile?: boolean;
  tsCompilerOptions?: any;
  tsWatchOptions?: any;
  _isValidated?: boolean;
  _isTesting?: boolean;
}

/**
 * A 'loose' type useful for wrapping an incomplete / possible malformed
 * object as we work on getting it comply with a particular Interface T.
 *
 * Example:
 *
 * ```ts
 * interface Foo {
 *   bar: string
 * }
 *
 * function validateFoo(foo: Loose<Foo>): Foo {
 *   let validatedFoo = {
 *     ...foo,
 *     bar: foo.bar || DEFAULT_BAR
 *   }
 *
 *   return validatedFoo
 * }
 * ```
 *
 * Use this when you need to take user input or something from some other part
 * of the world that we don't control and transform it into something
 * conforming to a given interface. For best results, pair with a validation
 * function as shown in the example.
 */
type Loose<T extends Object> = Record<string, any> & Partial<T>;

/**
 * A Loose version of the Config interface. This is intended to let us load a partial config
 * and have type information carry though as we construct an object which is a valid `Config`.
 */
export type UnvalidatedConfig = Loose<Config>;

/**
 * Helper type to strip optional markers from keys in a type, while preserving other type information for the key.
 * This type takes a union of keys, K, in type T to allow for the type T to be gradually updated.
 *
 * ```typescript
 * type Foo { bar?: number, baz?: string }
 * type ReqFieldFoo = RequireFields<Foo, 'bar'>; // { bar: number, baz?: string }
 * ```
 */
type RequireFields<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Fields in {@link Config} to make required for {@link ValidatedConfig}
 */
type StrictConfigFields = keyof Pick<
  Config,
  | 'buildEs5'
  | 'cacheDir'
  | 'devMode'
  | 'devServer'
  | 'extras'
  | 'flags'
  | 'fsNamespace'
  | 'hashFileNames'
  | 'hashedFileNameLength'
  | 'hydratedFlag'
  | 'logLevel'
  | 'logger'
  | 'minifyCss'
  | 'minifyJs'
  | 'namespace'
  | 'outputTargets'
  | 'packageJsonFilePath'
  | 'rollupConfig'
  | 'rootDir'
  | 'srcDir'
  | 'srcIndexHtml'
  | 'sys'
  | 'testing'
  | 'transformAliasedImportPaths'
  | 'validatePrimaryPackageOutputTarget'
>;

/**
 * A version of {@link Config} that makes certain fields required. This type represents a valid configuration entity.
 * When a configuration is received by the user, it is a bag of unverified data. In order to make stricter guarantees
 * about the data from a type-safety perspective, this type is intended to be used throughout the codebase once
 * validations have occurred at runtime.
 */
export type ValidatedConfig = RequireFields<Config, StrictConfigFields>;

export interface HydratedFlag {
  /**
   * Defaults to `hydrated`.
   */
  name?: string;
  /**
   * Can be either `class` or `attribute`. Defaults to `class`.
   */
  selector?: 'class' | 'attribute';
  /**
   * The CSS property used to show and hide components. Defaults to use the CSS `visibility`
   * property. Other commonly used CSS properties would be `display` with the `initialValue`
   * setting as `none`, or `opacity` with the `initialValue` as `0`. Defaults to `visibility`
   * and the default `initialValue` is `hidden`.
   */
  property?: string;
  /**
   * This is the CSS value to give all components before it has been hydrated.
   * Defaults to `hidden`.
   */
  initialValue?: string;
  /**
   * This is the CSS value to assign once a component has finished hydrating.
   * This is the CSS value that'll allow the component to show. Defaults to `inherit`.
   */
  hydratedValue?: string;
}

export interface StencilDevServerConfig {
  /**
   * IP address used by the dev server. The default is `0.0.0.0`, which points to all IPv4 addresses
   * on the local machine, such as `localhost`.
   */
  address?: string;
  /**
   * Base path to be used by the server. Defaults to the root pathname.
   */
  basePath?: string;
  /**
   * EXPERIMENTAL!
   * During development, node modules can be independently requested and bundled, making for
   * faster build times. This is only available using the Stencil Dev Server throughout
   * development. Production builds and builds with the `es5` flag will override
   * this setting to `false`. Default is `false`.
   */
  experimentalDevModules?: boolean;
  /**
   * If the dev server should respond with gzip compressed content. Defaults to `true`.
   */
  gzip?: boolean;
  /**
   * When set, the dev server will run via https using the SSL certificate and key you provide
   * (use `fs` if you want to read them from files).
   */
  https?: Credentials;
  /**
   * The URL the dev server should first open to. Defaults to `/`.
   */
  initialLoadUrl?: string;
  /**
   * When `true`, every request to the server will be logged within the terminal.
   * Defaults to `false`.
   */
  logRequests?: boolean;
  /**
   * By default, when dev server is started the local dev URL is opened in your default browser.
   * However, to prevent this URL to be opened change this value to `false`. Defaults to `true`.
   */
  openBrowser?: boolean;
  /**
   * Sets the server's port. Defaults to `3333`.
   */
  port?: number;
  /**
   * When files are watched and updated, by default the dev server will use `hmr` (Hot Module Replacement)
   * to update the page without a full page refresh. To have the page do a full refresh use `pageReload`.
   * To disable any reloading, use `null`. Defaults to `hmr`.
   */
  reloadStrategy?: PageReloadStrategy;
  /**
   * Local path to a NodeJs file with a dev server request listener as the default export.
   * The user's request listener is given the first chance to handle every request the dev server
   * receives, and can choose to handle it or instead pass it on to the default dev server
   * by calling `next()`.
   *
   * Below is an example of a NodeJs file the `requestListenerPath` config is using.
   * The request and response arguments are the same as Node's `http` module and `RequestListener`
   * callback. https://nodejs.org/api/http.html#http_http_createserver_options_requestlistener
   *
   * ```js
   * module.exports = function (req, res, next) {
   *    if (req.url === '/ping') {
   *      // custom response overriding the dev server
   *      res.setHeader('Content-Type', 'text/plain');
   *      res.writeHead(200);
   *      res.end('pong');
   *    } else {
   *      // pass request on to the default dev server
   *      next();
   *    }
   * };
   * ```
   */
  requestListenerPath?: string;
  /**
   * The root directory to serve the files from.
   */
  root?: string;
  /**
   * If the dev server should Server-Side Render (SSR) each page, meaning it'll dynamically generate
   * server-side rendered html on each page load. The `--ssr` flag will most commonly be used with
   * the`--dev --watch --serve` flags during development. Note that this is for development purposes
   * only, and the built-in dev server should not be used for production. Defaults to `false`.
   */
  ssr?: boolean;
  /**
   * If the dev server fails to start up within the given timeout (in milliseconds), the startup will
   * be canceled. Set to zero to disable the timeout. Defaults to `15000`.
   */
  startupTimeout?: number;
  /**
   * Whether to use the dev server's websocket client or not. Defaults to `true`.
   */
  websocket?: boolean;
  /**
   * If the dev server should fork a worker for the server process or not. A singled-threaded dev server
   * is slower, however it is useful for debugging http requests and responses. Defaults to `true`.
   */
  worker?: boolean;
}

export interface DevServerConfig extends StencilDevServerConfig {
  browserUrl?: string;
  devServerDir?: string;
  /**
   * A list of glob patterns like `subdir/*.js`  to exclude from hot-module
   * reloading updates.
   */
  excludeHmr?: string[];
  historyApiFallback?: HistoryApiFallback;
  openBrowser?: boolean;
  prerenderConfig?: string;
  protocol?: 'http' | 'https';
  srcIndexHtml?: string;

  /**
   * Route to be used for the "ping" sub-route of the Stencil dev server.
   * This route will return a 200 status code once the Stencil build has finished.
   * Setting this to `null` will disable the ping route.
   *
   * Defaults to `/ping`
   */
  pingRoute?: string | null;
}

export interface HistoryApiFallback {
  index?: string;
  disableDotRule?: boolean;
}

export interface DevServerEditor {
  id: string;
  name?: string;
  supported?: boolean;
  priority?: number;
}

export type TaskCommand =
  | 'build'
  | 'docs'
  | 'generate'
  | 'g'
  | 'help'
  | 'info'
  | 'prerender'
  | 'serve'
  | 'telemetry'
  | 'test'
  | 'version';

export type PageReloadStrategy = 'hmr' | 'pageReload' | null;

/**
 * The prerender config is used when prerendering a `www` output target.
 * Within `stencil.config.ts`, set the path to the prerendering
 * config file path using the `prerenderConfig` property, such as:
 *
 * ```tsx
 * import { Config } from '@stencil/core';
 * export const config: Config = {
 *   outputTargets: [
 *     {
 *       type: 'www',
 *       baseUrl: 'https://stenciljs.com/',
 *       prerenderConfig: './prerender.config.ts',
 *     }
 *   ]
 * };
 * ```
 *
 * The `prerender.config.ts` should export a `config` object using
 * the `PrerenderConfig` interface.
 *
 * ```tsx
 * import { PrerenderConfig } from '@stencil/core';
 * export const config: PrerenderConfig = {
 *   ...
 * };
 * ```
 *
 * For more info: https://stenciljs.com/docs/static-site-generation
 */
export interface PrerenderConfig {
  /**
   * Run after each `document` is hydrated, but before it is serialized
   * into an HTML string. Hook is passed the `document` and its `URL`.
   */
  afterHydrate?(document: Document, url: URL, results: PrerenderUrlResults): any | Promise<any>;
  /**
   * Run before each `document` is hydrated. Hook is passed the `document` it's `URL`.
   */
  beforeHydrate?(document: Document, url: URL): any | Promise<any>;
  /**
   * Runs after the template Document object has serialize into an
   * HTML formatted string. Returns an HTML string to be used as the
   * base template for all prerendered pages.
   */
  afterSerializeTemplate?(html: string): string | Promise<string>;
  /**
   * Runs before the template Document object is serialize into an
   * HTML formatted string. Returns the Document to be serialized which
   * will become the base template html for all prerendered pages.
   */
  beforeSerializeTemplate?(document: Document): Document | Promise<Document>;
  /**
   * A hook to be used to generate the canonical `<link>` tag
   * which goes in the `<head>` of every prerendered page. Returning `null`
   * will not add a canonical url tag to the page.
   */
  canonicalUrl?(url: URL): string | null;
  /**
   * While prerendering, crawl same-origin URLs found within `<a href>` elements.
   * Defaults to `true`.
   */
  crawlUrls?: boolean;
  /**
   * URLs to start the prerendering from. By default the root URL of `/` is used.
   */
  entryUrls?: string[];
  /**
   * Return `true` the given `<a>` element should be crawled or not.
   */
  filterAnchor?(attrs: { [attrName: string]: string }, base?: URL): boolean;
  /**
   * Return `true` if the given URL should be prerendered or not.
   */
  filterUrl?(url: URL, base: URL): boolean;
  /**
   * Returns the file path which the prerendered HTML content
   * should be written to.
   */
  filePath?(url: URL, filePath: string): string;
  /**
   * Returns the hydrate options to use for each individual prerendered page.
   */
  hydrateOptions?(url: URL): PrerenderHydrateOptions;
  /**
   * Returns the template file's content. The template is the base
   * HTML used for all prerendered pages.
   */
  loadTemplate?(filePath: string): string | Promise<string>;
  /**
   * Used to normalize the page's URL from a given a string and the current
   * page's base URL. Largely used when reading an anchor's `href` attribute
   * value and normalizing it into a `URL`.
   */
  normalizeUrl?(href: string, base: URL): URL;
  robotsTxt?(opts: RobotsTxtOpts): string | RobotsTxtResults;
  sitemapXml?(opts: SitemapXmpOpts): string | SitemapXmpResults;
  /**
   * Static Site Generated (SSG). Does not include Stencil's client-side
   * JavaScript, custom elements or preload modules.
   */
  staticSite?: boolean;
  /**
   * If the prerendered URLs should have a trailing "/"" or not. Defaults to `false`.
   */
  trailingSlash?: boolean;
}

export interface HydrateDocumentOptions {
  /**
   * Build ID that will be added to `<html data-stencil-build="BUILD_ID">`. By default
   * a random ID will be generated
   */
  buildId?: string;
  /**
   * Sets the `href` attribute on the `<link rel="canonical">`
   * tag within the `<head>`. If the value is not defined it will
   * ensure a canonical link tag is no included in the `<head>`.
   */
  canonicalUrl?: string;
  /**
   * Include the HTML comments and attributes used by the client-side
   * JavaScript to read the structure of the HTML and rebuild each
   * component. Defaults to `true`.
   */
  clientHydrateAnnotations?: boolean;
  /**
   * Constrain `setTimeout()` to 1ms, but still async. Also
   * only allows `setInterval()` to fire once, also constrained to 1ms.
   * Defaults to `true`.
   */
  constrainTimeouts?: boolean;
  /**
   * Sets `document.cookie`
   */
  cookie?: string;
  /**
   * Sets the `dir` attribute on the top level `<html>`.
   */
  direction?: string;
  /**
   * Component tag names listed here will not be prerendered, nor will
   * hydrated on the client-side. Components listed here will be ignored
   * as custom elements and treated no differently than a `<div>`.
   */
  excludeComponents?: string[];
  /**
   * Sets the `lang` attribute on the top level `<html>`.
   */
  language?: string;
  /**
   * Maximum number of components to hydrate on one page. Defaults to `300`.
   */
  maxHydrateCount?: number;
  /**
   * Sets `document.referrer`
   */
  referrer?: string;
  /**
   * Removes every `<script>` element found in the `document`. Defaults to `false`.
   */
  removeScripts?: boolean;
  /**
   * Removes CSS not used by elements within the `document`. Defaults to `true`.
   */
  removeUnusedStyles?: boolean;
  /**
   * The url the runtime uses for the resources, such as the assets directory.
   */
  resourcesUrl?: string;
  /**
   * Prints out runtime console logs to the NodeJS process. Defaults to `false`.
   */
  runtimeLogging?: boolean;
  /**
   * Component tags listed here will only be prerendered or server-side-rendered
   * and will not be client-side hydrated. This is useful for components that
   * are not dynamic and do not need to be defined as a custom element within the
   * browser. For example, a header or footer component would be a good example that
   * may not require any client-side JavaScript.
   */
  staticComponents?: string[];
  /**
   * The amount of milliseconds to wait for a page to finish rendering until
   * a timeout error is thrown. Defaults to `15000`.
   */
  timeout?: number;
  /**
   * Sets `document.title`.
   */
  title?: string;
  /**
   * Sets `location.href`
   */
  url?: string;
  /**
   * Sets `navigator.userAgent`
   */
  userAgent?: string;
  /**
   * Configure how Stencil serializes the components shadow root.
   * - If set to `declarative-shadow-dom` the component will be rendered within a Declarative Shadow DOM.
   * - If set to `scoped` Stencil will render the contents of the shadow root as a `scoped: true` component
   *   and the shadow DOM will be created during client-side hydration.
   * - Alternatively you can mix and match the two by providing an object with `declarative-shadow-dom` and `scoped` keys,
   * the value arrays containing the tag names of the components that should be rendered in that mode.
   *
   * Examples:
   * - `{ 'declarative-shadow-dom': ['my-component-1', 'another-component'], default: 'scoped' }`
   * Render all components as `scoped` apart from `my-component-1` and `another-component`
   * -  `{ 'scoped': ['an-option-component'], default: 'declarative-shadow-dom' }`
   * Render all components within `declarative-shadow-dom` apart from `an-option-component`
   * - `'scoped'` Render all components as `scoped`
   * - `false` disables shadow root serialization
   *
   * *NOTE* `true` has been deprecated in favor of `declarative-shadow-dom` and `scoped`
   * @default 'declarative-shadow-dom'
   */
  serializeShadowRoot?:
    | 'declarative-shadow-dom'
    | 'scoped'
    | {
        'declarative-shadow-dom'?: string[];
        scoped?: string[];
        default: 'declarative-shadow-dom' | 'scoped';
      }
    | boolean;
}

export interface SerializeDocumentOptions extends HydrateDocumentOptions {
  /**
   * Runs after the `document` has been hydrated.
   */
  afterHydrate?(document: any): any | Promise<any>;
  /**
   * Sets an approximate line width the HTML should attempt to stay within.
   * Note that this is "approximate", in that HTML may often not be able
   * to be split at an exact line width. Additionally, new lines created
   * is where HTML naturally already has whitespace, such as before an
   * attribute or spaces between words. Defaults to `100`.
   */
  approximateLineWidth?: number;
  /**
   * Runs before the `document` has been hydrated.
   */
  beforeHydrate?(document: any): any | Promise<any>;
  /**
   * Format the HTML in a nicely indented format.
   * Defaults to `false`.
   */
  prettyHtml?: boolean;
  /**
   * Remove quotes from attribute values when possible.
   * Defaults to `true`.
   */
  removeAttributeQuotes?: boolean;
  /**
   * Remove the `=""` from standardized `boolean` attributes,
   * such as `hidden` or `checked`. Defaults to `true`.
   */
  removeBooleanAttributeQuotes?: boolean;
  /**
   * Remove these standardized attributes when their value is empty:
   * `class`, `dir`, `id`, `lang`, and `name`, `title`. Defaults to `true`.
   */
  removeEmptyAttributes?: boolean;
  /**
   * Remove HTML comments. Defaults to `true`.
   */
  removeHtmlComments?: boolean;
  /**
   * The `fullDocument` flag determines the format of the rendered output. Set it to true to
   * generate a complete HTML document, or false to render only the component.
   * @default true
   */
  fullDocument?: boolean;
  /**
   * Style modes to render the component in.
   * @see https://stenciljs.com/docs/styling#style-modes
   */
  modes?: ResolutionHandler[];
}

export interface HydrateFactoryOptions extends SerializeDocumentOptions {
  serializeToHtml: boolean;
  destroyWindow: boolean;
  destroyDocument: boolean;
}

export interface PrerenderHydrateOptions extends SerializeDocumentOptions {
  /**
   * Adds `<link rel="modulepreload">` for modules that will eventually be requested.
   * Defaults to `true`.
   */
  addModulePreloads?: boolean;
  /**
   * Hash the content of assets, such as images, fonts and css files,
   * and add the hashed value as `v` querystring. For example,
   * `/assets/image.png?v=abcd1234`. This allows for assets to be
   * heavily cached by setting the server's response header with
   * `Cache-Control: max-age=31536000, immutable`.
   */
  hashAssets?: 'querystring';
  /**
   * External stylesheets from `<link rel="stylesheet">` are instead inlined
   * into `<style>` elements. Defaults to `false`.
   */
  inlineExternalStyleSheets?: boolean;
  /**
   * Minify CSS content within `<style>` elements. Defaults to `true`.
   */
  minifyStyleElements?: boolean;
  /**
   * Minify JavaScript content within `<script>` elements. Defaults to `true`.
   */
  minifyScriptElements?: boolean;
  /**
   * Entire `document` should be static. This is useful for specific pages that
   * should be static, rather than the entire site. If the whole site should be static,
   * use the `staticSite` property on the prerender config instead. If only certain
   * components should be static then use `staticComponents` instead.
   */
  staticDocument?: boolean;
}

export interface RobotsTxtOpts {
  urls: string[];
  sitemapUrl: string;
  baseUrl: string;
  dir: string;
}

export interface RobotsTxtResults {
  content: string;
  filePath: string;
  url: string;
}

export interface SitemapXmpOpts {
  urls: string[];
  baseUrl: string;
  dir: string;
}

export interface SitemapXmpResults {
  content: string;
  filePath: string;
  url: string;
}

/**
 * Common system used by the compiler. All file reads, writes, access, etc. will all use
 * this system. Additionally, throughout each build, the compiler will use an internal
 * in-memory file system as to prevent unnecessary fs reads and writes. At the end of each
 * build all actions the in-memory fs performed will be written to disk using this system.
 * A NodeJS based system will use APIs such as `fs` and `crypto`, and a web-based system
 * will use in-memory Maps and browser APIs. Either way, the compiler itself is unaware
 * of the actual platform it's being ran on top of.
 */
export interface CompilerSystem {
  name: 'node' | 'in-memory';
  version: string;
  events?: BuildEvents;
  details?: SystemDetails;
  /**
   * Add a callback which will be ran when destroy() is called.
   */
  addDestroy(cb: () => void): void;
  /**
   * Always returns a boolean, does not throw.
   */
  access(p: string): Promise<boolean>;
  /**
   * SYNC! Always returns a boolean, does not throw.
   */
  accessSync(p: string): boolean;
  applyGlobalPatch?(fromDir: string): Promise<void>;
  applyPrerenderGlobalPatch?(opts: { devServerHostUrl: string; window: any }): void;
  cacheStorage?: CacheStorage;
  // TODO(STENCIL-898): Make this property non-optional, check for unnecessary null checks on it
  checkVersion?: (logger: Logger, currentVersion: string) => Promise<() => void>;
  copy?(copyTasks: Required<CopyTask>[], srcDir: string): Promise<CopyResults>;
  /**
   * Always returns a boolean if the files were copied or not. Does not throw.
   */
  copyFile(src: string, dst: string): Promise<boolean>;
  /**
   * Used to destroy any listeners, file watchers or child processes.
   */
  destroy(): Promise<void>;
  /**
   * Does not throw.
   */
  createDir(p: string, opts?: CompilerSystemCreateDirectoryOptions): Promise<CompilerSystemCreateDirectoryResults>;
  /**
   * SYNC! Does not throw.
   */
  createDirSync(p: string, opts?: CompilerSystemCreateDirectoryOptions): CompilerSystemCreateDirectoryResults;
  homeDir(): string;
  /**
   * Used to determine if the current context of the terminal is TTY.
   */
  isTTY(): boolean;
  /**
   * Each platform has a different way to dynamically import modules.
   */
  dynamicImport?(p: string): Promise<any>;
  /**
   * Creates the worker controller for the current system.
   *
   * @param maxConcurrentWorkers the max number of concurrent workers to
   * support
   * @returns a worker controller appropriate for the current platform (node.js)
   */
  createWorkerController?(maxConcurrentWorkers: number): WorkerMainController;
  encodeToBase64(str: string): string;

  // TODO(STENCIL-727): Remove this from the sys interface
  /**
   * @deprecated
   */
  ensureDependencies?(opts: {
    rootDir: string;
    logger: Logger;
    dependencies: CompilerDependency[];
  }): Promise<{ stencilPath: string; diagnostics: Diagnostic[] }>;
  // TODO(STENCIL-727): Remove this from the sys interface
  /**
   * @deprecated
   */
  ensureResources?(opts: { rootDir: string; logger: Logger; dependencies: CompilerDependency[] }): Promise<void>;
  /**
   * process.exit()
   */
  exit(exitCode: number): Promise<void>;
  /**
   * Optionally provide a fetch() function rather than using the built-in fetch().
   * First arg is a url string or Request object (RequestInfo).
   * Second arg is the RequestInit. Returns the Response object
   */
  fetch?(input: string | any, init?: any): Promise<any>;
  /**
   * Generates a sha1 digest encoded as HEX
   */
  generateContentHash?(content: string | any, length?: number): Promise<string>;
  /**
   * Generates a sha1 digest encoded as HEX from a file path
   */
  generateFileHash?(filePath: string | any, length?: number): Promise<string>;
  /**
   * Get the current directory.
   */
  getCurrentDirectory(): string;
  /**
   * The compiler's executing path.
   */
  getCompilerExecutingPath(): string;
  /**
   * The dev server's executing path.
   */
  getDevServerExecutingPath?(): string;
  getEnvironmentVar?(key: string): string;
  /**
   * Gets the absolute file path when for a dependency module.
   */
  getLocalModulePath(opts: { rootDir: string; moduleId: string; path: string }): string;
  /**
   * Gets the full url when requesting a dependency module to fetch from a CDN.
   */
  getRemoteModuleUrl(opts: { moduleId: string; path?: string; version?: string }): string;
  /**
   * Async glob task. Only available in NodeJS compiler system.
   */
  glob?(pattern: string, options: { cwd?: string; nodir?: boolean; [key: string]: any }): Promise<string[]>;
  /**
   * The number of logical processors available to run threads on the user's computer (cpus).
   */
  hardwareConcurrency: number;
  /**
   * Tests if the path is a symbolic link or not. Always resolves a boolean. Does not throw.
   */
  isSymbolicLink(p: string): Promise<boolean>;
  lazyRequire?: LazyRequire;
  nextTick(cb: () => void): void;
  /**
   * Normalize file system path.
   */
  normalizePath(p: string): string;
  onProcessInterrupt?(cb: () => void): void;
  parseYarnLockFile?: (content: string) => {
    type: 'success' | 'merge' | 'conflict';
    object: any;
  };
  platformPath: PlatformPath;
  /**
   * All return paths are full normalized paths, not just the basenames. Always returns an array, does not throw.
   */
  readDir(p: string): Promise<string[]>;
  /**
   * SYNC! All return paths are full normalized paths, not just the basenames. Always returns an array, does not throw.
   */
  readDirSync(p: string): string[];
  /**
   * Returns undefined if file is not found. Does not throw.
   */
  readFile(p: string): Promise<string>;
  readFile(p: string, encoding: 'utf8'): Promise<string>;
  readFile(p: string, encoding: 'binary'): Promise<any>;
  /**
   * SYNC! Returns undefined if file is not found. Does not throw.
   */
  readFileSync(p: string, encoding?: string): string;
  /**
   * Does not throw.
   */
  realpath(p: string): Promise<CompilerSystemRealpathResults>;
  /**
   * SYNC! Does not throw.
   */
  realpathSync(p: string): CompilerSystemRealpathResults;
  /**
   * Remove a callback which will be ran when destroy() is called.
   */
  removeDestroy(cb: () => void): void;
  /**
   * Rename old path to new path. Does not throw.
   */
  rename(oldPath: string, newPath: string): Promise<CompilerSystemRenameResults>;
  resolveModuleId?(opts: ResolveModuleIdOptions): Promise<ResolveModuleIdResults>;
  resolvePath(p: string): string;
  /**
   * Does not throw.
   */
  removeDir(p: string, opts?: CompilerSystemRemoveDirectoryOptions): Promise<CompilerSystemRemoveDirectoryResults>;
  /**
   * SYNC! Does not throw.
   */
  removeDirSync(p: string, opts?: CompilerSystemRemoveDirectoryOptions): CompilerSystemRemoveDirectoryResults;
  /**
   * Does not throw.
   */
  removeFile(p: string): Promise<CompilerSystemRemoveFileResults>;
  /**
   * SYNC! Does not throw.
   */
  removeFileSync(p: string): CompilerSystemRemoveFileResults;
  setupCompiler?: (c: { ts: any }) => void;

  /**
   * Always returns an object. Does not throw. Check for "error" property if there's an error.
   */
  stat(p: string): Promise<CompilerFsStats>;
  /**
   * SYNC! Always returns an object. Does not throw. Check for "error" property if there's an error.
   */
  statSync(p: string): CompilerFsStats;
  tmpDirSync(): string;
  watchDirectory?(p: string, callback: CompilerFileWatcherCallback, recursive?: boolean): CompilerFileWatcher;

  /**
   * A `watchFile` implementation in order to hook into the rest of the {@link CompilerSystem} implementation that is
   * used when running Stencil's compiler in "watch mode".
   *
   * It is analogous to TypeScript's `watchFile`  implementation.
   *
   * Note, this function may be called for full builds of Stencil projects by the TypeScript compiler. It should not
   * assume that it will only be called in watch mode.
   *
   * This function should not perform any file watcher registration itself. Each `path` provided to it when called
   * should already have been registered as a file to watch.
   *
   * @param path the path to the file that is being watched
   * @param callback a callback to invoke when a file that is being watched has changed in some way
   * @returns an object with a method for unhooking the file watcher from the system
   */
  watchFile?(path: string, callback: CompilerFileWatcherCallback): CompilerFileWatcher;
  /**
   * How many milliseconds to wait after a change before calling watch callbacks.
   */
  watchTimeout?: number;
  /**
   * Does not throw.
   */
  writeFile(p: string, content: string): Promise<CompilerSystemWriteFileResults>;
  /**
   * SYNC! Does not throw.
   */
  writeFileSync(p: string, content: string): CompilerSystemWriteFileResults;
}

export interface TranspileOnlyResults {
  diagnostics: Diagnostic[];
  output: string;
  sourceMap: any;
}

export interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

export interface PlatformPath {
  normalize(p: string): string;
  join(...paths: string[]): string;
  resolve(...pathSegments: string[]): string;
  isAbsolute(p: string): boolean;
  relative(from: string, to: string): string;
  dirname(p: string): string;
  basename(p: string, ext?: string): string;
  extname(p: string): string;
  parse(p: string): ParsedPath;
  sep: string;
  delimiter: string;
  posix: any;
  win32: any;
}

export interface CompilerDependency {
  name: string;
  version: string;
  main: string;
  resources?: string[];
}

export interface ResolveModuleIdOptions {
  moduleId: string;
  containingFile?: string;
  exts?: string[];
  packageFilter?: (pkg: any, pkgFile: string) => any;
}

export interface ResolveModuleIdResults {
  moduleId: string;
  resolveId: string;
  pkgData: { name: string; version: string; [key: string]: any };
  pkgDirPath: string;
}

// TODO(STENCIL-1005): improve the typing for this interface
/**
 * A controller which provides for communication and coordination between
 * threaded workers.
 */
export interface WorkerMainController {
  /**
   * Send a given set of arguments to a worker
   */
  send(...args: any[]): Promise<any>;
  /**
   * Handle a particular method
   *
   * @param name of the method to be passed to a worker
   * @returns a Promise wrapping the results
   */
  handler(name: string): (...args: any[]) => Promise<any>;
  /**
   * Destroy the worker represented by this instance, rejecting all outstanding
   * tasks and killing the child process.
   */
  destroy(): void;
  /**
   * The current setting for the max number of workers
   */
  maxWorkers: number;
}

export interface CopyResults {
  diagnostics: Diagnostic[];
  filePaths: string[];
  dirPaths: string[];
}

export interface SystemDetails {
  cpuModel: string;
  freemem(): number;
  platform: 'darwin' | 'windows' | 'linux' | '';
  release: string;
  totalmem: number;
}

export interface BuildOnEvents {
  on(cb: (eventName: CompilerEventName, data: any) => void): BuildOnEventRemove;

  on(eventName: CompilerEventFileAdd, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventFileDelete, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventFileUpdate, cb: (path: string) => void): BuildOnEventRemove;

  on(eventName: CompilerEventDirAdd, cb: (path: string) => void): BuildOnEventRemove;
  on(eventName: CompilerEventDirDelete, cb: (path: string) => void): BuildOnEventRemove;

  on(eventName: CompilerEventBuildStart, cb: (buildStart: CompilerBuildStart) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildFinish, cb: (buildResults: CompilerBuildResults) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildLog, cb: (buildLog: BuildLog) => void): BuildOnEventRemove;
  on(eventName: CompilerEventBuildNoChange, cb: () => void): BuildOnEventRemove;
}

export interface BuildEmitEvents {
  emit(eventName: CompilerEventName, path: string): void;
  emit(eventName: CompilerEventFileAdd, path: string): void;
  emit(eventName: CompilerEventFileDelete, path: string): void;
  emit(eventName: CompilerEventFileUpdate, path: string): void;

  emit(eventName: CompilerEventDirAdd, path: string): void;
  emit(eventName: CompilerEventDirDelete, path: string): void;

  emit(eventName: CompilerEventBuildStart, buildStart: CompilerBuildStart): void;
  emit(eventName: CompilerEventBuildFinish, buildResults: CompilerBuildResults): void;
  emit(eventName: CompilerEventBuildNoChange, buildNoChange: BuildNoChangeResults): void;
  emit(eventName: CompilerEventBuildLog, buildLog: BuildLog): void;

  emit(eventName: CompilerEventFsChange, fsWatchResults: FsWatchResults): void;
}

export interface FsWatchResults {
  dirsAdded: string[];
  dirsDeleted: string[];
  filesUpdated: string[];
  filesAdded: string[];
  filesDeleted: string[];
}

export interface BuildLog {
  buildId: number;
  messages: string[];
  progress: number;
}

export interface BuildNoChangeResults {
  buildId: number;
  noChange: boolean;
}

export interface CompilerBuildResults {
  buildId: number;
  componentGraph?: BuildResultsComponentGraph;
  diagnostics: Diagnostic[];
  dirsAdded: string[];
  dirsDeleted: string[];
  duration: number;
  filesAdded: string[];
  filesChanged: string[];
  filesDeleted: string[];
  filesUpdated: string[];
  hasError: boolean;
  hasSuccessfulBuild: boolean;
  hmr?: HotModuleReplacement;
  hydrateAppFilePath?: string;
  isRebuild: boolean;
  namespace: string;
  outputs: BuildOutput[];
  rootDir: string;
  srcDir: string;
  timestamp: string;
}

export interface BuildResultsComponentGraph {
  [scopeId: string]: string[];
}

export interface BuildOutput {
  type: string;
  files: string[];
}

export interface HotModuleReplacement {
  componentsUpdated?: string[];
  excludeHmr?: string[];
  externalStylesUpdated?: string[];
  imagesUpdated?: string[];
  indexHtmlUpdated?: boolean;
  inlineStylesUpdated?: HmrStyleUpdate[];
  reloadStrategy: PageReloadStrategy;
  scriptsAdded?: string[];
  scriptsDeleted?: string[];
  serviceWorkerUpdated?: boolean;
  versionId?: string;
}

export interface HmrStyleUpdate {
  styleId: string;
  styleTag: string;
  styleText: string;
}

export type BuildOnEventRemove = () => boolean;

export interface BuildEvents extends BuildOnEvents, BuildEmitEvents {
  unsubscribeAll(): void;
}

export interface CompilerBuildStart {
  buildId: number;
  timestamp: string;
}

/**
 * A type describing a function to call when an event is emitted by a file watcher
 * @param fileName the path of the file tied to event
 * @param eventKind a variant describing the type of event that was emitter (added, edited, etc.)
 */
export type CompilerFileWatcherCallback = (fileName: string, eventKind: CompilerFileWatcherEvent) => void;

/**
 * A type describing the different types of events that Stencil expects may happen when a file being watched is altered
 * in some way
 */
export type CompilerFileWatcherEvent =
  | CompilerEventFileAdd
  | CompilerEventFileDelete
  | CompilerEventFileUpdate
  | CompilerEventDirAdd
  | CompilerEventDirDelete;

export type CompilerEventName =
  | CompilerEventFsChange
  | CompilerEventFileUpdate
  | CompilerEventFileAdd
  | CompilerEventFileDelete
  | CompilerEventDirAdd
  | CompilerEventDirDelete
  | CompilerEventBuildStart
  | CompilerEventBuildFinish
  | CompilerEventBuildNoChange
  | CompilerEventBuildLog;

export type CompilerEventFsChange = 'fsChange';
export type CompilerEventFileUpdate = 'fileUpdate';
export type CompilerEventFileAdd = 'fileAdd';
export type CompilerEventFileDelete = 'fileDelete';
export type CompilerEventDirAdd = 'dirAdd';
export type CompilerEventDirDelete = 'dirDelete';
export type CompilerEventBuildStart = 'buildStart';
export type CompilerEventBuildFinish = 'buildFinish';
export type CompilerEventBuildLog = 'buildLog';
export type CompilerEventBuildNoChange = 'buildNoChange';

export interface CompilerFileWatcher {
  close(): void | Promise<void>;
}

export interface CompilerFsStats {
  /**
   * If it's a directory. `false` if there was an error.
   */
  isDirectory: boolean;
  /**
   * If it's a file. `false` if there was an error.
   */
  isFile: boolean;
  /**
   * If it's a symlink. `false` if there was an error.
   */
  isSymbolicLink: boolean;
  /**
   * The size of the file in bytes. `0` for directories or if there was an error.
   */
  size: number;
  /**
   * The timestamp indicating the last time this file was modified expressed in milliseconds since the POSIX Epoch.
   */
  mtimeMs?: number;
  /**
   * Error if there was one, otherwise `null`. `stat` and `statSync` do not throw errors but always returns this interface.
   */
  error: any;
}

export interface CompilerSystemCreateDirectoryOptions {
  /**
   * Indicates whether parent directories should be created.
   * @default false
   */
  recursive?: boolean;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777.
   */
  mode?: number;
}

export interface CompilerSystemCreateDirectoryResults {
  basename: string;
  dirname: string;
  path: string;
  newDirs: string[];
  error: any;
}

export interface CompilerSystemRemoveDirectoryOptions {
  /**
   * Indicates whether child files and subdirectories should be removed.
   * @default false
   */
  recursive?: boolean;
}

export interface CompilerSystemRemoveDirectoryResults {
  basename: string;
  dirname: string;
  path: string;
  removedDirs: string[];
  removedFiles: string[];
  error: any;
}

export interface CompilerSystemRenameResults extends CompilerSystemRenamedPath {
  renamed: CompilerSystemRenamedPath[];
  oldDirs: string[];
  oldFiles: string[];
  newDirs: string[];
  newFiles: string[];
  error: any;
}

export interface CompilerSystemRenamedPath {
  oldPath: string;
  newPath: string;
  isFile: boolean;
  isDirectory: boolean;
}

export interface CompilerSystemRealpathResults {
  path: string;
  error: any;
}

export interface CompilerSystemRemoveFileResults {
  basename: string;
  dirname: string;
  path: string;
  error: any;
}

export interface CompilerSystemWriteFileResults {
  path: string;
  error: any;
}

export interface Credentials {
  key: string;
  cert: string;
}

export interface ConfigBundle {
  components: string[];
}

/**
 * A file and/or directory copy operation that may be specified as part of
 * certain output targets for Stencil (in particular `dist`,
 * `dist-custom-elements`, and `www`).
 */
export interface CopyTask {
  /**
   * The source file path for a copy operation. This may be an absolute or
   * relative path to a directory or a file, and may also include a glob
   * pattern.
   *
   * If the path is a relative path it will be treated as relative to
   * `Config.srcDir`.
   */
  src: string;
  /**
   * An optional destination file path for a copy operation. This may be an
   * absolute or relative path.
   *
   * If relative, this will be treated as relative to the output directory for
   * the output target for which this copy operation is configured.
   */
  dest?: string;
  /**
   * An optional array of glob patterns to exclude from the copy operation.
   * @default ['**\/__mocks__/**', '**\/__fixtures__/**', '**\/dist/**', '**\/.{idea,git,cache,output,temp}/**', '**\/.ds_store', '**\/.gitignore', '**\/desktop.ini', '**\/thumbs.db']
   */
  ignore?: string[];
  /**
   * Whether or not Stencil should issue warnings if it cannot find the
   * specified source files or directories. Defaults to `false`.
   *
   * To receive warnings if a copy task source can't be found set this to
   * `true`.
   */
  warn?: boolean;
  /**
   * Whether or not directory structure should be preserved when copying files
   * from a source directory. Defaults to `true` if no `dest` path is supplied,
   * else it defaults to `false`.
   *
   * If this is set to `false`, all the files from a source directory will be
   * copied directly to the destination directory, but if it's set to `true` they
   * will be copied to a new directory inside the destination directory with
   * the same name as their original source directory.
   *
   * So if, for instance, `src` is set to `"images"` and `keepDirStructure` is
   * set to `true` the copy task will then produce the following directory
   * structure:
   *
   * ```
   * images
   * └── foo.png
   * dist
   * └── images
   *     └── foo.png
   * ```
   *
   * Conversely if `keepDirStructure` is set to `false` then files in `images/`
   * will be copied to `dist` without first creating a new subdirectory,
   * resulting in the following directory structure:
   *
   * ```
   * images
   * └── foo.png
   * dist
   * └── foo.png
   * ```
   *
   * If a `dest` path is supplied then `keepDirStructure`
   * will default to `false`, so that Stencil will write the
   * copied files directly into the `dest` directory without creating a new
   * subdirectory. This behavior can be overridden by setting
   * `keepDirStructure` to `true`.
   */
  keepDirStructure?: boolean;
}

/**
 * Configuration for generating documentation from Stencil components.
 */
export interface StencilDocsConfig {
  /**
   * Options for processing and rendering Markdown documentation files.
   */
  markdown?: {
    /**
     * Styling for how the target component will be represented within documentation (e.g., in component diagrams).
     */
    targetComponent?: {
      /**
       * Background color used for nodes representing the component in diagrams (e.g., Mermaid graphs).
       * Use standard color names or hex codes.
       * @example '#f0f0f0' (light gray)
       */
      background?: string;

      /**
       * Text color used within nodes representing the component in diagrams (e.g., Mermaid graphs).
       * Use standard color names or hex codes.
       * @example '#333' (dark gray)
       */
      textColor?: string;
    };
  };
}

// TODO(STENCIL-882): Remove this interface [BREAKING_CHANGE]
export interface BundlingConfig {
  /**
   * @deprecated the `namedExports` field is no longer honored by `@rollup/plugin-commonjs` and is not used by Stencil.
   * This field can be safely removed from your Stencil configuration file.
   */
  namedExports?: {
    [key: string]: string[];
  };
}

export interface NodeResolveConfig {
  exportConditions?: string[];
  browser?: boolean;
  moduleDirectories?: string[];
  modulePaths?: string[];
  dedupe?: string[] | ((importee: string) => boolean);
  extensions?: readonly string[];
  jail?: string;
  mainFields?: readonly string[];
  modulesOnly?: boolean;
  preferBuiltins?: boolean | ((module: string) => boolean);
  resolveOnly?: ReadonlyArray<string | RegExp> | null | ((module: string) => boolean);
  rootDir?: string;
  allowExportsFolderMapping?: boolean;

  // TODO(STENCIL-1107): Remove this field [BREAKING_CHANGE]
  /**
   * @see https://github.com/browserify/resolve#resolveid-opts-cb
   * @deprecated the `customResolveOptions` field is no longer honored in future versions of
   * `@rollup/plugin-node-resolve`. If you are currently using it, please open a new issue in the Stencil repo to
   * describe your use case & provide input (https://github.com/stenciljs/core/issues/new/choose)
   */
  customResolveOptions?: {
    basedir?: string;
    package?: string;
    extensions?: string[];
    readFile?: Function;
    isFile?: Function;
    isDirectory?: Function;
    packageFilter?: Function;
    pathFilter?: Function;
    paths?: Function | string[];
    moduleDirectory?: string | string[];
    preserveSymlinks?: boolean;
  };
}

export interface RollupConfig {
  inputOptions?: RollupInputOptions;
  outputOptions?: RollupOutputOptions;
}

export interface RollupInputOptions {
  context?: string;
  moduleContext?: ((id: string) => string) | { [id: string]: string };
  treeshake?: boolean;
  maxParallelFileOps?: number;
  external?:
    | (string | RegExp)[]
    | string
    | RegExp
    | ((source: string, importer: string | undefined, isResolved: boolean) => boolean | null | undefined);
}

export interface RollupOutputOptions {
  globals?: { [name: string]: string } | ((name: string) => string);
}

export interface Testing {
  run(opts: TestingRunOptions): Promise<boolean>;
  destroy(): Promise<void>;
}

export declare type Path = string;
export declare type TransformerConfig = [string, Record<string, unknown>];

/**
 * Options for initiating a run of Stencil tests (spec and/or end-to-end)
 */
export interface TestingRunOptions {
  /**
   * If true, run end-to-end tests
   */
  e2e?: boolean;
  /**
   * If true, run screenshot tests
   */
  screenshot?: boolean;
  /**
   * If true, run spec tests
   */
  spec?: boolean;
  /**
   * If true, update 'golden' screenshots. Otherwise, compare against priori.
   */
  updateScreenshot?: boolean;
}

export interface JestConfig {
  /**
   * This option tells Jest that all imported modules in your tests should be mocked automatically.
   * All modules used in your tests will have a replacement implementation, keeping the API surface. Default: false
   */
  automock?: boolean;

  /**
   * By default, Jest runs all tests and produces all errors into the console upon completion.
   * The bail config option can be used here to have Jest stop running tests after the first failure. Default: false
   */
  bail?: boolean | number;

  /**
   * The directory where Jest should store its cached dependency information. Jest attempts to scan your dependency tree once (up-front)
   * and cache it in order to ease some of the filesystem raking that needs to happen while running tests. This config option lets you
   * customize where Jest stores that cache data on disk. Default: "/tmp/<path>"
   */
  cacheDirectory?: string;

  /**
   * Automatically clear mock calls and instances between every test. Equivalent to calling jest.clearAllMocks()
   * between each test. This does not remove any mock implementation that may have been provided. Default: false
   */
  clearMocks?: boolean;

  /**
   * Indicates whether the coverage information should be collected while executing the test. Because this retrofits all
   * executed files with coverage collection statements, it may significantly slow down your tests. Default: false
   */
  collectCoverage?: boolean;

  /**
   * An array of glob patterns indicating a set of files for which coverage information should be collected.
   * If a file matches the specified glob pattern, coverage information will be collected for it even if no tests exist
   * for this file and it's never required in the test suite. Default: undefined
   */
  collectCoverageFrom?: any[];

  /**
   * The directory where Jest should output its coverage files. Default: undefined
   */
  coverageDirectory?: string;

  /**
   * An array of regexp pattern strings that are matched against all file paths before executing the test. If the file path matches
   * any of the patterns, coverage information will be skipped. These pattern strings match against the full path.
   * Use the <rootDir> string token to include the path to your project's root directory to prevent it from accidentally
   * ignoring all of your files in different environments that may have different root directories.
   * Example: ["<rootDir>/build/", "<rootDir>/node_modules/"]. Default: ["/node_modules/"]
   */
  coveragePathIgnorePatterns?: any[];

  /**
   * A list of reporter names that Jest uses when writing coverage reports. Any istanbul reporter can be used.
   * Default: `["json", "lcov", "text"]`
   */
  coverageReporters?: any[];

  /**
   * This will be used to configure minimum threshold enforcement for coverage results. Thresholds can be specified as global,
   * as a glob, and as a directory or file path. If thresholds aren't met, jest will fail. Thresholds specified as a positive
   * number are taken to be the minimum percentage required. Thresholds specified as a negative number represent the maximum
   * number of uncovered entities allowed. Default: undefined
   */
  coverageThreshold?: any;

  errorOnDeprecated?: boolean;
  forceCoverageMatch?: any[];
  globals?: any;
  globalSetup?: string;
  globalTeardown?: string;

  /**
   * An array of directory names to be searched recursively up from the requiring module's location. Setting this option will
   * override the default, if you wish to still search node_modules for packages include it along with any other
   * options: ["node_modules", "bower_components"]. Default: ["node_modules"]
   */
  moduleDirectories?: string[];

  /**
   * An array of file extensions your modules use. If you require modules without specifying a file extension,
   * these are the extensions Jest will look for. Default: ['ts', 'tsx', 'js', 'json']
   */
  moduleFileExtensions?: string[];

  moduleNameMapper?: any;
  modulePaths?: any[];
  modulePathIgnorePatterns?: any[];
  notify?: boolean;
  notifyMode?: string;
  preset?: string;
  prettierPath?: string;
  projects?: any;
  reporters?: any;
  resetMocks?: boolean;
  resetModules?: boolean;
  resolver?: Path | null;
  restoreMocks?: boolean;
  rootDir?: string;
  roots?: any[];
  runner?: string;

  /**
   * The paths to modules that run some code to configure or set up the testing environment before each test.
   * Since every test runs in its own environment, these scripts will be executed in the testing environment
   * immediately before executing the test code itself. Default: []
   */
  setupFiles?: string[];

  setupFilesAfterEnv?: string[];

  snapshotSerializers?: any[];
  testEnvironment?: string;
  testEnvironmentOptions?: any;
  testMatch?: string[];
  testPathIgnorePatterns?: string[];
  testPreset?: string;
  testRegex?: string[];
  testResultsProcessor?: string;
  testRunner?: string;
  testURL?: string;
  timers?: string;
  transform?: {
    [regex: string]: Path | TransformerConfig;
  };
  transformIgnorePatterns?: any[];
  unmockedModulePathPatterns?: any[];
  verbose?: boolean;
  watchPathIgnorePatterns?: any[];
}

export interface TestingConfig extends JestConfig {
  /**
   * The `allowableMismatchedPixels` value is used to determine an acceptable
   * number of pixels that can be mismatched before the image is considered
   * to have changes. Realistically, two screenshots representing the same
   * content may have a small number of pixels that are not identical due to
   * anti-aliasing, which is perfectly normal. If the `allowableMismatchedRatio`
   * is provided it will take precedence, otherwise `allowableMismatchedPixels`
   * will be used.
   */
  allowableMismatchedPixels?: number;

  /**
   * The `allowableMismatchedRatio` ranges from `0` to `1` and is used to
   * determine an acceptable ratio of pixels that can be mismatched before
   * the image is considered to have changes. Realistically, two screenshots
   * representing the same content may have a small number of pixels that
   * are not identical due to anti-aliasing, which is perfectly normal. The
   * `allowableMismatchedRatio` is the number of pixels that were mismatched,
   * divided by the total number of pixels in the screenshot. For example,
   * a ratio value of `0.06` means 6% of the pixels can be mismatched before
   * the image is considered to have changes. If the `allowableMismatchedRatio`
   * is provided it will take precedence, otherwise `allowableMismatchedPixels`
   * will be used.
   */
  allowableMismatchedRatio?: number;

  /**
   * Matching threshold while comparing two screenshots. Value ranges from `0` to `1`.
   * Smaller values make the comparison more sensitive. The `pixelmatchThreshold`
   * value helps to ignore anti-aliasing. Default: `0.1`
   */
  pixelmatchThreshold?: number;

  /**
   * Additional arguments to pass to the browser instance.
   */
  browserArgs?: string[];

  /**
   * Path to a Chromium or Chrome executable to run instead of the bundled Chromium.
   * @default env.PUPPETEER_EXECUTABLE_PATH || env.CHROME_PATH || puppeteer.computeExecutablePath()
   */
  browserExecutablePath?: string;

  /**
   * Url of remote Chrome instance to use instead of local Chrome.
   */
  browserWSEndpoint?: string;

  /**
   * The browser channel to use for e2e tests (stable, beta, dev or canary).
   * @default 'chrome'
   */
  browserChannel?: 'chrome' | 'chrome-beta' | 'chrome-dev' | 'chrome-canary';

  /**
   * Whether to run browser e2e tests in headless mode using Chrome Headless Shell
   * @ref https://developer.chrome.com/blog/chrome-headless-shell
   * @default shell
   */
  browserHeadless?: boolean | 'shell';

  /**
   * Slows down e2e browser operations by the specified amount of milliseconds.
   * Useful so that you can see what is going on.
   */
  browserSlowMo?: number;

  /**
   * By default, all E2E pages wait until the "load" event, this global setting can be used
   * to change the default `waitUntil` behavior.
   */
  browserWaitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';

  /**
   * Whether to auto-open a DevTools panel for each tab.
   * If this option is true, the headless option will be set false
   */
  browserDevtools?: boolean;

  /**
   * Array of browser emulations to be used during _screenshot_ tests. A full screenshot
   * test is ran for each emulation.
   *
   * To emulate a device display for your e2e tests, use the `setViewport` method on a test's E2E page.
   * An example can be found in [the Stencil docs](https://stenciljs.com/docs/end-to-end-testing#emulate-a-display).
   */
  emulate?: EmulateConfig[];

  /**
   * Path to the Screenshot Connector module.
   */
  screenshotConnector?: string;

  /**
   * Timeout for the pixelmatch worker to resolve (in ms).
   * @default 2500
   */
  screenshotTimeout?: number | null;

  /**
   * Amount of time in milliseconds to wait before a screenshot is taken.
   */
  waitBeforeScreenshot?: number;
}

export interface EmulateConfig {
  /**
   * Predefined device descriptor name, such as "iPhone X" or "Nexus 10".
   * For a complete list please see: https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts
   */
  device?: string;

  /**
   * User-Agent to be used. Defaults to the user-agent of the installed Puppeteer version.
   */
  userAgent?: string;

  viewport?: EmulateViewport;
}

export interface EmulateViewport {
  /**
   * Page width in pixels.
   */
  width: number;

  /**
   * page height in pixels.
   */
  height: number;

  /**
   * Specify device scale factor (can be thought of as dpr). Defaults to 1.
   */
  deviceScaleFactor?: number;

  /**
   * Whether the meta viewport tag is taken into account. Defaults to false.
   */
  isMobile?: boolean;

  /**
   * Specifies if viewport supports touch events. Defaults to false
   */
  hasTouch?: boolean;

  /**
   * Specifies if viewport is in landscape mode. Defaults to false.
   */
  isLandscape?: boolean;
}

/**
 * This sets the log level hierarchy for our terminal logger, ranging from
 * most to least verbose.
 *
 * Ordering the levels like this lets us easily check whether we should log a
 * message at a given time. For instance, if the log level is set to `'warn'`,
 * then anything passed to the logger with level `'warn'` or `'error'` should
 * be logged, but we should _not_ log anything with level `'info'` or `'debug'`.
 *
 * If we have a current log level `currentLevel` and a message with level
 * `msgLevel` is passed to the logger, we can determine whether or not we should
 * log it by checking if the log level on the message is further up or at the
 * same level in the hierarchy than `currentLevel`, like so:
 *
 * ```ts
 * LOG_LEVELS.indexOf(msgLevel) >= LOG_LEVELS.indexOf(currentLevel)
 * ```
 *
 * NOTE: for the reasons described above, do not change the order of the entries
 * in this array without good reason!
 */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Abstract interface representing a logger with the capability to accept log
 * messages at various levels (debug, info, warn, and error), set colors, log
 * time spans, print diagnostic messages, and more.
 *
 * A Node.js-specific implementation of this interface is used when Stencil is
 * building and compiling a project.
 */
export interface Logger {
  enableColors: (useColors: boolean) => void;
  setLevel: (level: LogLevel) => void;
  getLevel: () => LogLevel;
  debug: (...msg: any[]) => void;
  info: (...msg: any[]) => void;
  warn: (...msg: any[]) => void;
  error: (...msg: any[]) => void;
  createTimeSpan: (startMsg: string, debug?: boolean, appendTo?: string[]) => LoggerTimeSpan;
  printDiagnostics: (diagnostics: Diagnostic[], cwd?: string) => void;
  red: (msg: string) => string;
  green: (msg: string) => string;
  yellow: (msg: string) => string;
  blue: (msg: string) => string;
  magenta: (msg: string) => string;
  cyan: (msg: string) => string;
  gray: (msg: string) => string;
  bold: (msg: string) => string;
  dim: (msg: string) => string;
  bgRed: (msg: string) => string;
  emoji: (e: string) => string;
  setLogFilePath?: (p: string) => void;
  writeLogs?: (append: boolean) => void;
  createLineUpdater?: () => Promise<LoggerLineUpdater>;
}

export interface LoggerLineUpdater {
  update(text: string): Promise<void>;
  stop(): Promise<void>;
}

export interface LoggerTimeSpan {
  duration(): number;
  finish(finishedMsg: string, color?: string, bold?: boolean, newLineSuffix?: boolean): number;
}

export interface OutputTargetDist extends OutputTargetValidationConfig {
  type: 'dist';

  buildDir?: string;

  collectionDir?: string | null;
  /**
   * When `true` this flag will transform aliased import paths defined in
   * a project's `tsconfig.json` to relative import paths in the compiled output's
   * `dist-collection` bundle if it is generated (i.e. `collectionDir` is set).
   *
   * Paths will be left in aliased format if `false`.
   *
   * @example
   * // tsconfig.json
   * {
   *   paths: {
   *     "@utils/*": ['/src/utils/*']
   *   }
   * }
   *
   * // Source file
   * import * as dateUtils from '@utils/date-utils';
   * // Output file
   * import * as dateUtils from '../utils/date-utils';
   */
  transformAliasedImportPathsInCollection?: boolean | null;

  typesDir?: string;

  /**
   * Provide a custom path for the ESM loader directory, containing files you can import
   * in an initiation script within your application to register all your components for
   * lazy loading.
   *
   * @default /dist/loader
   */
  esmLoaderPath?: string;
  copy?: CopyTask[];
  polyfills?: boolean;

  empty?: boolean;
}

export interface OutputTargetDistCollection extends OutputTargetValidationConfig {
  type: 'dist-collection';
  empty?: boolean;
  dir: string;
  collectionDir: string;
  /**
   * When `true` this flag will transform aliased import paths defined in
   * a project's `tsconfig.json` to relative import paths in the compiled output.
   *
   * Paths will be left in aliased format if `false` or `undefined`.
   *
   * @example
   * // tsconfig.json
   * {
   *   paths: {
   *     "@utils/*": ['/src/utils/*']
   *   }
   * }
   *
   * // Source file
   * import * as dateUtils from '@utils/date-utils';
   * // Output file
   * import * as dateUtils from '../utils/date-utils';
   */
  transformAliasedImportPaths?: boolean | null;
}

export interface OutputTargetDistTypes extends OutputTargetValidationConfig {
  type: 'dist-types';
  dir: string;
  typesDir: string;
}

export interface OutputTargetDistLazy extends OutputTargetBase {
  type: 'dist-lazy';

  dir?: string;
  esmDir?: string;
  esmEs5Dir?: string;
  systemDir?: string;
  cjsDir?: string;
  polyfills?: boolean;
  isBrowserBuild?: boolean;

  esmIndexFile?: string;
  cjsIndexFile?: string;
  systemLoaderFile?: string;
  legacyLoaderFile?: string;
  empty?: boolean;
}

export interface OutputTargetDistGlobalStyles extends OutputTargetBase {
  type: 'dist-global-styles';
  file: string;
}

export interface OutputTargetDistLazyLoader extends OutputTargetBase {
  type: 'dist-lazy-loader';
  dir: string;

  esmDir: string;
  esmEs5Dir?: string;
  cjsDir: string;
  componentDts: string;

  empty: boolean;
}

export interface OutputTargetHydrate extends OutputTargetBase {
  type: 'dist-hydrate-script';
  dir?: string;
  /**
   * Module IDs that should not be bundled into the script.
   * By default, all node builtin's, such as `fs` or `path`
   * will be considered "external" and not bundled.
   */
  external?: string[];
  empty?: boolean;
  minify?: boolean;
}

export interface OutputTargetCustom extends OutputTargetBase {
  type: 'custom';
  name: string;
  /**
   * Indicate when the output target should be executed.
   *
   * - `"onBuildOnly"`: Executed only when `stencil build` is called without `--watch`.
   * - `"always"`: Executed on every build, including in `watch` mode.
   *
   * Defaults to "always".
   */
  taskShouldRun?: 'onBuildOnly' | 'always';
  validate?: (config: Config, diagnostics: Diagnostic[]) => void;
  generator: (config: Config, compilerCtx: CompilerCtx, buildCtx: BuildCtx, docs: JsonDocs) => Promise<void>;
  copy?: CopyTask[];
}

/**
 * Output target for generating [custom data](https://github.com/microsoft/vscode-custom-data) for VS Code as a JSON
 * file.
 */
export interface OutputTargetDocsVscode extends OutputTargetBase {
  /**
   * Designates this output target to be used for generating VS Code custom data.
   * @see OutputTargetBase#type
   */
  type: 'docs-vscode';
  /**
   * The location on disk to write the JSON file.
   */
  file: string;
  /**
   * A base URL to find the source code of the component(s) described in the JSON file.
   */
  sourceCodeBaseUrl?: string;
}

export interface OutputTargetDocsReadme extends OutputTargetBase {
  type: 'docs-readme';
  /**
   * The root directory where README files should be written
   *
   * defaults to {@link Config.srcDir}
   */
  dir?: string;
  dependencies?: boolean;
  /**
   * Controls how READMEs are written to the destination directory.
   *
   * - `true`: Always overwrite the destination README with the full content.
   * - `false` (default): Only update the autogenerated content, preserving existing custom content above it.
   * - `'if-missing'`: Write the full README only if no file exists at the destination.
   *
   * This option enables workflows requiring consistent, idempotent output across builds,
   * and supports setups where custom documentation may need to coexist or vary between environments.
   */
  overwriteExisting?: boolean | 'if-missing';
  footer?: string;
  strict?: boolean;
}

export interface OutputTargetDocsJson extends OutputTargetBase {
  type: 'docs-json';

  file: string;
  /**
   * Set an optional file path where Stencil should write a `d.ts` file to disk
   * at build-time containing type declarations for {@link JsonDocs} and related
   * interfaces. If this is omitted or set to `null` Stencil will not write such
   * a file.
   */
  typesFile?: string | null;
  strict?: boolean;
  /**
   * An optional file path pointing to a public type library which should be
   * included and documented in the same way as other types which are included
   * in this output target.
   *
   * This could be useful if, for instance, there are some important interfaces
   * used in a few places in a Stencil project which don't form part of the
   * public API for any of the project's components. Such interfaces will not
   * be included in the `docs-json` output by default, but if they're declared
   * and exported from a 'supplemental' file designated with this property then
   * they'll be included in the output, facilitating their documentation.
   */
  supplementalPublicTypes?: string;
}

export interface OutputTargetDocsCustom extends OutputTargetBase {
  type: 'docs-custom';

  generator: (docs: JsonDocs, config: Config) => void | Promise<void>;
  strict?: boolean;
}

export interface OutputTargetStats extends OutputTargetBase {
  type: 'stats';

  file?: string;
}

export interface OutputTargetBaseNext {
  type: string;
  dir?: string;
}

/**
 * The collection of valid export behaviors.
 * Used to generate a type for typed configs as well as output target validation
 * for the `dist-custom-elements` output target.
 *
 * Adding a value to this const array will automatically add it as a valid option on the
 * output target configuration for `customElementsExportBehavior`.
 *
 * - `default`: No additional export or definition behavior will happen.
 * - `auto-define-custom-elements`: Enables the auto-definition of a component and its children (recursively) in the custom elements registry. This
 * functionality allows consumers to bypass the explicit call to define a component, its children, its children's
 * children, etc. Users of this flag should be aware that enabling this functionality may increase bundle size.
 * - `bundle`: A `defineCustomElements` function will be exported from the distribution directory. This behavior was added to allow easy migration
 * from `dist-custom-elements-bundle` to `dist-custom-elements`.
 * - `single-export-module`: All components will be re-exported from the specified directory's root `index.js` file.
 */
export const CustomElementsExportBehaviorOptions = [
  'default',
  'auto-define-custom-elements',
  'bundle',
  'single-export-module',
] as const;

/**
 * This type is auto-generated based on the values in `CustomElementsExportBehaviorOptions` array.
 * This is used on the output target config for intellisense in typed configs.
 */
export type CustomElementsExportBehavior = (typeof CustomElementsExportBehaviorOptions)[number];

export interface OutputTargetDistCustomElements extends OutputTargetValidationConfig {
  type: 'dist-custom-elements';
  empty?: boolean;
  /**
   * Triggers the following behaviors when enabled:
   * 1. All `@stencil/core/*` module references are treated as external during bundling.
   * 2. File names are not hashed.
   * 3. File minification will follow the behavior defined at the root of the Stencil config.
   */
  externalRuntime?: boolean;
  copy?: CopyTask[];
  includeGlobalScripts?: boolean;
  minify?: boolean;
  /**
   * Enables the generation of type definition files for the output target.
   */
  generateTypeDeclarations?: boolean;
  /**
   * Define the export/definition behavior for the output target's generated output.
   * This controls if/how custom elements will be defined or where components will be exported from.
   * If omitted, no auto-definition behavior or re-exporting will happen.
   */
  customElementsExportBehavior?: CustomElementsExportBehavior;
}

/**
 * The base type for output targets. All output targets should extend this base type.
 */
export interface OutputTargetBase {
  /**
   * A unique string to differentiate one output target from another
   */
  type: string;
}

/**
 * Output targets that can have validation for common `package.json` field values
 * (module, types, etc.). This allows them to be marked for validation in a project's Stencil config.
 */
interface OutputTargetValidationConfig extends OutputTargetBaseNext {
  isPrimaryPackageOutputTarget?: boolean;
}

export type EligiblePrimaryPackageOutputTarget =
  | OutputTargetDist
  | OutputTargetDistCustomElements
  | OutputTargetDistCollection
  | OutputTargetDistTypes;

export type OutputTargetBuild = OutputTargetDistCollection | OutputTargetDistLazy;

export interface OutputTargetCopy extends OutputTargetBase {
  type: 'copy';

  dir: string;
  copy?: CopyTask[];
  copyAssets?: 'collection' | 'dist';
}

export interface OutputTargetWww extends OutputTargetBase {
  /**
   * Webapp output target.
   */
  type: 'www';

  /**
   * The directory to write the app's JavaScript and CSS build
   * files to. The default is to place this directory as a child
   * to the `dir` config. Default: `build`
   */
  buildDir?: string;

  /**
   * The directory to write the entire application to.
   * Note, the `buildDir` is where the app's JavaScript and CSS build
   * files are written. Default: `www`
   */
  dir?: string;

  /**
   * Empty the build directory of all files and directories on first build.
   * Default: `true`
   */
  empty?: boolean;

  /**
   * The default index html file of the app, commonly found at the
   * root of the `src` directory.
   * Default: `index.html`
   */
  indexHtml?: string;

  /**
   * The copy config is an array of objects that defines any files or folders that should
   * be copied over to the build directory.
   *
   * Each object in the array must include a src property which can be either an absolute path,
   * a relative path or a glob pattern. The config can also provide an optional dest property
   * which can be either an absolute path or a path relative to the build directory.
   * Also note that any files within src/assets are automatically copied to www/assets for convenience.
   *
   * In the copy config below, it will copy the entire directory from src/docs-content over to www/docs-content.
   */
  copy?: CopyTask[];

  /**
   * The base url of the app, it's required during prerendering to be the absolute path
   * of your app, such as: `https://my.app.com/app`.
   *
   * Default: `/`
   */
  baseUrl?: string;

  /**
   * By default, stencil will include all the polyfills required by legacy browsers in the ES5 build.
   * If it's `false`, stencil will not emit this polyfills anymore and it's your responsibility to provide them before
   * stencil initializes.
   */
  polyfills?: boolean;

  /**
   * Path to an external node module which has exports of the prerender config object.
   * ```
   * module.exports = {
   *   afterHydrate(document, url) {
   *     document.title = `URL: ${url.href}`;
   *   }
   * }
   * ```
   */
  prerenderConfig?: string;

  /**
   * Service worker config for production builds. During development builds
   * service worker script will be injected to automatically deregister existing
   * service workers. When set to `false` neither a service worker registration
   * or deregistration will be added to the index.html.
   */
  serviceWorker?: ServiceWorkerConfig | null | false;
  appDir?: string;
}

export type OutputTarget =
  | OutputTargetCopy
  | OutputTargetCustom
  | OutputTargetDist
  | OutputTargetDistCollection
  | OutputTargetDistCustomElements
  | OutputTargetDistLazy
  | OutputTargetDistGlobalStyles
  | OutputTargetDistLazyLoader
  | OutputTargetDocsJson
  | OutputTargetDocsCustom
  | OutputTargetDocsReadme
  | OutputTargetDocsVscode
  | OutputTargetWww
  | OutputTargetHydrate
  | OutputTargetStats
  | OutputTargetDistTypes;

/**
 * Our custom configuration interface for generated caching Service Workers
 * using the Workbox library (see https://developer.chrome.com/docs/workbox/).
 *
 * Although we are using Workbox we are unfortunately unable to depend on the
 * published types for the library because they must be compiled using the
 * `webworker` lib for TypeScript, which cannot be used at the same time as
 * the `dom` lib. So as a workaround we maintain our own interface here. See
 * here to refer to the published version:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/c7b4dadae5b320ad1311a8f82242b8f2f41b7b8c/types/workbox-build/generate-sw.d.ts#L3
 */
export interface ServiceWorkerConfig {
  // https://developers.google.com/web/tools/workbox/modules/workbox-build#full_generatesw_config
  unregister?: boolean;

  swDest?: string;
  swSrc?: string;
  globPatterns?: string[];
  globDirectory?: string | string[];
  globIgnores?: string | string[];
  templatedUrls?: any;
  maximumFileSizeToCacheInBytes?: number;
  manifestTransforms?: any;
  modifyUrlPrefix?: any;
  dontCacheBustURLsMatching?: RegExp;
  navigateFallback?: string;
  navigateFallbackWhitelist?: RegExp[];
  navigateFallbackBlacklist?: RegExp[];
  cacheId?: string;
  skipWaiting?: boolean;
  clientsClaim?: boolean;
  directoryIndex?: string;
  runtimeCaching?: any[];
  ignoreUrlParametersMatching?: any[];
  handleFetch?: boolean;
}

export interface LoadConfigInit {
  /**
   * User config object to merge into default config and
   * config loaded from a file path.
   */
  config?: UnvalidatedConfig;
  /**
   * Absolute path to a Stencil config file. This path cannot be
   * relative and it does not resolve config files within a directory.
   */
  configPath?: string;
  logger?: Logger;
  sys?: CompilerSystem;
  /**
   * When set to true, if the "tsconfig.json" file is not found
   * it'll automatically generate and save a default tsconfig
   * within the root directory.
   */
  initTsConfig?: boolean;
}

/**
 * Results from an attempt to load a config. The values on this interface
 * have not yet been validated and are not ready to be used for arbitrary
 * operations around the codebase.
 */
export interface LoadConfigResults {
  config: ValidatedConfig;
  diagnostics: Diagnostic[];
  tsconfig: {
    path: string;
    compilerOptions: any;
    files: string[];
    include: string[];
    exclude: string[];
    extends: string;
  };
}

export interface Diagnostic {
  absFilePath?: string | undefined;
  code?: string;
  columnNumber?: number | undefined;
  debugText?: string;
  header?: string;
  language?: string;
  level: 'error' | 'warn' | 'info' | 'log' | 'debug';
  lineNumber?: number | undefined;
  lines: PrintLine[];
  messageText: string;
  relFilePath?: string | undefined;
  type: string;
}

export interface CacheStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
}

export interface WorkerOptions {
  maxConcurrentWorkers?: number;
  maxConcurrentTasksPerWorker?: number;
  logger?: Logger;
}

export interface RollupInterface {
  rollup: {
    (config: any): Promise<any>;
  };
  plugins: {
    nodeResolve(opts: any): any;
    replace(opts: any): any;
    commonjs(opts: any): any;
    json(): any;
  };
}

export interface ResolveModuleOptions {
  manuallyResolve?: boolean;
  packageJson?: boolean;
}

export interface PrerenderStartOptions {
  buildId?: string;
  hydrateAppFilePath?: string;
  componentGraph?: BuildResultsComponentGraph;
  srcIndexHtmlPath?: string;
}

export interface PrerenderResults {
  buildId: string;
  diagnostics: Diagnostic[];
  urls: number;
  duration: number;
  average: number;
}

/**
 * Input for CSS optimization functions, including the input CSS
 * string and a few boolean options which turn on or off various
 * optimizations.
 */
export interface OptimizeCssInput {
  input: string;
  filePath?: string;
  autoprefixer?: boolean | null | AutoprefixerOptions;
  minify?: boolean;
  sourceMap?: boolean;
  resolveUrl?: (url: string) => Promise<string> | string;
}

/**
 * This is not a real interface describing the options which can
 * be passed to autoprefixer, for that see the docs, here:
 * https://github.com/postcss/autoprefixer#options
 *
 * Instead, this basically just serves as a label type to track
 * that arguments are being passed consistently.
 */
export type AutoprefixerOptions = Object;

/**
 * Output from CSS optimization functions, wrapping up optimized
 * CSS and any diagnostics produced during optimization.
 */
export interface OptimizeCssOutput {
  output: string;
  diagnostics: Diagnostic[];
}

export interface OptimizeJsInput {
  input: string;
  filePath?: string;
  target?: 'es5' | 'latest';
  pretty?: boolean;
  sourceMap?: boolean;
}

export interface OptimizeJsOutput {
  output: string;
  sourceMap: any;
  diagnostics: Diagnostic[];
}

export interface LazyRequire {
  ensure(fromDir: string, moduleIds: string[]): Promise<Diagnostic[]>;
  require(fromDir: string, moduleId: string): any;
  getModulePath(fromDir: string, moduleId: string): string;
}

/**
 * @deprecated This interface is no longer used by Stencil
 * TODO(STENCIL-743): Remove this interface
 */
export interface FsWatcherItem {
  close(): void;
}

/**
 * @deprecated This interface is no longer used by Stencil
 * TODO(STENCIL-743): Remove this interface
 */
export interface MakeDirectoryOptions {
  /**
   * Indicates whether parent folders should be created.
   * @default false
   */
  recursive?: boolean;
  /**
   * A file mode. If a string is passed, it is parsed as an octal integer. If not specified
   * @default 0o777.
   */
  mode?: number;
}

/**
 * @deprecated This interface is no longer used by Stencil
 * TODO(STENCIL-743): Remove this interface
 */
export interface FsStats {
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
}

export interface Compiler {
  build(): Promise<CompilerBuildResults>;
  createWatcher(): Promise<CompilerWatcher>;
  destroy(): Promise<void>;
  sys: CompilerSystem;
}

export interface CompilerWatcher extends BuildOnEvents {
  start: () => Promise<WatcherCloseResults>;
  close: () => Promise<WatcherCloseResults>;
  request: (data: CompilerRequest) => Promise<CompilerRequestResponse>;
}

export interface CompilerRequest {
  path?: string;
}

export interface WatcherCloseResults {
  exitCode: number;
}

export interface CompilerRequestResponse {
  path: string;
  nodeModuleId: string;
  nodeModuleVersion: string;
  nodeResolvedPath: string;
  cachePath: string;
  cacheHit: boolean;
  content: string;
  status: number;
}

/**
 * Options for Stencil's string-to-string transpiler
 */
export interface TranspileOptions {
  /**
   * A component can be defined as a custom element by using `customelement`, or the
   * component class can be exported by using `module`. Default is `customelement`.
   */
  componentExport?: 'customelement' | 'module' | string | undefined;
  /**
   * Sets how and if component metadata should be assigned on the compiled
   * component output. The `compilerstatic` value will set the metadata to
   * a static `COMPILER_META` getter on the component class. This option
   * is useful for unit testing preprocessors. Default is `null`.
   */
  componentMetadata?: 'runtimestatic' | 'compilerstatic' | string | undefined;
  /**
   * The actual internal import path for any `@stencil/core` imports.
   * Default is `@stencil/core/internal/client`.
   */
  coreImportPath?: string;
  /**
   * The current working directory. Default is `/`.
   */
  currentDirectory?: string;
  /**
   * The filename of the code being compiled. Default is `module.tsx`.
   */
  file?: string;
  /**
   * Module format to use for the compiled code output, which can be either `esm` or `cjs`.
   * Default is `esm`.
   */
  module?: 'cjs' | 'esm' | string;
  /**
   * Sets how and if any properties, methods and events are proxied on the
   * component class. The `defineproperty` value sets the getters and setters
   * using Object.defineProperty. Default is `defineproperty`.
   */
  proxy?: 'defineproperty' | string | undefined;
  /**
   * How component styles should be associated to the component. The `static`
   * setting will assign the styles as a static getter on the component class.
   */
  style?: 'static' | string | undefined;
  /**
   * How style data should be added for imports. For example, the `queryparams` value
   * adds the component's tagname and encapsulation info as querystring parameter
   * to the style's import, such as `style.css?tag=my-tag&encapsulation=shadow`. This
   * style data can be used by bundlers to further optimize each component's css.
   * Set to `null` to not include the querystring parameters. Default is `queryparams`.
   */
  styleImportData?: 'queryparams' | string | undefined;
  /**
   * The JavaScript source target TypeScript should to transpile to. Values can be
   * `latest`, `esnext`, `es2017`, `es2015`, or `es5`. Defaults to `latest`.
   */
  target?: CompileTarget;
  /**
   * Create a source map. Using `inline` will inline the source map into the
   * code, otherwise the source map will be in the returned `map` property.
   * Default is `true`.
   */
  sourceMap?: boolean | 'inline';
  /**
   * Base directory to resolve non-relative module names. Same as the `baseUrl`
   * TypeScript compiler option: https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
   */
  baseUrl?: string;
  /**
   * List of path mapping entries for module names to locations relative to the `baseUrl`.
   * Same as the `paths` TypeScript compiler option:
   * https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
   */
  paths?: { [key: string]: string[] };
  /**
   * Passed in Stencil Compiler System, otherwise falls back to the internal in-memory only system.
   */
  sys?: CompilerSystem;
  /**
   * This option enables the same behavior as {@link Config.transformAliasedImportPaths}, transforming paths aliased in
   * `tsconfig.json` to relative paths.
   */
  transformAliasedImportPaths?: boolean;
  /**
   * List of tags to transform, by default only the incoming component tag is transformed
   */
  tagsToTransform?: string[];
  /**
   * Adds `transformTag` calls to css strings and querySelector(All) calls
   */
  additionalTagTransformers?: boolean;
}

export type CompileTarget =
  | 'latest'
  | 'esnext'
  | 'es2020'
  | 'es2019'
  | 'es2018'
  | 'es2017'
  | 'es2015'
  | 'es5'
  | string
  | undefined;

export interface TranspileResults {
  code: string;
  data?: any[];
  diagnostics: Diagnostic[];
  imports?: { path: string }[];
  inputFileExtension: string;
  inputFilePath: string;
  map: any;
  outputFilePath: string;
}

export interface TransformOptions {
  coreImportPath: string;
  componentExport: 'lazy' | 'module' | 'customelement' | null;
  componentMetadata: 'runtimestatic' | 'compilerstatic' | null;
  currentDirectory: string;
  file?: string;
  isolatedModules?: boolean;
  module?: 'cjs' | 'esm';
  proxy: 'defineproperty' | null;
  style: 'static' | null;
  styleImportData: 'queryparams' | null;
  target?: string;
}

export interface CompileScriptMinifyOptions {
  target?: CompileTarget;
  pretty?: boolean;
}

export interface DevServer extends BuildEmitEvents {
  address: string;
  basePath: string;
  browserUrl: string;
  protocol: string;
  port: number;
  root: string;
  close(): Promise<void>;
}

export interface CliInitOptions {
  args: string[];
  logger: Logger;
  sys: CompilerSystem;
}
