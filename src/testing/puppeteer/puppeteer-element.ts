import type { EventInitDict, SerializedEvent } from '@stencil/core/internal';
import { cloneAttributes, MockHTMLElement, parseHtmlToFragment } from '@stencil/core/mock-doc';
import type * as puppeteer from 'puppeteer';

import type * as pd from './puppeteer-declarations';
import { addE2EListener, EventSpy, waitForEvent } from './puppeteer-events';

export class E2EElement extends MockHTMLElement implements pd.E2EElementInternal {
  private _queuedActions: ElementAction[] = [];

  private _queueAction(action: ElementAction) {
    this._queuedActions.push(action);
  }

  constructor(
    private _page: pd.E2EPageInternal,
    private _elmHandle: puppeteer.ElementHandle,
  ) {
    super(null, null);
    _page._e2eElements.push(this);
  }

  find(selector: string) {
    return find(this._page, this._elmHandle, selector);
  }

  findAll(selector: string) {
    return findAll(this._page, this._elmHandle, selector);
  }

  callMethod(methodName: string, ...methodArgs: any[]) {
    this._queueAction({
      methodName: methodName,
      methodArgs: methodArgs,
    });

    return this.e2eRunActions();
  }

  triggerEvent(eventName: string, eventInitDict?: EventInitDict) {
    this._queueAction({
      eventName: eventName,
      eventInitDict: eventInitDict,
    });
  }

  async spyOnEvent(eventName: string) {
    const eventSpy = new EventSpy(eventName);

    await addE2EListener(this._page, this._elmHandle, eventName, (ev: SerializedEvent) => {
      eventSpy.push(ev);
    });

    return eventSpy;
  }

  override async click(options?: puppeteer.ClickOptions) {
    await this._elmHandle.click(options);
    await this._page.waitForChanges();
  }

  override async focus() {
    await this._elmHandle.focus();
    await this._page.waitForChanges();
  }

  async hover() {
    await this._elmHandle.hover();
    await this._page.waitForChanges();
  }

