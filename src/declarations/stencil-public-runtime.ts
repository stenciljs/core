declare type CustomMethodDecorator<T> = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | void;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;

export interface ComponentDecorator {
  (opts?: ComponentOptions): ClassDecorator;
}
export interface ComponentOptions {
  /**
   * When set to `true` this component will be form-associated. See
   * https://stenciljs.com/docs/next/form-associated documentation on how to
   * build form-associated Stencil components that integrate into forms like
   * native browser elements such as `<input>` and `<textarea>`.
   *
   * The {@link AttachInternals} decorator allows for access to the
   * `ElementInternals` object to modify the associated form.
   */
  formAssociated?: boolean;
  /**
   * Tag name of the web component. Ideally, the tag name must be globally unique,
   * so it's recommended to choose an unique prefix for all your components within the same collection.
   *
   * In addition, tag name must contain a '-'
   */
  tag: string;

  /**
   * If `true`, the component will use scoped stylesheets. Similar to shadow-dom,
   * but without native isolation. Defaults to `false`.
   */
  scoped?: boolean;

  /**
   * If `true`, the component will use native shadow-dom encapsulation, it will fallback to
   * `scoped` if the browser does not support shadow-dom natively. Defaults to `false`.
   * Additionally, `shadow` can also be given options when attaching the shadow root.
   */
  shadow?: boolean | ShadowRootOptions;

  /**
   * Relative URL to some external stylesheet file. It should be a `.css` file unless some
   * external plugin is installed like `@stencil/sass`.
   */
  styleUrl?: string;

  /**
   * Similar as `styleUrl` but allows to specify different stylesheets for different modes.
   */
  styleUrls?: string[] | ModeStyles;

  /**
   * String that contains inlined CSS instead of using an external stylesheet.
   * The performance characteristics of this feature are the same as using an external stylesheet.
   *
   * Notice, you can't use sass, or less, only `css` is allowed using `styles`, use `styleUrl` is you need more advanced features.
   */
  styles?: string | { [modeName: string]: any };

  /**
   * Array of relative links to folders of assets required by the component.
   */
  assetsDirs?: string[];
}

export interface ShadowRootOptions {
  /**
   * When set to `true`, specifies behavior that mitigates custom element issues
   * around focusability. When a non-focusable part of the shadow DOM is clicked, the first
   * focusable part is given focus, and the shadow host is given any available `:focus` styling.
   */
  delegatesFocus?: boolean;
}

export interface ModeStyles {
  [modeName: string]: string | string[];
}

export interface PropDecorator {
  (opts?: PropOptions): PropertyDecorator;
}
export interface PropOptions {
  /**
   * The name of the associated DOM attribute.
   * Stencil uses different heuristics to determine the default name of the attribute,
   * but using this property, you can override the default behavior.
   */
  attribute?: string | null;

  /**
   * A Prop is _by default_ immutable from inside the component logic.
   * Once a value is set by a user, the component cannot update it internally.
   * However, it's possible to explicitly allow a Prop to be mutated from inside the component,
   * by setting this `mutable` option to `true`.
   */
  mutable?: boolean;

  /**
   * In some cases it may be useful to keep a Prop in sync with an attribute.
   * In this case you can set the `reflect` option to `true`, since it defaults to `false`:
   */
  reflect?: boolean;
}

export interface MethodDecorator {
  (opts?: MethodOptions): CustomMethodDecorator<any>;
}
export interface MethodOptions {}

export interface ElementDecorator {
  (): PropertyDecorator;
}

export interface EventDecorator {
  (opts?: EventOptions): PropertyDecorator;
}
export interface EventOptions {
  /**
   * A string custom event name to override the default.
   */
  eventName?: string;
  /**
   * A Boolean indicating whether the event bubbles up through the DOM or not.
   */
  bubbles?: boolean;

  /**
   * A Boolean indicating whether the event is cancelable.
   */
  cancelable?: boolean;

  /**
   * A Boolean value indicating whether or not the event can bubble across the boundary between the shadow DOM and the regular DOM.
   */
  composed?: boolean;
}

export interface AttachInternalsDecorator {
  (): PropertyDecorator;
}

export interface ListenDecorator {
  (eventName: string, opts?: ListenOptions): CustomMethodDecorator<any>;
}
export interface ListenOptions {
  /**
   * Handlers can also be registered for an event other than the host itself.
   * The `target` option can be used to change where the event listener is attached,
   * this is useful for listening to application-wide events.
   */
  target?: ListenTargetOptions;

  /**
   * Event listener attached with `@Listen` does not "capture" by default,
   * When a event listener is set to "capture", means the event will be dispatched
   * during the "capture phase". Please see
   * https://www.quirksmode.org/js/events_order.html for further information.
   */
  capture?: boolean;

  /**
   * By default, Stencil uses several heuristics to determine if
   * it must attach a `passive` event listener or not.
   *
   * Using the `passive` option can be used to change the default behavior.
   * Please see https://developers.google.com/web/updates/2016/06/passive-event-listeners for further information.
   */
  passive?: boolean;
}

export type ListenTargetOptions = 'body' | 'document' | 'window';

export interface StateDecorator {
  (): PropertyDecorator;
}

export interface WatchDecorator {
  (propName: string): CustomMethodDecorator<any>;
}

export interface UserBuildConditionals {
  isDev: boolean;
  isBrowser: boolean;
  isServer: boolean;
  isTesting: boolean;
}

/**
 * The `Build` object provides many build conditionals that can be used to
 * include or exclude code depending on the build.
 */
export declare const Build: UserBuildConditionals;

/**
 * The `Env` object provides access to the "env" object declared in the project's `stencil.config.ts`.
 */
export declare const Env: { [prop: string]: string | undefined };

/**
 * The `@Component()` decorator is used to provide metadata about the component class.
 * https://stenciljs.com/docs/component
 */
export declare const Component: ComponentDecorator;

/**
 * The `@Element()` decorator is a reference to the actual host element
 * once it has rendered.
 */
export declare const Element: ElementDecorator;

/**
 * Components can emit data and events using the Event Emitter decorator.
 * To dispatch Custom DOM events for other components to handle, use the
 * `@Event()` decorator. The Event decorator also makes it easier for Stencil
 * to automatically build types and documentation for the event data.
 * https://stenciljs.com/docs/events
 */
export declare const Event: EventDecorator;

/**
 * If the `formAssociated` option is set in options passed to the
 * `@Component()` decorator then this decorator may be used to get access to the
 * `ElementInternals` instance associated with the component.
 */
export declare const AttachInternals: AttachInternalsDecorator;

/**
 * The `Listen()` decorator is for listening DOM events, including the ones
 * dispatched from `@Events()`.
 * https://stenciljs.com/docs/events#listen-decorator
 */
export declare const Listen: ListenDecorator;

/**
 * The `@Method()` decorator is used to expose methods on the public API.
 * Class methods decorated with the @Method() decorator can be called directly
 * from the element, meaning they are intended to be callable from the outside.
 * https://stenciljs.com/docs/methods
 */
export declare const Method: MethodDecorator;

/**
 * Props are custom attribute/properties exposed publicly on the element
 * that developers can provide values for. Children components do not need to
 * know about or reference parent components, so Props can be used to pass
 * data down from the parent to the child. Components need to explicitly
 * declare the Props they expect to receive using the `@Prop()` decorator.
 * Any value changes to a Prop will cause a re-render.
 * https://stenciljs.com/docs/properties
 */
export declare const Prop: PropDecorator;

