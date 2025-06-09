import type { EventInitDict, EventSpy, ScreenshotDiff, ScreenshotOptions } from '@stencil/core/internal';
import type {
  ClickOptions,
  HTTPResponse,
  Page,
  ScreenshotOptions as PuppeteerScreenshotOptions,
  WaitForOptions,
} from 'puppeteer';

/**
 * This type was once exported by Puppeteer, but has since moved to an object literal in (Puppeteer’s) native types.
 * Re-create it here as a named type to use across multiple Stencil-related testing files.
 */
export type PageCloseOptions = {
  runBeforeUnload?: boolean;
};

export interface NewE2EPageOptions extends WaitForOptions {
  url?: string;
  html?: string;
  /**
   * If set to `true`, Stencil will throw an error if a console error occurs
   */
  failOnConsoleError?: boolean;
  /**
   * If set to `true`, Stencil will throw an error if a network request fails
   */
  failOnNetworkError?: boolean;
  /**
   * If set to `true`, Stencil will log failing network requests
   * @default true
   */
  logFailingNetworkRequests?: boolean;
}

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type PuppeteerPage = Omit<
  Page,
  | 'bringToFront'
  | 'browser'
  | 'screenshot'
  | 'emulate'
  | 'emulateMedia'
  | 'frames'
  | 'goBack'
  | 'goForward'
  | 'isClosed'
  | 'mainFrame'
  | 'pdf'
  | 'reload'
  | 'target'
  | 'title'
  | 'viewport'
  | 'waitForNavigation'
  | 'screenshot'
  | 'workers'
  | 'addListener'
  | 'prependListener'
  | 'prependOnceListener'
  | 'removeAllListeners'
  | 'setMaxListeners'
  | 'getMaxListeners'
  | 'listeners'
  | 'rawListeners'
  | 'emit'
  | 'eventNames'
  | 'listenerCount'
  | '$x'
  | 'waitForXPath'
>;

export interface PageDiagnostic {
  type: 'error' | 'pageerror' | 'requestfailed';
  message?: string;
  location?: string;
}

/**
 * The E2EPage is a wrapper utility to Puppeteer in order to
 * to create easier to write and read end-to-end tests.
 */
export interface E2EPage extends PuppeteerPage {
  /**
   * `Experimental`
   * Takes a screenshot of the page, then compares the current screenshot
   * against the master screenshot. The returned screenshot compare
   * results can then be used to test pixel mismatches, such as
   * `expect(results).toMatchScreenshot()`.
   */
  compareScreenshot(): Promise<ScreenshotDiff>;

  /**
   * `Experimental`
   * Takes a screenshot of the page, then compares the current screenshot
   * against the master screenshot. The provided `description` will be
   * added onto its current description, which comes from the test description.
   */
  compareScreenshot(description: string): Promise<ScreenshotDiff>;

  /**
   * `Experimental`
   * Takes a screenshot of the page, then compares the current screenshot
   * against the master screenshot. The `opts` argument can be used to
   * customize screenshot options.
   */
  compareScreenshot(opts: ScreenshotOptions): Promise<ScreenshotDiff>;

  /**
   * `Experimental`
   * Takes a screenshot of the page, then compares the current screenshot
   * against the master screenshot. The `description` argument will be
   * added onto its current description, which comes from the test description.
   * The `opts` argument can be used to customize screenshot options.
   */
  compareScreenshot(description: string, opts: ScreenshotOptions): Promise<ScreenshotDiff>;

  /**
   * Sets a debugger;
   */
  debugger(): Promise<void>;

  /**
   * Find an element that matches the selector, which is the same as
   * `document.querySelector(selector)`. Use `>>>` within the
   * selector to find an element within the host element's shadow root.
   * For example, to select the first `div` inside of the component
   * `my-cmp`, the call would be `page.find('my-cmp >>> div')`.
   * Returns `null` if an element was not found.
   */
  find(selector: FindSelector): Promise<E2EElement>;