  async isVisible() {
    this._validate();

    let isVisible = false;

    try {
      const executionContext = getPuppeteerExecution(this._elmHandle);
      isVisible = await executionContext.evaluate((elm: Element) => {
        return new Promise<boolean>((resolve) => {
          window.requestAnimationFrame(() => {
            if (elm.isConnected) {
              const style = window.getComputedStyle(elm);
              const isVisible =
                !!style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

              if (isVisible) {
                window.requestAnimationFrame(() => {
                  elm.clientWidth;
                  resolve(true);
                });
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          });
        });
      }, this._elmHandle);
    } catch (e) {}

    return isVisible;
  }

  waitForEvent(eventName: string) {
    return waitForEvent(this._page, eventName, this._elmHandle);
  }

  waitForVisible() {
    return new Promise<void>((resolve, reject) => {
      const checkVisible = async () => {
        const isVisible = await this.isVisible();
        if (isVisible) {
          clearInterval(resolveTmr);
          clearTimeout(rejectTmr);
          resolve();
        }
      };
      const resolveTmr = setInterval(checkVisible, 10);
      /**
       * When using screenshot functionality in a runner that is not Jasmine (e.g. Jest Circus), we need to set a
       * default value for timeouts. There are runtime errors that occur if we attempt to use optional chaining +
       * nullish coalescing with the `jasmine` global stating it's not defined. As a result, we use a ternary here.
       *
       * The '2500' value that we default to is the value of `jasmine.DEFAULT_TIMEOUT_INTERVAL` (5000) divided by 2.
       */
      const timeout =
        typeof jasmine !== 'undefined' && jasmine.DEFAULT_TIMEOUT_INTERVAL
          ? jasmine.DEFAULT_TIMEOUT_INTERVAL * 0.5
          : 2500;
      const timeoutError = new Error(`waitForVisible timed out: ${timeout}ms`);
      const rejectTmr = setTimeout(() => {
        clearTimeout(resolveTmr);
        reject(timeoutError);
      }, timeout);
    });
  }

  waitForNotVisible() {
    return new Promise<void>((resolve, reject) => {
      const checkVisible = async () => {
        const isVisible = await this.isVisible();
        if (!isVisible) {
          clearInterval(resolveTmr);
          clearTimeout(rejectTmr);
          resolve();
        }
      };
      const resolveTmr = setInterval(checkVisible, 10);
      /**
       * When using screenshot functionality in a runner that is not Jasmine (e.g. Jest Circus), we need to set a
       * default value for timeouts. There are runtime errors that occur if we attempt to use optional chaining +
       * nullish coalescing with the `jasmine` global stating it's not defined. As a result, we use a ternary here.
       *
       * The '2500' value that we default to is the value of `jasmine.DEFAULT_TIMEOUT_INTERVAL` (5000) divided by 2.
       */
      const timeout =
        typeof jasmine !== 'undefined' && jasmine.DEFAULT_TIMEOUT_INTERVAL
          ? jasmine.DEFAULT_TIMEOUT_INTERVAL * 0.5
          : 2500;
      const timeoutError = new Error(`waitForNotVisible timed out: ${timeout}ms`);
      const rejectTmr = setTimeout(() => {
        clearTimeout(resolveTmr);
        reject(timeoutError);
      }, timeout);
    });
  }

  isIntersectingViewport() {
    return this._elmHandle.isIntersectingViewport();
  }

  async press(key: puppeteer.KeyInput, options?: { text?: string; delay?: number }) {
    await this._elmHandle.press(key, options);
    await this._page.waitForChanges();
  }

  async tap() {
    await this._elmHandle.tap();
    await this._page.waitForChanges();
  }

  async type(text: string, options?: { delay: number }) {
    await this._elmHandle.type(text, options);
    await this._page.waitForChanges();
  }

  async getProperty(propertyName: string) {
    this._validate();

    const executionContext = getPuppeteerExecution(this._elmHandle);
    const propValue = await executionContext.evaluate(
      (elm: any, propertyName: string) => {
        return elm[propertyName];
      },
      this._elmHandle,
      propertyName,
    );

    return propValue;
  }

  setProperty(propertyName: string, value: any) {
    this._queueAction({
      setPropertyName: propertyName,
      setPropertyValue: value,
    });
  }

  override getAttribute(name: string) {
    this._validate();
    return super.getAttribute(name);
  }

  override setAttribute(name: string, value: any) {
    this._queueAction({
      setAttributeName: name,
      setAttributeValue: value,
    });
  }

  override removeAttribute(name: string) {
    this._queueAction({
      removeAttribute: name,
    });
  }

  toggleAttribute(name: string, force?: boolean) {
    this._queueAction({
      toggleAttributeName: name,
      toggleAttributeForce: force,
    });
  }

  override get classList() {
    const api: any = {
      add: (...classNames: string[]) => {
        classNames.forEach((className) => {
          this._queueAction({
            classAdd: className,
          });
        });
      },
      remove: (...classNames: string[]) => {
        classNames.forEach((className) => {
          this._queueAction({
            classRemove: className,
          });
        });
      },
      toggle: (className: string) => {
        this._queueAction({
          classToggle: className,
        });
      },
      contains: (className: string) => {
        this._validate();
        return super.className.split(' ').includes(className);
      },
    };
    return api;
  }

  override get className() {
    this._validate();
    return super.className;
  }

  override set className(value: string) {
    this._queueAction({
      setPropertyName: 'className',
      setPropertyValue: value,
    });
  }

  override get id() {
    this._validate();
    return super.id;
  }

  override set id(value: string) {
    this._queueAction({
      setPropertyName: 'id',
      setPropertyValue: value,
    });
  }

  override get innerHTML() {
    this._validate();
    return super.innerHTML;
  }

  override set innerHTML(value: string) {
    this._queueAction({
      setPropertyName: 'innerHTML',
      setPropertyValue: value,
    });
  }

  override get innerText() {
    this._validate();
    return super.innerText;
  }

  override set innerText(value: string) {
    this._queueAction({
      setPropertyName: 'innerText',
      setPropertyValue: value,
    });
  }

  override get nodeValue() {
    this._validate();
    return super.nodeValue;
  }

  override set nodeValue(value: string) {
    if (typeof value === 'string') {
      this._queueAction({
        setPropertyName: 'nodeValue',
        setPropertyValue: value,
      });
    }
  }

  override get outerHTML() {
    this._validate();
    return super.outerHTML;
  }

  override set outerHTML(_: any) {
    throw new Error(`outerHTML is read-only`);
  }

  override get shadowRoot() {
    this._validate();
    return super.shadowRoot;
  }

  override set shadowRoot(value: any) {
    super.shadowRoot = value;
  }

  override get tabIndex() {
    this._validate();
    return super.tabIndex;
  }

  override set tabIndex(value: number) {
    this._queueAction({
      setPropertyName: 'tabIndex',
      setPropertyValue: value,
    });
  }

  override get textContent() {
    this._validate();
    return super.textContent;
  }

  override set textContent(value: string) {
    this._queueAction({
      setPropertyName: 'textContent',
      setPropertyValue: value,
    });
  }

  override get title() {
    this._validate();
    return super.title;
  }

  override set title(value: string) {
    this._queueAction({
      setPropertyName: 'title',
      setPropertyValue: value,
    });
  }

  async getComputedStyle(pseudoElt?: string | null) {
    const style = await this._page.evaluate(
      (elm: Element, pseudoElt: string) => {
        const rtn: any = {};

        const computedStyle = window.getComputedStyle(elm, pseudoElt);

        const keys = [
          ...Object.keys(computedStyle),
          /**
           * include CSS variables defined within the style attribute
           * of an element, e.g.:
           * ```
           * <my-component style="--my-component-text-color: rgb(255, 0, 0);"></my-component>
           * ```
           */
          ...Array.from((elm as HTMLElement).style),
        ];

        keys.forEach((key) => {
          if (isNaN(key as any)) {
            const value =
              /**
               * access property directly for any known css property
               */
              computedStyle[key as any] ||
              /**
               * use `getPropertyValue` for css variables
               */
              computedStyle.getPropertyValue(key);
            if (value != null) {
              rtn[key] = value;
            }
          } else {
            const dashProp = computedStyle[key as any];
            if (dashProp.includes('-')) {
              const value = computedStyle.getPropertyValue(dashProp);
              if (value != null) {
                rtn[dashProp] = value;
              }
            }
          }
        });

        return rtn;
      },
      this._elmHandle,
      pseudoElt,
    );

    style.getPropertyValue = (propName: string) => {
      return style[propName];
    };

    return style;
  }

  async e2eRunActions() {
    if (this._queuedActions.length === 0) {
      return;
    }

    const executionContext = getPuppeteerExecution(this._elmHandle);
    const rtn = await executionContext.evaluate(
      (elm: Element, queuedActions: ElementAction[]) => {
        // BROWSER CONTEXT
        // cannot use async/await in here cuz typescript transpiles it in the node context
        return (elm as any).componentOnReady().then(() => {
          let rtn: any = null;

          queuedActions.forEach((queuedAction) => {
            if (queuedAction.methodName) {
              rtn = (elm as any)[queuedAction.methodName].apply(elm, queuedAction.methodArgs);
            } else if (queuedAction.setPropertyName) {
              (elm as any)[queuedAction.setPropertyName] = queuedAction.setPropertyValue;
            } else if (queuedAction.setAttributeName) {
              elm.setAttribute(queuedAction.setAttributeName, queuedAction.setAttributeValue);
            } else if (queuedAction.removeAttribute) {
              elm.removeAttribute(queuedAction.removeAttribute);
            } else if (queuedAction.toggleAttributeName) {
              if (typeof queuedAction.toggleAttributeForce === 'boolean') {
                elm.toggleAttribute(queuedAction.toggleAttributeName, queuedAction.toggleAttributeForce);
              } else {
                elm.toggleAttribute(queuedAction.toggleAttributeName);
              }
            } else if (queuedAction.classAdd) {
              elm.classList.add(queuedAction.classAdd);
            } else if (queuedAction.classRemove) {
              elm.classList.remove(queuedAction.classRemove);
            } else if (queuedAction.classToggle) {
              elm.classList.toggle(queuedAction.classToggle);
            } else if (queuedAction.eventName) {
              const eventInitDict = queuedAction.eventInitDict || {};

              if (typeof eventInitDict.bubbles !== 'boolean') {
                eventInitDict.bubbles = true;
              }

              if (typeof eventInitDict.cancelable !== 'boolean') {
                eventInitDict.cancelable = true;
              }

              if (typeof eventInitDict.composed !== 'boolean') {
                eventInitDict.composed = true;
              }

              const ev = new CustomEvent(queuedAction.eventName, eventInitDict);
              elm.dispatchEvent(ev);
            }
          });

          if (rtn && typeof rtn.then === 'function') {
            return rtn.then((value: any) => {
              return value;
            });
          }

          return rtn;
        });
      },
      this._elmHandle,
      this._queuedActions as any,
    );

    this._queuedActions.length = 0;

    return rtn;
  }

  async e2eSync() {
    const executionContext = getPuppeteerExecution(this._elmHandle);
    const { outerHTML, shadowRootHTML } = await executionContext.evaluate((elm: Element) => {
      return {
        outerHTML: elm.outerHTML,
        shadowRootHTML: elm.shadowRoot ? elm.shadowRoot.innerHTML : null,
      };
    }, this._elmHandle);

    if (typeof shadowRootHTML === 'string') {
      (this as any).shadowRoot = parseHtmlToFragment(shadowRootHTML) as any;
      (this as any).shadowRoot.host = this;
    } else {
      (this as any).shadowRoot = null;
    }

    const frag = parseHtmlToFragment(outerHTML);

    const rootElm = frag.firstElementChild;

    /**
     * in case the user called `newE2EPage` without any content `rootElm` will be undefined
     * and further operations will fail. We need to check for this case and return early.
     */
    if (!rootElm) {
      return;
    }

    this.nodeName = rootElm.nodeName;
    this.attributes = cloneAttributes(rootElm.attributes);

    while (this.childNodes.length > 0) {
      this.removeChild(this.childNodes[0]);
    }

    while (rootElm.childNodes.length > 0) {
      this.appendChild(rootElm.childNodes[0]);
    }
  }

  private _validate() {
    if (this._queuedActions.length > 0) {
      throw new Error(`await page.waitForChanges() must be called before reading element information`);
    }
  }

  async e2eDispose() {
    if (this._elmHandle) {
      await this._elmHandle.dispose();
      this._elmHandle = null;
    }

    const index = this._page._e2eElements.indexOf(this);
    if (index > -1) {
      this._page._e2eElements.splice(index, 1);
    }

    this._page = null;
  }
}

export async function find(page: pd.E2EPageInternal, rootHandle: puppeteer.ElementHandle, selector: pd.FindSelector) {
  const { lightSelector, text, contains } = getSelector(selector);

  let elmHandle: puppeteer.ElementHandle;

  if (typeof selector === 'string' && selector.includes('>>>')) {
    const handle = await page.$(selector);

    if (!handle) {
      return null;
    }

    const elm = new E2EElement(page, handle);
    await elm.e2eSync();
    return elm;
  }

  if (typeof lightSelector === 'string') {
    elmHandle = await findWithCssSelector(rootHandle, lightSelector);
  } else {
    elmHandle = await findWithText(page, rootHandle, text, contains);
  }

  if (!elmHandle) {
    return null;
  }

  const elm = new E2EElement(page, elmHandle);
  await elm.e2eSync();
  return elm;
}

async function findWithCssSelector(rootHandle: puppeteer.ElementHandle, lightSelector: string) {
  const elmHandle = await rootHandle.$(lightSelector);

  if (!elmHandle) {
    return null;
  }

  return elmHandle;
}

async function findWithText(
  page: pd.E2EPageInternal,
  rootHandle: puppeteer.ElementHandle,
  text: string,
  contains: string,
) {
  const jsHandle = await page.evaluateHandle(
    (rootElm: Element, text: string, contains: string) => {
      let foundElm: HTMLElement | null = null;

      function checkContent(elm: Node) {
        if (!elm || foundElm) {
          return;
        }

        if (elm.nodeType === 3) {
          if (typeof text === 'string' && elm.textContent.trim() === text) {
            foundElm = elm.parentElement;
            return;
          }
          if (typeof contains === 'string' && elm.textContent.includes(contains)) {
            foundElm = elm.parentElement;
            return;
          }
        } else {
          if (elm.nodeName === 'SCRIPT' || elm.nodeName === 'STYLE') {
            return;
          }
          checkContent((elm as Element).shadowRoot);
          if (elm.childNodes) {
            for (let i = 0; i < elm.childNodes.length; i++) {
              checkContent(elm.childNodes[i]);
            }
          }
        }
      }

      checkContent(rootElm);

      return foundElm;
    },
    rootHandle,
    text,
    contains,
  );

  if (jsHandle) {
    return jsHandle.asElement() as puppeteer.ElementHandle<Element>;
  }

  return null;
}

export async function findAll(
  page: pd.E2EPageInternal,
  rootHandle: puppeteer.ElementHandle,
  selector: pd.FindSelector,
) {
  const foundElms: E2EElement[] = [];

  if (typeof selector === 'string' && selector.includes('>>>')) {
    const handles = await page.$$(selector);
    for (let i = 0; i < handles.length; i++) {
      const elm = new E2EElement(page, handles[i]);
      await elm.e2eSync();
      foundElms.push(elm);
    }
    return foundElms;
  }

  const { lightSelector } = getSelector(selector);
  const lightElmHandles = await rootHandle.$$(lightSelector);
  if (lightElmHandles.length === 0) {
    return foundElms;
  }

  for (let i = 0; i < lightElmHandles.length; i++) {
    const elm = new E2EElement(page, lightElmHandles[i]);
    await elm.e2eSync();
    foundElms.push(elm);
  }

  return foundElms;
}

function getSelector(selector: pd.FindSelector) {
  const rtn = {
    lightSelector: null as string,
    text: null as string,
    contains: null as string,
  };

  if (typeof selector === 'string') {
    rtn.lightSelector = selector.trim();
  } else if (typeof selector.text === 'string') {
    rtn.text = selector.text.trim();
  } else if (typeof selector.contains === 'string') {
    rtn.contains = selector.contains.trim();
  } else {
    throw new Error(`invalid find selector: ${selector}`);
  }

  return rtn;
}

/**
 * A helper function for retrieving an execution context from a Puppeteer handle entity. The way that these objects can
 * be retrieved changed in Puppeteer v17, requiring a check of the version of the library that is installed at runtime.
 *
 * This function expects that the {@link E2EProcessEnv#__STENCIL_PUPPETEER_VERSION__} be set prior to invocation. If
 * it is not set, the function assumes an older version of Puppeteer is used.
 *
 * @param elmHandle the Puppeteer handle to an element
 * @returns the execution context from the handle
 */
function getPuppeteerExecution(elmHandle: puppeteer.ElementHandle) {
  const puppeteerMajorVersion = parseInt(process.env.__STENCIL_PUPPETEER_VERSION__, 10);
  if (puppeteerMajorVersion >= 17) {
    // in puppeteer v17, a context for executing JS can be retrieved from a frame
    // the `any` type assertion is necessary for backwards compatibility with the type checker
    return (elmHandle as any).frame;
  } else {
    // in puppeteer v16 and lower, an execution context could be retrieved from a handle to execute JS
    // the `any` type assertion is necessary for backwards compatibility with the type checker
    //
    // if the result of `parseInt` on the puppeteer version is NaN, assume that the user is on a lower version of
    // puppeteer
    return (elmHandle as any).executionContext();
  }
}

interface ElementAction {
  classAdd?: string;
  classRemove?: string;
  classToggle?: string;
  eventName?: string;
  eventInitDict?: EventInitDict;
  methodName?: string;
  methodArgs?: any[];
  removeAttribute?: string;
  setAttributeName?: string;
  setAttributeValue?: any;
  setPropertyName?: string;
  setPropertyValue?: any;
  toggleAttributeName?: string;
  toggleAttributeForce?: boolean;
}