/**
 * The `@State()` decorator can be used to manage internal data for a component.
 * This means that a user cannot modify this data from outside the component,
 * but the component can modify it however it sees fit. Any value changes to a
 * `@State()` property will cause the components render function to be called again.
 * https://stenciljs.com/docs/state
 */
export declare const State: StateDecorator;

/**
 * When a property's value has changed, a method decorated with `@Watch()` will be
 * called and passed the new value of the prop along with the old value. Watch is
 * useful for validating props or handling side effects. Watch decorator does not
 * fire when a component initially loads.
 * https://stenciljs.com/docs/reactive-data#watch-decorator
 */
export declare const Watch: WatchDecorator;

export type ResolutionHandler = (elm: HTMLElement) => string | undefined | null;

export type ErrorHandler = (err: any, element?: HTMLElement) => void;

/**
 * `setMode()` is used for libraries which provide multiple "modes" for styles.
 */
export declare const setMode: (handler: ResolutionHandler) => void;

/**
 * `getMode()` is used for libraries which provide multiple "modes" for styles.
 * @param ref a reference to the node to get styles for
 * @returns the current mode or undefined, if not found
 */
export declare function getMode<T = string | undefined>(ref: any): T;

export declare function setPlatformHelpers(helpers: {
  jmp?: (c: any) => any;
  raf?: (c: any) => number;
  ael?: (el: any, eventName: string, listener: any, options: any) => void;
  rel?: (el: any, eventName: string, listener: any, options: any) => void;
  ce?: (eventName: string, opts?: any) => any;
}): void;

/**
 * Get the base path to where the assets can be found. Use `setAssetPath(path)`
 * if the path needs to be customized.
 * @param path the path to use in calculating the asset path. this value will be
 * used in conjunction with the base asset path
 * @returns the base path
 */
export declare function getAssetPath(path: string): string;

/**
 * Method to render a virtual DOM tree to a container element.
 *
 * @example
 * ```tsx
 * import { render } from '@stencil/core';
 *
 * const vnode = (
 *   <div>
 *     <h1>Hello, world!</h1>
 *   </div>
 * );
 * render(vnode, document.body);
 * ```
 *
 * @param vnode - The virtual DOM tree to render
 * @param container - The container element to render the virtual DOM tree to
 */
export declare function render(vnode: VNode, container: Element): void;

/**
 * Used to manually set the base path where assets can be found. For lazy-loaded
 * builds the asset path is automatically set and assets copied to the correct
 * build directory. However, for custom elements builds, the `setAssetPath(path)` could
 * be used to customize the asset path depending on how the script file is consumed.
 * If the script is used as "module", it's recommended to use "import.meta.url", such
 * as `setAssetPath(import.meta.url)`. Other options include
 * `setAssetPath(document.currentScript.src)`, or using a bundler's replace plugin to
 * dynamically set the path at build time, such as `setAssetPath(process.env.ASSET_PATH)`.
 * But do note that this configuration depends on how your script is bundled, or lack of
 * bundling, and where your assets can be loaded from. Additionally custom bundling
 * will have to ensure the static assets are copied to its build directory.
 * @param path the asset path to set
 * @returns the set path
 */
export declare function setAssetPath(path: string): string;

/**
 * Used to specify a nonce value that corresponds with an application's
 * [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
 * When set, the nonce will be added to all dynamically created script and style tags at runtime.
 * Alternatively, the nonce value can be set on a `meta` tag in the DOM head
 * (<meta name="csp-nonce" content="{ nonce value here }" />) and will result in the same behavior.
 * @param nonce The value to be used for the nonce attribute.
 */
export declare function setNonce(nonce: string): void;

/**
 * Retrieve a Stencil element for a given reference
 * @param ref the ref to get the Stencil element for
 * @returns a reference to the element
 */
export declare function getElement(ref: any): HTMLStencilElement;

/**
 * Schedules a new render of the given instance or element even if no state changed.
 *
 * Notice `forceUpdate()` is not synchronous and might perform the DOM render in the next frame.
 *
 * @param ref the node/element to force the re-render of
 */
export declare function forceUpdate(ref: any): void;

/**
 * getRenderingRef
 * @returns the rendering ref
 */
export declare function getRenderingRef(): any;

export interface HTMLStencilElement extends HTMLElement {
  componentOnReady(): Promise<this>;
}

/**
 * Schedules a DOM-write task. The provided callback will be executed
 * in the best moment to perform DOM mutation without causing layout thrashing.
 *
 * For further information: https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
 *
 * @param task the DOM-write to schedule
 */
export declare function writeTask(task: RafCallback): void;

/**
 * Schedules a DOM-read task. The provided callback will be executed
 * in the best moment to perform DOM reads without causing layout thrashing.
 *
 * For further information: https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing
 *
 * @param task the DOM-read to schedule
 */
export declare function readTask(task: RafCallback): void;

/**
 * `setErrorHandler()` can be used to inject a custom global error handler.
 * Unhandled exception raised while rendering, during event handling, or lifecycles will trigger the custom event handler.
 */
export declare const setErrorHandler: (handler: ErrorHandler) => void;

export type MixinFactory = <TBase extends new (...args: any[]) => any>(
  base: TBase,
) => abstract new (...args: ConstructorParameters<TBase>) => any;

/**
 * Compose multiple mixin classes into a single constructor.
 * The resulting class has the combined instance types of all mixed-in classes.
 *
 * Example:
 * ```
 * import { Mixin, MixinFactory } from '@stencil/core';
 *
 * const AWrap: MixinFactory = (Base) => {class A extends Base { propA = A }; return A;}
 * const BWrap: MixinFactory = (Base) => {class B extends Base { propB = B }; return B;}
 * const CWrap: MixinFactory = (Base) => {class C extends Base { propC = C }; return C;}
 *
 * class X extends Mixin(AWrap, BWrap, CWrap) {
 *   render() { return <div>{this.propA} {this.propB} {this.propC}</div>; }
 * }
 * ```
 *
 * @param mixinFactories mixin factory functions that return a class which extends from the provided class.
 * @returns a class that that is composed from extending each of the provided classes in the order they were provided.
 */
export declare function Mixin<TMixins extends readonly MixinFactory[]>(
  ...mixinFactories: TMixins
): abstract new (...args: any[]) => UnionToIntersection<InstanceType<ReturnType<TMixins[number]>>>;

/**
 * This file gets copied to all distributions of stencil component collections.
 * - no imports
 */

export interface ComponentWillLoad {
  /**
   * The component is about to load and it has not
   * rendered yet.
   *
   * This is the best place to make any data updates
   * before the first render.
   *
   * componentWillLoad will only be called once.
   */
  componentWillLoad(): Promise<void> | void;
}

export interface ComponentDidLoad {
  /**
   * The component has loaded and has already rendered.
   *
   * Updating data in this method will cause the
   * component to re-render.
   *
   * componentDidLoad will only be called once.
   */
  componentDidLoad(): void;
}

export interface ComponentWillUpdate {
  /**
   * The component is about to update and re-render.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentWillUpdate is not called on the first render.
   */
  componentWillUpdate(): Promise<void> | void;
}

export interface ComponentDidUpdate {
  /**
   * The component has just re-rendered.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentWillUpdate is not called on the
   * first render.
   */
  componentDidUpdate(): void;
}

export interface ComponentInterface {
  connectedCallback?(): void;
  disconnectedCallback?(): void;

  componentWillRender?(): Promise<void> | void;
  componentDidRender?(): void;