  /**
   * Find all elements that match the selector, which is the same as
   * `document.querySelectorAll(selector)`. Use `>>>` within the
   * selector to find elements within the host element's shadow root.
   * For example, to select all of the `li` elements inside of the component
   * `my-cmp`, the call would be `page.findAll('my-cmp >>> li')`.
   * Returns an empty array if no elements were found.
   */
  findAll(selector: string): Promise<E2EElement[]>;

  /**
   * During an end-to-end test, a dev-server is started so `page.goto(url)` can be used
   * on the app being tested. Urls are always relative since the dev server provides
   * a localhost address. A shortcut to `page.goto(url)` is to set the `url` option
   * when creating a new page, such as `const page = await newE2EPage({ url })`.
   */
  goTo(url: string, options?: WaitForOptions): Promise<HTTPResponse | null>;

  /**
   * Instead of testing a url directly, html content can be mocked using
   * `page.setContent(html)`. A shortcut to `page.setContent(html)` is to set
   * the `html` option when creating a new page, such as
   * `const page = await newE2EPage({ html })`.
   */
  setContent(html: string, options?: WaitForOptions): Promise<void>;

  /**
   * Used to test if an event was, or was not dispatched. This method
   * returns a promise, that resolves with an EventSpy. The EventSpy
   * can be used along with `expect(spy).toHaveReceivedEvent()`,
   * `expect(spy).toHaveReceivedEventTimes(x)` and
   * `expect(spy).toHaveReceivedEventDetail({...})`.
   */
  spyOnEvent(eventName: string, selector?: 'window' | 'document'): Promise<EventSpy>;

  /**
   * Both Stencil and Puppeteer have an asynchronous architecture, which is a good thing
   * for performance. Since all calls are async, it's required that
   * `await page.waitForChanges()` is called when changes are made to components.
   * An error will be thrown if changes were made to a component but `waitForChanges()`
   * was not called.
   */
  waitForChanges(): Promise<void>;

  /**
   * Waits for the event to be received on `window`. The optional second argument
   * allows the listener to be set to `document` if needed.
   */
  waitForEvent(eventName: string): Promise<any>;

  getDiagnostics(): PageDiagnostic[];
}

export interface E2EPageInternal extends E2EPage {
  isClosed(): boolean;
  _e2eElements: E2EElementInternal[];
  _e2eEvents: Map<number, WaitForEvent>;
  _e2eEventIds: number;
  _e2eGoto(url: string, options?: Partial<WaitForOptions>): Promise<HTTPResponse | null>;
  _e2eClose(options?: PageCloseOptions): Promise<void>;
  screenshot(options?: PuppeteerScreenshotOptions): Promise<Buffer>;
}

export interface E2EElement {
  /**
   * Used to call a method on a component. For example, if a component
   * has the method `cmp.myMethod(arg1, arg2)`, calling this method
   * from a e2e test could be `cmp.callMethod('myMethod', arg1, arg2)`.
   */
  callMethod(methodName: string, ...methodArgs: any[]): Promise<any>;

  /**
   * Gets and sets the value of the class attribute of the e2e element.
   * Note that `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  className: string;

  /**
   * Using classList is a convenient alternative to accessing an element's list
   * of classes as a space-delimited string via `element.className`.
   */
  classList: {
    /**
     * Add specified class values. If these classes already exist in
     * attribute of the element, then they are ignored.
     */
    add: (...tokens: string[]) => void;

    /**
     * Remove specified class values. Note: Removing a class that does
     * not exist does NOT throw an error.
     */
    remove: (...tokens: string[]) => void;

    /**
     * If class exists then remove it, if not, then add it.
     */
    toggle: (token: string) => void;

    /**
     * Checks if specified class value exists in class attribute of the element.
     */
    contains: (className: string) => boolean;
  };

  /**
   * Calling `click()` on an element scrolls it into view if needed, and
   * then uses `page.mouse` to click in the center of the element.
   * Please see the puppeteer docs for more information.
   */
  click(options?: ClickOptions): Promise<void>;