  /**
   * The component is about to load and it has not
   * rendered yet.
   *
   * This is the best place to make any data updates
   * before the first render.
   *
   * componentWillLoad will only be called once.
   */
  componentWillLoad?(): Promise<void> | void;

  /**
   * The component has loaded and has already rendered.
   *
   * Updating data in this method will cause the
   * component to re-render.
   *
   * componentDidLoad will only be called once.
   */
  componentDidLoad?(): void;

  /**
   * A `@Prop` or `@State` property changed and a rerender is about to be requested.
   *
   * Called multiple times throughout the life of
   * the component as its properties change.
   *
   * componentShouldUpdate is not called on the first render.
   */
  componentShouldUpdate?(newVal: any, oldVal: any, propName: string): boolean | void;

  /**
   * The component is about to update and re-render.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentWillUpdate is not called on the first render.
   */
  componentWillUpdate?(): Promise<void> | void;

  /**
   * The component has just re-rendered.
   *
   * Called multiple times throughout the life of
   * the component as it updates.
   *
   * componentWillUpdate is not called on the
   * first render.
   */
  componentDidUpdate?(): void;

  render?(): any;

  [memberName: string]: any;
}

// General types important to applications using stencil built components
export interface EventEmitter<T = any> {
  emit: (data?: T) => CustomEvent<T>;
}

export interface RafCallback {
  (timeStamp: number): void;
}

export interface QueueApi {
  tick: (cb: RafCallback) => void;
  read: (cb: RafCallback) => void;
  write: (cb: RafCallback) => void;
  clear?: () => void;
  flush?: (cb?: () => void) => void;
}

/**
 * Host
 */
export interface HostAttributes {
  class?: string | { [className: string]: boolean };
  style?: { [key: string]: string | undefined };
  ref?: (el: HTMLElement | null) => void;

  [prop: string]: any;
}

/**
 * Utilities for working with functional Stencil components. An object
 * conforming to this interface is passed by the Stencil runtime as the third
 * argument to a functional component, allowing component authors to work with
 * features like children.
 *
 * The children of a functional component will be passed as the second
 * argument, so a functional component which uses these utils to transform its
 * children might look like the following:
 *
 * ```ts
 * export const AddClass: FunctionalComponent = (_, children, utils) => (
 *  utils.map(children, child => ({
 *    ...child,
 *    vattrs: {
 *      ...child.vattrs,
 *      class: `${child.vattrs.class} add-class`
 *    }
 *  }))
 * );
 * ```
 *
 * For more see the Stencil documentation, here:
 * https://stenciljs.com/docs/functional-components
 */
export interface FunctionalUtilities {
  /**
   * Utility for reading the children of a functional component at runtime.
   * Since the Stencil runtime uses a different interface for children it is
   * not recommended to read the children directly, and is preferable to use
   * this utility to, for instance, perform a side effect for each child.
   */
  forEach: (children: VNode[], cb: (vnode: ChildNode, index: number, array: ChildNode[]) => void) => void;
  /**
   * Utility for transforming the children of a functional component. Given an
   * array of children and a callback this will return a list of the results of
   * passing each child to the supplied callback.
   */
  map: (children: VNode[], cb: (vnode: ChildNode, index: number, array: ChildNode[]) => ChildNode) => VNode[];
}

export interface FunctionalComponent<T = {}> {
  (props: T, children: VNode[], utils: FunctionalUtilities): VNode | VNode[];
}

/**
 * A Child VDOM node
 *
 * This has most of the same properties as {@link VNode} but friendlier names
 * (i.e. `vtag` instead of `$tag$`, `vchildren` instead of `$children$`) in
 * order to provide a friendlier public interface for users of the
 * {@link FunctionalUtilities}).
 */
export interface ChildNode {
  vtag?: string | number | Function;
  vkey?: string | number;
  vtext?: string;
  vchildren?: VNode[];
  vattrs?: any;
  vname?: string;
}

/**
 * Host is a functional component can be used at the root of the render function
 * to set attributes and event listeners to the host element itself.
 *
 * For further information: https://stenciljs.com/docs/host-element
 */
export declare const Host: FunctionalComponent<HostAttributes>;

/**
 * Fragment
 */
export declare const Fragment: FunctionalComponent<{}>;

/* eslint-disable jsdoc/require-param, jsdoc/require-returns -- we don't want to JSDoc these overloads at this time */
/**
 * The "h" namespace is used to import JSX types for elements and attributes.
 * It is imported in order to avoid conflicting global JSX issues.
 */
export declare namespace h {
  export function h(sel: any): VNode;
  export function h(sel: Node, data: VNodeData | null): VNode;
  export function h(sel: any, data: VNodeData | null): VNode;
  export function h(sel: any, text: string): VNode;
  export function h(sel: any, children: Array<VNode | undefined | null>): VNode;
  export function h(sel: any, data: VNodeData | null, text: string): VNode;
  export function h(sel: any, data: VNodeData | null, children: Array<VNode | undefined | null>): VNode;
  export function h(sel: any, data: VNodeData | null, children: VNode): VNode;

  export namespace JSX {
    interface IntrinsicElements extends LocalJSX.IntrinsicElements, JSXBase.IntrinsicElements {
      [tagName: string]: any;
    }
  }
}

/* eslint-enable jsdoc/require-param, jsdoc/require-returns -- we don't want to JSDoc these overloads at this time */

export declare function h(sel: any): VNode;
export declare function h(sel: Node, data: VNodeData | null): VNode;
export declare function h(sel: any, data: VNodeData | null): VNode;
export declare function h(sel: any, text: string): VNode;
export declare function h(sel: any, children: Array<VNode | undefined | null>): VNode;
export declare function h(sel: any, data: VNodeData | null, text: string): VNode;
export declare function h(sel: any, data: VNodeData | null, children: Array<VNode | undefined | null>): VNode;
export declare function h(sel: any, data: VNodeData | null, children: VNode): VNode;

/**
 * A virtual DOM node
 */
export interface VNode {
  $flags$: number;
  $tag$: string | number | Function;
  $elm$: any;
  $text$: string;
  $children$: VNode[];
  $attrs$?: any;
  $name$?: string;
  $key$?: string | number;
}

export interface VNodeData {
  class?: { [className: string]: boolean };
  style?: any;
  [attrName: string]: any;
}

declare namespace LocalJSX {
  export interface Element {}
  export interface IntrinsicElements {}
}

export { LocalJSX as JSX };

export namespace JSXBase {
  export interface IntrinsicElements {
    // Stencil elements
    slot: JSXBase.SlotAttributes;

    // HTML
    a: JSXBase.AnchorHTMLAttributes<HTMLAnchorElement>;
    abbr: JSXBase.HTMLAttributes;
    address: JSXBase.HTMLAttributes;
    area: JSXBase.AreaHTMLAttributes<HTMLAreaElement>;
    article: JSXBase.HTMLAttributes;
    aside: JSXBase.HTMLAttributes;
    audio: JSXBase.AudioHTMLAttributes<HTMLAudioElement>;
    b: JSXBase.HTMLAttributes;
    base: JSXBase.BaseHTMLAttributes<HTMLBaseElement>;
    bdi: JSXBase.HTMLAttributes;
    bdo: JSXBase.HTMLAttributes;
    big: JSXBase.HTMLAttributes;
    blockquote: JSXBase.BlockquoteHTMLAttributes<HTMLQuoteElement>;
    body: JSXBase.HTMLAttributes<HTMLBodyElement>;
    br: JSXBase.HTMLAttributes<HTMLBRElement>;
    button: JSXBase.ButtonHTMLAttributes<HTMLButtonElement>;
    canvas: JSXBase.CanvasHTMLAttributes<HTMLCanvasElement>;
    caption: JSXBase.HTMLAttributes<HTMLTableCaptionElement>;
    cite: JSXBase.HTMLAttributes;
    code: JSXBase.HTMLAttributes;
    col: JSXBase.ColHTMLAttributes<HTMLTableColElement>;
    colgroup: JSXBase.ColgroupHTMLAttributes<HTMLTableColElement>;
    data: JSXBase.HTMLAttributes<HTMLDataElement>;
    datalist: JSXBase.HTMLAttributes<HTMLDataListElement>;
    dd: JSXBase.HTMLAttributes;
    del: JSXBase.DelHTMLAttributes<HTMLModElement>;
    details: JSXBase.DetailsHTMLAttributes<HTMLElement>;
    dfn: JSXBase.HTMLAttributes;
    dialog: JSXBase.DialogHTMLAttributes<HTMLDialogElement>;
    div: JSXBase.HTMLAttributes<HTMLDivElement>;
    dl: JSXBase.HTMLAttributes<HTMLDListElement>;
    dt: JSXBase.HTMLAttributes;
    em: JSXBase.HTMLAttributes;
    embed: JSXBase.EmbedHTMLAttributes<HTMLEmbedElement>;
    fieldset: JSXBase.FieldsetHTMLAttributes<HTMLFieldSetElement>;
    figcaption: JSXBase.HTMLAttributes;
    figure: JSXBase.HTMLAttributes;
    footer: JSXBase.HTMLAttributes;
    form: JSXBase.FormHTMLAttributes<HTMLFormElement>;
    h1: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h2: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h3: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h4: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h5: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    h6: JSXBase.HTMLAttributes<HTMLHeadingElement>;
    head: JSXBase.HTMLAttributes<HTMLHeadElement>;
    header: JSXBase.HTMLAttributes;
    hgroup: JSXBase.HTMLAttributes;
    hr: JSXBase.HTMLAttributes<HTMLHRElement>;
    html: JSXBase.HTMLAttributes<HTMLHtmlElement>;
    i: JSXBase.HTMLAttributes;
    iframe: JSXBase.IframeHTMLAttributes<HTMLIFrameElement>;
    img: JSXBase.ImgHTMLAttributes<HTMLImageElement>;
    input: JSXBase.InputHTMLAttributes<HTMLInputElement>;
    ins: JSXBase.InsHTMLAttributes<HTMLModElement>;
    kbd: JSXBase.HTMLAttributes;
    keygen: JSXBase.KeygenHTMLAttributes<HTMLElement>;
    label: JSXBase.LabelHTMLAttributes<HTMLLabelElement>;
    legend: JSXBase.HTMLAttributes<HTMLLegendElement>;
    li: JSXBase.LiHTMLAttributes<HTMLLIElement>;
    link: JSXBase.LinkHTMLAttributes<HTMLLinkElement>;
    main: JSXBase.HTMLAttributes;
    map: JSXBase.MapHTMLAttributes<HTMLMapElement>;
    mark: JSXBase.HTMLAttributes;
    menu: JSXBase.MenuHTMLAttributes<HTMLMenuElement>;
    menuitem: JSXBase.HTMLAttributes;
    meta: JSXBase.MetaHTMLAttributes<HTMLMetaElement>;
    meter: JSXBase.MeterHTMLAttributes<HTMLMeterElement>;
    nav: JSXBase.HTMLAttributes;
    noscript: JSXBase.HTMLAttributes;
    object: JSXBase.ObjectHTMLAttributes<HTMLObjectElement>;
    ol: JSXBase.OlHTMLAttributes<HTMLOListElement>;
    optgroup: JSXBase.OptgroupHTMLAttributes<HTMLOptGroupElement>;
    option: JSXBase.OptionHTMLAttributes<HTMLOptionElement>;
    output: JSXBase.OutputHTMLAttributes<HTMLOutputElement>;
    p: JSXBase.HTMLAttributes<HTMLParagraphElement>;
    param: JSXBase.ParamHTMLAttributes<HTMLParamElement>;
    picture: JSXBase.HTMLAttributes<HTMLPictureElement>;
    pre: JSXBase.HTMLAttributes<HTMLPreElement>;
    progress: JSXBase.ProgressHTMLAttributes<HTMLProgressElement>;
    q: JSXBase.QuoteHTMLAttributes<HTMLQuoteElement>;
    rp: JSXBase.HTMLAttributes;
    rt: JSXBase.HTMLAttributes;
    ruby: JSXBase.HTMLAttributes;
    s: JSXBase.HTMLAttributes;
    samp: JSXBase.HTMLAttributes;
    script: JSXBase.ScriptHTMLAttributes<HTMLScriptElement>;
    section: JSXBase.HTMLAttributes;
    select: JSXBase.SelectHTMLAttributes<HTMLSelectElement>;
    small: JSXBase.HTMLAttributes;
    source: JSXBase.SourceHTMLAttributes<HTMLSourceElement>;
    span: JSXBase.HTMLAttributes<HTMLSpanElement>;
    strong: JSXBase.HTMLAttributes;
    style: JSXBase.StyleHTMLAttributes<HTMLStyleElement>;
    sub: JSXBase.HTMLAttributes;
    summary: JSXBase.HTMLAttributes;
    sup: JSXBase.HTMLAttributes;
    table: JSXBase.TableHTMLAttributes<HTMLTableElement>;
    tbody: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    td: JSXBase.TdHTMLAttributes<HTMLTableDataCellElement>;
    textarea: JSXBase.TextareaHTMLAttributes<HTMLTextAreaElement>;
    tfoot: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    th: JSXBase.ThHTMLAttributes<HTMLTableHeaderCellElement>;
    thead: JSXBase.HTMLAttributes<HTMLTableSectionElement>;
    time: JSXBase.TimeHTMLAttributes<HTMLTimeElement>;
    title: JSXBase.HTMLAttributes<HTMLTitleElement>;
    tr: JSXBase.HTMLAttributes<HTMLTableRowElement>;
    track: JSXBase.TrackHTMLAttributes<HTMLTrackElement>;
    u: JSXBase.HTMLAttributes;
    ul: JSXBase.HTMLAttributes<HTMLUListElement>;
    var: JSXBase.HTMLAttributes;
    video: JSXBase.VideoHTMLAttributes<HTMLVideoElement>;
    wbr: JSXBase.HTMLAttributes;