  /**
   * Find a child element that matches the selector, which is the same as
   * `element.querySelector(selector)`. Use `>>>` within the
   * selector to find an element within a host element's shadow root.
   * For example, to select the first `div` inside of the component
   * `my-cmp`, which is a child of this element, the call would be
   * `element.find('my-cmp >>> div')`. Returns `null` if no
   * elements were found.
   */
  find(selector: FindSelector): Promise<E2EElement>;

  /**
   * Find all child elements that match the selector, which is the same as
   * `element.querySelectorAll(selector)`. Use `>>>` within the
   * selector to find elements within a host element's shadow root.
   * For example, to select all `li` elements inside of the component
   * `my-cmp`, which is a child of this element, the call would be
   * `element.findAll('my-cmp >>> li')`. Returns an empty array if
   * no elements were found.
   */
  findAll(selector: FindSelector): Promise<E2EElement[]>;

  /**
   * Sets focus on the element.
   */
  focus(): Promise<void>;

  /**
   * Returns the value of a specified attribute on the element. If the
   * given attribute does not exist, the value returned will be null.
   */
  getAttribute(name: string): string;

  /**
   * Used to get a property set on a component. For example, if a
   * component has the property `elm.myProp`, then calling
   * `elm.getProperty('myProp')` would return the `myProp` property value.
   */
  getProperty(propertyName: string): Promise<any>;

  /**
   * Returns an object that reports the values of all CSS properties of this
   * element after applying active stylesheets and resolving any basic computation
   * those values may contain. Individual CSS property values are accessed by
   * simply indexing with CSS property names. The method is shortcut and an async
   * version of using `window.getComputedStyle(element)` directly.
   */
  getComputedStyle(pseudoElt?: string | null): Promise<CSSStyleDeclaration>;

  /**
   * Sets hover on the element.
   */
  hover(): Promise<void>;

  /**
   * Gets and sets `id` property of the element.
   * Note that `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  id: string;

  /**
   * Gets and sets `innerHTML` property of the element.
   * Note that `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  innerHTML: string;

  /**
   * Gets and sets `innerText` property of the element.
   * Note that `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  innerText: string;

  /**
   * Resolves to true if the element is visible in the current viewport.
   */
  isIntersectingViewport(): Promise<boolean>;

  /**
   * Resolves `true` when the element's style is `display !== 'none'`,
   * `visibility !== 'hidden'` and `opacity !== '0'`.
   */
  isVisible(): Promise<boolean>;

  /**
   * Node name of the node, which in an element's case is the tag name.
   * Note, this will always be upper-cased.
   */
  nodeName: string;

  /**
   * The type of a node represented by a number.
   * Element = 1, TextNode = 3, Comment = 8,
   * Document Fragment (also what a shadow root is) = 11.
   */
  nodeType: number;

  /**
   * Gets the element's `outerHTML. This is a read-only property and will
   * throw an error if set.
   */
  outerHTML: string;

  /**
   * Focuses the element, and then uses `keyboard.down` and `keyboard.up`.
   * If key is a single character and no modifier keys besides Shift are
   * being held down, a keypress/input event will also be generated. The
   * text option can be specified to force an input event to be generated.
   * Note: Modifier keys DO effect `elementHandle.press`. Holding down Shift
   * will type the text in upper case.
   * Key names: https://github.com/puppeteer/puppeteer/blob/main/src/common/USKeyboardLayout.ts
   */
  press(key: string, options?: { text?: string; delay?: number }): Promise<void>;

  /**
   * Removes the attribute on the specified element. Note that
   * `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  removeAttribute(name: string): void;

  /**
   * Sets the value of an attribute on the specified element. If the
   * attribute already exists, the value is updated; otherwise a new
   * attribute is added with the specified name and value. The value
   * will always be converted to a string. Note that
   * `await page.waitForChanges()` must be called before reading
   * the value if content has changed.
   */
  setAttribute(name: string, value: any): void;