    // SVG
    animate: JSXBase.SVGAttributes;
    circle: JSXBase.SVGAttributes;
    clipPath: JSXBase.SVGAttributes;
    defs: JSXBase.SVGAttributes;
    desc: JSXBase.SVGAttributes;
    ellipse: JSXBase.SVGAttributes;
    feBlend: JSXBase.SVGAttributes;
    feColorMatrix: JSXBase.SVGAttributes;
    feComponentTransfer: JSXBase.SVGAttributes;
    feComposite: JSXBase.SVGAttributes;
    feConvolveMatrix: JSXBase.SVGAttributes;
    feDiffuseLighting: JSXBase.SVGAttributes;
    feDisplacementMap: JSXBase.SVGAttributes;
    feDistantLight: JSXBase.SVGAttributes;
    feDropShadow: JSXBase.SVGAttributes;
    feFlood: JSXBase.SVGAttributes;
    feFuncA: JSXBase.SVGAttributes;
    feFuncB: JSXBase.SVGAttributes;
    feFuncG: JSXBase.SVGAttributes;
    feFuncR: JSXBase.SVGAttributes;
    feGaussianBlur: JSXBase.SVGAttributes;
    feImage: JSXBase.SVGAttributes;
    feMerge: JSXBase.SVGAttributes;
    feMergeNode: JSXBase.SVGAttributes;
    feMorphology: JSXBase.SVGAttributes;
    feOffset: JSXBase.SVGAttributes;
    fePointLight: JSXBase.SVGAttributes;
    feSpecularLighting: JSXBase.SVGAttributes;
    feSpotLight: JSXBase.SVGAttributes;
    feTile: JSXBase.SVGAttributes;
    feTurbulence: JSXBase.SVGAttributes;
    filter: JSXBase.SVGAttributes;
    foreignObject: JSXBase.SVGAttributes;
    g: JSXBase.SVGAttributes;
    image: JSXBase.SVGAttributes;
    line: JSXBase.SVGAttributes;
    linearGradient: JSXBase.SVGAttributes;
    marker: JSXBase.SVGAttributes;
    mask: JSXBase.SVGAttributes;
    metadata: JSXBase.SVGAttributes;
    path: JSXBase.SVGAttributes;
    pattern: JSXBase.SVGAttributes;
    polygon: JSXBase.SVGAttributes;
    polyline: JSXBase.SVGAttributes;
    radialGradient: JSXBase.SVGAttributes;
    rect: JSXBase.SVGAttributes;
    stop: JSXBase.SVGAttributes;
    svg: JSXBase.SVGAttributes;
    switch: JSXBase.SVGAttributes;
    symbol: JSXBase.SVGAttributes;
    text: JSXBase.SVGAttributes;
    textPath: JSXBase.SVGAttributes;
    tspan: JSXBase.SVGAttributes;
    use: JSXBase.SVGAttributes;
    view: JSXBase.SVGAttributes;
  }

  export interface SlotAttributes extends JSXAttributes {
    name?: string;
    slot?: string;
    onSlotchange?: (event: Event) => void;
  }