  /**
   * Used to set a property set on a component. For example, if a
   * component has the property `elm.myProp`, then calling
   * `elm.setProperty('myProp', 88)` would set the value `88` to
   * the `myProp` property on the component.
   */
  setProperty(propertyName: string, value: any): void;

  /**
   * The ShadowRoot interface of the Shadow DOM API is the root node of a
   * DOM subtree that is rendered separately from a document's main DOM tree.
   * This value will be `null` if the element does not have a `shadowRoot`.
   */
  shadowRoot: ShadowRoot;

  /**
   * Used to test if an event was, or was not dispatched. This method
   * returns a promise, that resolves with an EventSpy. The EventSpy
   * can be used along with `expect(spy).toHaveReceivedEvent()`,
   * `expect(spy).toHaveReceivedEventTimes(x)` and
   * `expect(spy).toHaveReceivedEventDetail({...})`.
   */
  spyOnEvent(eventName: string): Promise<EventSpy>;

  /**
   * Represents the tab order of the current element. Setting the
   * `tabIndex` property will also set the `tabindex` attribute.
   */
  tabIndex: number;

  /**
   * Tag name of the element. Note, this will always be upper-cased.
   */
  tagName: string;

  /**
   * This method scrolls the element it into view if needed,
   * and then uses `page.touchscreen` to tap in the center of the element.
   */
  tap(): Promise<void>;

  /**
   * The `textContent` property represents the text content of a node
   * and its descendants. Note that `await page.waitForChanges()` must
   * be called before reading the value if content has changed.
   */
  textContent: string;

  /**
   * Represents the `title` of the element, the text usually displayed in a
   * 'tool tip' popup when the mouse is over the displayed node.
   */
  title: string;

  /**
   * Toggles a `boolean` attribute (removing it if it is present and adding
   * it if it is not present) on the given element. Note that
   * `await page.waitForChanges()` must be called before reading
   * the value if content has changed. The optional `force` argument is a
   * `boolean` value to determine whether the attribute should be added or
   * removed, no matter whether the attribute is present or not at the moment.
   */
  toggleAttribute(name: string, force?: boolean): void;

  /**
   * This is a convenience method to easily create a `CustomEvent`,
   * and dispatch it from the element, to include any custom event
   * `detail` data as the second argument.
   */
  triggerEvent(eventName: string, eventInitDict?: EventInitDict): void;

  /**
   * Sends a keydown, keypress/input, and keyup event for each character in the text.
   * To press a special key, like Control or ArrowDown, use `keyboard.press`.
   */
  type(text: string, options?: { delay: number }): Promise<void>;

  /**
   * Waits until the element's style is `display !== 'none'`,
   * `visibility !== 'hidden'`, `opacity !== '0'` and the element
   * is connected to the document.
   */
  waitForVisible(): Promise<void>;

  /**
   * Waits until the element's style is `display === 'none'`, or
   * `visibility === 'hidden'`, or `opacity === '0'`, or the element
   * is no longer connected to the document.
   */
  waitForNotVisible(): Promise<void>;

  /**
   * Waits until the given event is listened in the element.
   */
  waitForEvent(eventName: string): Promise<any>;
}

export interface E2EElementInternal extends E2EElement {
  e2eDispose(): Promise<void>;
  e2eRunActions(): Promise<unknown>;
  e2eSync(): Promise<void>;
}

export type FindSelector = string | FindSelectorOptions;

export interface FindSelectorOptions {
  /**
   * Finds an element with text content matching this
   * exact value after the whitespace has been trimmed.
   */
  text?: string;

  /**
   * Finds an element with text content containing this value.
   */
  contains?: string;
}

export interface WaitForEventOptions {
  timeout?: number;
}

export interface WaitForEvent {
  eventName: string;
  callback: (ev: any) => void;
}

export interface BrowserWindow extends Window {
  stencilOnEvent(id: number, event: any): void;
  stencilSerializeEvent(ev: CustomEvent): any;
  stencilSerializeEventTarget(target: any): any;
  stencilAppLoaded: boolean;
}