  export interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: any;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    media?: string;
    ping?: string;
    rel?: string;
    target?: string;
    referrerPolicy?: ReferrerPolicy;
  }

  export interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> {}

  export interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    coords?: string;
    download?: any;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    media?: string;
    rel?: string;
    shape?: string;
    target?: string;
  }

  export interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
    href?: string;
    target?: string;
  }

  export interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }

  export interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formaction?: string;
    formEncType?: string;
    formenctype?: string;
    formMethod?: string;
    formmethod?: string;
    formNoValidate?: boolean;
    formnovalidate?: boolean;
    formTarget?: string;
    formtarget?: string;
    name?: string;
    type?: string;
    value?: string | string[] | number;

    // popover
    popoverTargetAction?: string;
    popoverTargetElement?: Element | null;
    popoverTarget?: string;
  }

  export interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    width?: number | string;
  }

  export interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number;
  }

  export interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: number;
  }

  export interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: boolean;
    name?: string;
    onToggle?: (event: ToggleEvent) => void;
  }

  export interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
    dateTime?: string;
    datetime?: string;
  }

  export interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
    onCancel?: (event: Event) => void;
    onClose?: (event: Event) => void;
    open?: boolean;
    returnValue?: string;
  }

  export interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number | string;
    src?: string;
    type?: string;
    width?: number | string;
  }

  export interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    name?: string;
  }

  export interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    acceptCharset?: string;
    acceptcharset?: string;
    action?: string;
    autoComplete?: string;
    autocomplete?: string;
    encType?: string;
    enctype?: string;
    method?: string;
    name?: string;
    noValidate?: boolean;
    novalidate?: boolean | string;
    target?: string;
  }

  export interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
    manifest?: string;
  }

  export interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allow?: string;
    allowFullScreen?: boolean;
    allowfullScreen?: string | boolean;
    allowTransparency?: boolean;
    allowtransparency?: string | boolean;
    frameBorder?: number | string;
    frameborder?: number | string;
    importance?: 'low' | 'auto' | 'high';
    height?: number | string;
    loading?: 'lazy' | 'auto' | 'eager';
    marginHeight?: number;
    marginheight?: string | number;
    marginWidth?: number;
    marginwidth?: string | number;
    name?: string;
    referrerPolicy?: ReferrerPolicy;
    sandbox?: string;
    scrolling?: string;
    seamless?: boolean;
    src?: string;
    srcDoc?: string;
    srcdoc?: string;
    width?: number | string;
  }

  export interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: string;
    crossOrigin?: string;
    crossorigin?: string;
    decoding?: 'async' | 'auto' | 'sync';
    importance?: 'low' | 'auto' | 'high';
    height?: number | string;
    loading?: 'lazy' | 'auto' | 'eager';
    sizes?: string;
    src?: string;
    srcSet?: string;
    srcset?: string;
    useMap?: string;
    usemap?: string;
    width?: number | string;
  }

  export interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
    dateTime?: string;
    datetime?: string;
  }

  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    allowdirs?: boolean;
    alt?: string;
    autoCapitalize?: string;
    autocapitalize?: string;
    autoComplete?: string;
    autocomplete?: string;
    capture?: string; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
    checked?: boolean;
    crossOrigin?: string;
    crossorigin?: string;
    defaultChecked?: boolean;
    defaultValue?: string;
    dirName?: string;
    disabled?: boolean;
    files?: any;
    form?: string;
    formAction?: string;
    formaction?: string;
    formEncType?: string;
    formenctype?: string;
    formMethod?: string;
    formmethod?: string;
    formNoValidate?: boolean;
    formnovalidate?: boolean;
    formTarget?: string;
    formtarget?: string;
    height?: number | string;
    indeterminate?: boolean;
    list?: string;
    max?: number | string;
    maxLength?: number;
    maxlength?: number | string;
    min?: number | string;
    minLength?: number;
    minlength?: number | string;
    multiple?: boolean;
    name?: string;
    onSelect?: (event: Event) => void;
    onselect?: (event: Event) => void;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    readonly?: boolean | string;
    required?: boolean;
    selectionStart?: number | string;
    selectionEnd?: number | string;
    selectionDirection?: string;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | string[] | number;
    valueAsDate?: any;
    valueAsNumber?: any;
    webkitdirectory?: boolean;
    webkitEntries?: any;
    width?: number | string;

    // popover
    popoverTargetAction?: string;
    popoverTargetElement?: Element | null;
    popoverTarget?: string;
  }

  export interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
    challenge?: string;
    disabled?: boolean;
    form?: string;
    keyType?: string;
    keytype?: string;
    keyParams?: string;
    keyparams?: string;
    name?: string;
  }

  export interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    htmlFor?: string;
  }

  export interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: string | string[] | number;
  }

  export interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    as?: string;
    href?: string;
    hrefLang?: string;
    hreflang?: string;
    importance?: 'low' | 'auto' | 'high';
    integrity?: string;
    media?: string;
    rel?: string;
    sizes?: string;
    type?: string;
  }

  export interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
  }

  export interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: string;
  }

  export interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoPlay?: boolean;
    autoplay?: boolean | string;
    controls?: boolean;
    controlslist?: 'nodownload' | 'nofullscreen' | 'noremoteplayback';
    controlsList?: 'nodownload' | 'nofullscreen' | 'noremoteplayback';
    crossOrigin?: string;
    crossorigin?: string;
    loop?: boolean;
    mediaGroup?: string;
    mediagroup?: string;
    muted?: boolean;
    preload?: string;
    src?: string;

    // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
    onAbort?: (event: Event) => void;
    onCanPlay?: (event: Event) => void;
    onCanPlayThrough?: (event: Event) => void;
    onDurationChange?: (event: Event) => void;
    onEmptied?: (event: Event) => void;
    onEnded?: (event: Event) => void;
    onError?: (event: Event) => void;
    onInterruptBegin?: (event: Event) => void;
    onInterruptEnd?: (event: Event) => void;
    onLoadedData?: (event: Event) => void;
    onLoadedMetaData?: (event: Event) => void;
    onLoadStart?: (event: Event) => void;
    onMozAudioAvailable?: (event: Event) => void;
    onPause?: (event: Event) => void;
    onPlay?: (event: Event) => void;
    onPlaying?: (event: Event) => void;
    onProgress?: (event: Event) => void;
    onRateChange?: (event: Event) => void;
    onSeeked?: (event: Event) => void;
    onSeeking?: (event: Event) => void;
    onStalled?: (event: Event) => void;
    onSuspend?: (event: Event) => void;
    onTimeUpdate?: (event: Event) => void;
    onVolumeChange?: (event: Event) => void;
    onWaiting?: (event: Event) => void;
  }

  export interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
    charSet?: string;
    charset?: string;
    content?: string;
    httpEquiv?: string;
    httpequiv?: string;
    name?: string;
  }

  export interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    high?: number;
    low?: number;
    max?: number | string;
    min?: number | string;
    optimum?: number;
    value?: string | string[] | number;
  }

  export interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: string;
  }

  export interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
    classID?: string;
    classid?: string;
    data?: string;
    form?: string;
    height?: number | string;
    name?: string;
    type?: string;
    useMap?: string;
    usemap?: string;
    width?: number | string;
    wmode?: string;
  }

  export interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    reversed?: boolean;
    start?: number;
  }

  export interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
  }

  export interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    label?: string;
    selected?: boolean;
    value?: string | string[] | number;
  }

  export interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: string;
    htmlFor?: string;
    name?: string;
  }

  export interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: string;
    value?: string | string[] | number;
  }

  export interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
    max?: number | string;
    value?: string | string[] | number;
  }

  export interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
    async?: boolean;
    charSet?: string;
    charset?: string;
    crossOrigin?: string;
    crossorigin?: string;
    defer?: boolean;
    importance?: 'low' | 'auto' | 'high';
    integrity?: string;
    nonce?: string;
    src?: string;
    type?: string;
  }

  export interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    multiple?: boolean;
    name?: string;
    required?: boolean;
    size?: number;
    autoComplete?: string;
    autocomplete?: string;
  }

  export interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: number;
    media?: string;
    sizes?: string;
    src?: string;
    srcSet?: string;
    type?: string;
    width?: number;
  }

  export interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: string;
    nonce?: string;
    scoped?: boolean;
    type?: string;
  }

  export interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
    cellPadding?: number | string;
    cellpadding?: number | string;
    cellSpacing?: number | string;
    cellspacing?: number | string;
    summary?: string;
  }

  export interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoComplete?: string;
    autocomplete?: string;
    cols?: number;
    disabled?: boolean;
    form?: string;
    maxLength?: number;
    maxlength?: number | string;
    minLength?: number;
    minlength?: number | string;
    name?: string;
    onSelect?: (event: Event) => void;
    onselect?: (event: Event) => void;
    placeholder?: string;
    readOnly?: boolean;
    readonly?: boolean | string;
    required?: boolean;
    rows?: number;
    value?: string | string[] | number;
    wrap?: string;
  }

  export interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
  }

  export interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    abbr?: string;
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
    rowspan?: number | string;
    scope?: string;
  }

  export interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
    dateTime?: string;
  }

  export interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    default?: boolean;
    kind?: string;
    label?: string;
    src?: string;
    srcLang?: string;
    srclang?: string;
  }

  export interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: number | string;
    playsInline?: boolean;
    playsinline?: boolean | string;
    poster?: string;
    width?: number | string;
  }

  export interface HTMLAttributes<T = HTMLElement> extends DOMAttributes<T> {
    // vdom specific
    innerHTML?: string;

    // Standard HTML Attributes
    accessKey?: string;
    autoFocus?: boolean;
    autofocus?: boolean | string;
    class?: string | { [className: string]: boolean };
    contentEditable?: boolean | string;
    contenteditable?: boolean | string;
    contextMenu?: string;
    contextmenu?: string;
    dir?: string;
    draggable?: boolean;
    hidden?: boolean;
    id?: string;
    inert?: boolean;
    lang?: string;
    spellcheck?: 'true' | 'false' | any;
    style?: { [key: string]: string | undefined };
    tabIndex?: number;
    tabindex?: number | string;
    title?: string;
    // These types don't allow you to use popover as a boolean attribute
    // so you can't write HTML like `<div popover>` and get the default value.
    // Developer must explicitly specify one of the valid popover values or it will fallback
    // to `manual` (following the HTML spec).
    popover?: string | null;

    // Unknown
    inputMode?: string;
    inputmode?: string;
    enterKeyHint?: string;
    enterkeyhint?: string;
    is?: string;
    radioGroup?: string; // <command>, <menuitem>
    radiogroup?: string;

    // WAI-ARIA
    role?: string;

    // RDFa Attributes
    about?: string;
    datatype?: string;
    inlist?: any;
    prefix?: string;
    property?: string;
    resource?: string;
    typeof?: string;
    vocab?: string;

    // Non-standard Attributes
    autoCapitalize?: string;
    autocapitalize?: string;
    autoCorrect?: string;
    autocorrect?: string;
    autoSave?: string;
    autosave?: string;
    color?: string;
    itemProp?: string;
    itemprop?: string;
    itemScope?: boolean;
    itemscope?: boolean;
    itemType?: string;
    itemtype?: string;
    itemID?: string;
    itemid?: string;
    itemRef?: string;
    itemref?: string;
    results?: number;
    security?: string;
    unselectable?: boolean;
  }

  export interface SVGAttributes<T = SVGElement> extends DOMAttributes<T> {
    // Attributes which also defined in HTMLAttributes
    class?: string | { [className: string]: boolean };
    color?: string;
    height?: number | string;
    id?: string;
    lang?: string;
    max?: number | string;
    media?: string;
    method?: string;
    min?: number | string;
    name?: string;
    style?: { [key: string]: string | undefined };
    target?: string;
    type?: string;
    width?: number | string;

    // Other HTML properties supported by SVG elements in browsers
    role?: string;
    tabindex?: number;

    // SVG Specific attributes
    'accent-height'?: number | string;
    accumulate?: 'none' | 'sum';
    additive?: 'replace' | 'sum';
    'alignment-baseline'?:
      | 'auto'
      | 'baseline'
      | 'before-edge'
      | 'text-before-edge'
      | 'middle'
      | 'central'
      | 'after-edge'
      | 'text-after-edge'
      | 'ideographic'
      | 'alphabetic'
      | 'hanging'
      | 'mathematical'
      | 'inherit';
    allowReorder?: 'no' | 'yes';
    alphabetic?: number | string;
    amplitude?: number | string;
    'arabic-form'?: 'initial' | 'medial' | 'terminal' | 'isolated';
    ascent?: number | string;
    attributeName?: string;
    attributeType?: string;
    autoReverse?: number | string;
    azimuth?: number | string;
    baseFrequency?: number | string;
    'baseline-shift'?: number | string;
    baseProfile?: number | string;
    bbox?: number | string;
    begin?: number | string;
    bias?: number | string;
    by?: number | string;
    calcMode?: number | string;
    'cap-height'?: number | string;
    clip?: number | string;
    'clip-path'?: string;
    clipPathUnits?: number | string;
    'clip-rule'?: number | string;
    'color-interpolation'?: number | string;
    'color-interpolation-filters'?: 'auto' | 'sRGB' | 'linearRGB';
    'color-profile'?: number | string;
    'color-rendering'?: number | string;
    contentScriptType?: number | string;
    contentStyleType?: number | string;
    cursor?: number | string;
    cx?: number | string;
    cy?: number | string;
    d?: string;
    decelerate?: number | string;
    descent?: number | string;
    diffuseConstant?: number | string;
    direction?: number | string;
    display?: number | string;
    divisor?: number | string;
    'dominant-baseline'?: number | string;
    dur?: number | string;
    dx?: number | string;
    dy?: number | string;
    'edge-mode'?: number | string;
    elevation?: number | string;
    'enable-background'?: number | string;
    end?: number | string;
    exponent?: number | string;
    externalResourcesRequired?: number | string;
    fill?: string;
    'fill-opacity'?: number | string;
    'fill-rule'?: 'nonzero' | 'evenodd' | 'inherit';
    filter?: string;
    filterRes?: number | string;
    filterUnits?: number | string;
    'flood-color'?: number | string;
    'flood-opacity'?: number | string;
    focusable?: number | string;
    'font-family'?: string;
    'font-size'?: number | string;
    'font-size-adjust'?: number | string;
    'font-stretch'?: number | string;
    'font-style'?: number | string;
    'font-variant'?: number | string;
    'font-weight'?: number | string;
    format?: number | string;
    from?: number | string;
    fx?: number | string;
    fy?: number | string;
    g1?: number | string;
    g2?: number | string;
    'glyph-name'?: number | string;
    'glyph-orientation-horizontal'?: number | string;
    'glyph-orientation-vertical'?: number | string;
    glyphRef?: number | string;
    gradientTransform?: string;
    gradientUnits?: string;
    hanging?: number | string;
    'horiz-adv-x'?: number | string;
    'horiz-origin-x'?: number | string;
    href?: string;
    ideographic?: number | string;
    'image-rendering'?: number | string;
    in2?: number | string;
    in?: string;
    intercept?: number | string;
    k1?: number | string;
    k2?: number | string;
    k3?: number | string;
    k4?: number | string;
    k?: number | string;
    kernelMatrix?: number | string;
    kernelUnitLength?: number | string;
    kerning?: number | string;
    keyPoints?: number | string;
    keySplines?: number | string;
    keyTimes?: number | string;
    lengthAdjust?: number | string;
    'letter-spacing'?: number | string;
    'lighting-color'?: number | string;
    limitingConeAngle?: number | string;
    local?: number | string;
    'marker-end'?: string;
    markerHeight?: number | string;
    'marker-mid'?: string;
    'marker-start'?: string;
    markerUnits?: number | string;
    markerWidth?: number | string;
    mask?: string;
    maskContentUnits?: number | string;
    maskUnits?: number | string;
    mathematical?: number | string;
    mode?: number | string;
    numOctaves?: number | string;
    offset?: number | string;
    opacity?: number | string;
    operator?: number | string;
    order?: number | string;
    orient?: number | string;
    orientation?: number | string;
    origin?: number | string;
    overflow?: number | string;
    'overline-position'?: number | string;
    'overline-thickness'?: number | string;
    'paint-order'?: number | string;
    panose1?: number | string;
    pathLength?: number | string;
    patternContentUnits?: string;
    patternTransform?: number | string;
    patternUnits?: string;
    'pointer-events'?: number | string;
    points?: string;
    pointsAtX?: number | string;
    pointsAtY?: number | string;
    pointsAtZ?: number | string;
    preserveAlpha?: number | string;
    preserveAspectRatio?: string;
    primitiveUnits?: number | string;
    r?: number | string;
    radius?: number | string;
    refX?: number | string;
    refY?: number | string;
    'rendering-intent'?: number | string;
    repeatCount?: number | string;
    repeatDur?: number | string;
    requiredextensions?: number | string;
    requiredFeatures?: number | string;
    restart?: number | string;
    result?: string;
    rotate?: number | string;
    rx?: number | string;
    ry?: number | string;
    scale?: number | string;
    seed?: number | string;
    'shape-rendering'?: number | string;
    slope?: number | string;
    spacing?: number | string;
    specularConstant?: number | string;
    specularExponent?: number | string;
    speed?: number | string;
    spreadMethod?: string;
    startOffset?: number | string;
    stdDeviation?: number | string;
    stemh?: number | string;
    stemv?: number | string;
    stitchTiles?: number | string;
    'stop-color'?: string;
    'stop-opacity'?: number | string;
    'strikethrough-position'?: number | string;
    'strikethrough-thickness'?: number | string;
    string?: number | string;
    stroke?: string;
    'stroke-dasharray'?: string | number;
    'stroke-dashoffset'?: string | number;
    'stroke-linecap'?: 'butt' | 'round' | 'square' | 'inherit';
    'stroke-linejoin'?: 'miter' | 'round' | 'bevel' | 'inherit';
    'stroke-miterlimit'?: string;
    'stroke-opacity'?: number | string;
    'stroke-width'?: number | string;
    surfaceScale?: number | string;
    systemLanguage?: number | string;
    tableValues?: number | string;
    targetX?: number | string;
    targetY?: number | string;
    'text-anchor'?: string;
    'text-decoration'?: number | string;
    textLength?: number | string;
    'text-rendering'?: number | string;
    to?: number | string;
    transform?: string;
    u1?: number | string;
    u2?: number | string;
    'underline-position'?: number | string;
    'underline-thickness'?: number | string;
    unicode?: number | string;
    'unicode-bidi'?: number | string;
    'unicode-range'?: number | string;
    'units-per-em'?: number | string;
    'v-alphabetic'?: number | string;
    values?: string;
    'vector-effect'?: number | string;
    version?: string;
    'vert-adv-y'?: number | string;
    'vert-origin-x'?: number | string;
    'vert-origin-y'?: number | string;
    'v-hanging'?: number | string;
    'v-ideographic'?: number | string;
    viewBox?: string;
    viewTarget?: number | string;
    visibility?: number | string;
    'v-mathematical'?: number | string;
    widths?: number | string;
    'word-spacing'?: number | string;
    'writing-mode'?: number | string;
    x1?: number | string;
    x2?: number | string;
    x?: number | string;
    'x-channel-selector'?: string;
    'x-height'?: number | string;
    xlinkActuate?: string;
    xlinkArcrole?: string;
    xlinkHref?: string;
    xlinkRole?: string;
    xlinkShow?: string;
    xlinkTitle?: string;
    xlinkType?: string;
    xmlBase?: string;
    xmlLang?: string;
    xmlns?: string;
    xmlSpace?: string;
    y1?: number | string;
    y2?: number | string;
    y?: number | string;
    yChannelSelector?: string;
    z?: number | string;
    zoomAndPan?: string;
  }

  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent) */
  export interface ToggleEvent extends Event {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent/newState) */
    readonly newState: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/ToggleEvent/oldState) */
    readonly oldState: string;
  }

  export interface DOMAttributes<T> extends JSXAttributes<T> {
    slot?: string;
    part?: string;
    exportparts?: string;

    // Clipboard Events
    onCopy?: (event: ClipboardEvent) => void;
    onCopyCapture?: (event: ClipboardEvent) => void;
    onCut?: (event: ClipboardEvent) => void;
    onCutCapture?: (event: ClipboardEvent) => void;
    onPaste?: (event: ClipboardEvent) => void;
    onPasteCapture?: (event: ClipboardEvent) => void;

    // Composition Events
    onCompositionend?: (event: CompositionEvent) => void;
    onCompositionendCapture?: (event: CompositionEvent) => void;
    onCompositionstart?: (event: CompositionEvent) => void;
    onCompositionstartCapture?: (event: CompositionEvent) => void;
    onCompositionupdate?: (event: CompositionEvent) => void;
    onCompositionupdateCapture?: (event: CompositionEvent) => void;

    // Disclosure Events
    onBeforeToggle?: (event: ToggleEvent) => void;
    onBeforeToggleCapture?: (event: ToggleEvent) => void;
    onToggle?: (event: ToggleEvent) => void;
    onToggleCapture?: (event: ToggleEvent) => void;

    // Focus Events
    onFocus?: (event: FocusEvent) => void;
    onFocusCapture?: (event: FocusEvent) => void;
    onFocusin?: (event: FocusEvent) => void;
    onFocusinCapture?: (event: FocusEvent) => void;
    onFocusout?: (event: FocusEvent) => void;
    onFocusoutCapture?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onBlurCapture?: (event: FocusEvent) => void;

    // Form Events
    onChange?: (event: Event) => void;
    onChangeCapture?: (event: Event) => void;
    onInput?: (event: InputEvent) => void;
    onInputCapture?: (event: InputEvent) => void;
    onReset?: (event: Event) => void;
    onResetCapture?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    onSubmitCapture?: (event: Event) => void;
    onInvalid?: (event: Event) => void;
    onInvalidCapture?: (event: Event) => void;

    // Image Events
    onLoad?: (event: Event) => void;
    onLoadCapture?: (event: Event) => void;
    onError?: (event: Event) => void; // also a Media Event
    onErrorCapture?: (event: Event) => void; // also a Media Event

    // Keyboard Events
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyDownCapture?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
    onKeyPressCapture?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onKeyUpCapture?: (event: KeyboardEvent) => void;

    // MouseEvents
    onAuxClick?: (event: MouseEvent) => void;
    onClick?: (event: PointerEvent) => void;
    onClickCapture?: (event: MouseEvent) => void;
    onContextMenu?: (event: MouseEvent) => void;
    onContextMenuCapture?: (event: MouseEvent) => void;
    onDblClick?: (event: MouseEvent) => void;
    onDblClickCapture?: (event: MouseEvent) => void;
    onDrag?: (event: DragEvent) => void;
    onDragCapture?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
    onDragEndCapture?: (event: DragEvent) => void;
    onDragEnter?: (event: DragEvent) => void;
    onDragEnterCapture?: (event: DragEvent) => void;
    onDragExit?: (event: DragEvent) => void;
    onDragExitCapture?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDragLeaveCapture?: (event: DragEvent) => void;
    onDragOver?: (event: DragEvent) => void;
    onDragOverCapture?: (event: DragEvent) => void;
    onDragStart?: (event: DragEvent) => void;
    onDragStartCapture?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
    onDropCapture?: (event: DragEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseDownCapture?: (event: MouseEvent) => void;
    onMouseEnter?: (event: MouseEvent) => void;
    onMouseLeave?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onMouseMoveCapture?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    onMouseOutCapture?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseOverCapture?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseUpCapture?: (event: MouseEvent) => void;

    // Touch Events
    onTouchCancel?: (event: TouchEvent) => void;
    onTouchCancelCapture?: (event: TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onTouchEndCapture?: (event: TouchEvent) => void;
    onTouchMove?: (event: TouchEvent) => void;
    onTouchMoveCapture?: (event: TouchEvent) => void;
    onTouchStart?: (event: TouchEvent) => void;
    onTouchStartCapture?: (event: TouchEvent) => void;

    // Pointer Events
    onPointerDown?: (event: PointerEvent) => void;
    onPointerDownCapture?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
    onPointerMoveCapture?: (event: PointerEvent) => void;
    onPointerUp?: (event: PointerEvent) => void;
    onPointerUpCapture?: (event: PointerEvent) => void;
    onPointerCancel?: (event: PointerEvent) => void;
    onPointerCancelCapture?: (event: PointerEvent) => void;
    onPointerEnter?: (event: PointerEvent) => void;
    onPointerEnterCapture?: (event: PointerEvent) => void;
    onPointerLeave?: (event: PointerEvent) => void;
    onPointerLeaveCapture?: (event: PointerEvent) => void;
    onPointerOver?: (event: PointerEvent) => void;
    onPointerOverCapture?: (event: PointerEvent) => void;
    onPointerOut?: (event: PointerEvent) => void;
    onPointerOutCapture?: (event: PointerEvent) => void;
    onGotPointerCapture?: (event: PointerEvent) => void;
    onGotPointerCaptureCapture?: (event: PointerEvent) => void;
    onLostPointerCapture?: (event: PointerEvent) => void;
    onLostPointerCaptureCapture?: (event: PointerEvent) => void;

    // UI Events
    onScroll?: (event: UIEvent) => void;
    onScrollCapture?: (event: UIEvent) => void;

    // Wheel Events
    onWheel?: (event: WheelEvent) => void;
    onWheelCapture?: (event: WheelEvent) => void;

    // Animation Events
    onAnimationStart?: (event: AnimationEvent) => void;
    onAnimationStartCapture?: (event: AnimationEvent) => void;
    onAnimationEnd?: (event: AnimationEvent) => void;
    onAnimationEndCapture?: (event: AnimationEvent) => void;
    onAnimationIteration?: (event: AnimationEvent) => void;
    onAnimationIterationCapture?: (event: AnimationEvent) => void;

    // Transition Events
    onTransitionCancel?: (event: TransitionEvent) => void;
    onTransitionCancelCapture?: (event: TransitionEvent) => void;
    onTransitionEnd?: (event: TransitionEvent) => void;
    onTransitionEndCapture?: (event: TransitionEvent) => void;
    onTransitionRun?: (event: TransitionEvent) => void;
    onTransitionRunCapture?: (event: TransitionEvent) => void;
    onTransitionStart?: (event: TransitionEvent) => void;
    onTransitionStartCapture?: (event: TransitionEvent) => void;

    // WAI-ARIA Attributes
    [key: `aria-${string}`]: string | boolean | undefined;
    [key: `aria${string}`]: string | boolean | undefined;
  }
}

export interface JSXAttributes<T = Element> {
  // vdom specific
  key?: string | number;
  ref?: (elm?: T) => void;
}

export interface CustomElementsDefineOptions {
  exclude?: string[];
  resourcesUrl?: string;
  syncQueue?: boolean;
  transformTagName?: (tagName: string) => string;
  jmp?: (c: Function) => any;
  raf?: (c: FrameRequestCallback) => number;
  ael?: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  rel?: (
    el: EventTarget,
    eventName: string,
    listener: EventListenerOrEventListenerObject,
    options: boolean | AddEventListenerOptions,
  ) => void;
  ce?: (eventName: string, opts?: any) => CustomEvent;
}
