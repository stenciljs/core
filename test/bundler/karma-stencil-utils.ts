import * as path from 'path';

// we must use a relative path here instead of tsconfig#paths
// see https://github.com/monounity/karma-typescript/issues/315
import * as d from '../../internal';

/**
 * Utilities for creating a test bed to execute HTML rendering tests against
 */
type DomTestUtilities = {
  /**
   * Create and render the HTML at the provided url
   * @param url a location on disk of a file containing the HTML to load
   * @returns the fully rendered HTML to test against
   */
  setupDom: (url: string) => Promise<HTMLElement>;
  /**
   * Clears the test bed of any existing HTML
   */
  tearDownDom: () => void;
};

/**
 * Create setup and teardown methods for DOM based tests. All DOM based tests are created within an application
 * 'test bed' that is managed by this function.
 * @param document a `Document` compliant entity where tests may be rendered
 * @returns utilities to set up the DOM and tear it down within the test bed
 */
export function setupDomTests(document: Document): DomTestUtilities {
  /**
   * All HTML will be rendered as a child of the test bed - get it from the current document (and create it, if it
   * doesn't exist) so that it is available for all future tests.
   */
  let testBed = document.getElementById('test-app');
  if (!testBed) {
    testBed = document.createElement('div');
    testBed.id = 'test-app';
    document.body.appendChild(testBed);
  }

  /**
   * @see {@link DomTestUtilities#setupDom}
   */
  function setupDom(url: string): Promise<HTMLElement> {
    const testElement = document.createElement('div');
    testElement.className = 'test-spec';

    if (!testBed) {
      console.error('The Stencil/Karma test bed could not be found.');
      process.exit(1);
    }

    testBed.appendChild(testElement);

    return renderTest(url, testElement);
  }

  /**
   * Render HTML for executing tests against.
   * @param url the location on disk containing the HTML to load
   * @param testElement a parent HTML element to place test code in
   * @returns the fully rendered HTML to test against
   */
  function renderTest(url: string, testElement: HTMLElement): Promise<HTMLElement> {
    // 'base' is the directory that karma will serve all assets from
    url = path.join('base', url);

    return new Promise<HTMLElement>((resolve, reject) => {
      /**
       * Callback to be invoked following the retrieval of the file containing the HTML to load
       * @param this the `XMLHttpRequest` instance that requested the HTML
       */
      const indexHtmlLoaded = function (this: XMLHttpRequest): void {
        if (this.status !== 200) {
          reject(`404: ${url}`);
          return;
        }

        testElement.innerHTML = this.responseText;

        /**
         * Re-generate script tags that are embedded in the loaded HTML file.
         *
         * Doing so allows JS files to be loaded (via script tags), when the HTML is served, without having to configure
         * Karma to load the JS explicitly. This is done by adding the host/port combination to existing `src`
         * attributes.
         *
         * Before:
         * ```html
         * <script type="module" src="/index.6127a5ed.js"></script>
         * ```
         *
         * After:
         * ```html
         * <script src="http://localhost:9876/index.547a265b.js" type="module"></script>
         * ```
         */
        const parseAndRebuildScriptTags = () => {
          const tempScripts: NodeListOf<HTMLScriptElement> = testElement.querySelectorAll('script');
          for (let i = 0; i < tempScripts.length; i++) {
            const script: HTMLScriptElement = document.createElement('script');
            if (tempScripts[i].src) {
              script.src = tempScripts[i].src;
            }
            if (tempScripts[i].hasAttribute('nomodule')) {
              script.setAttribute('nomodule', '');
            }
            if (tempScripts[i].hasAttribute('type')) {
              const typeAttribute = tempScripts[i].getAttribute('type');
              if (typeof typeAttribute === 'string') {
                // older DOM implementations would return an empty string to designate `null`
                // here, we interpret the empty string to be a valid value
                script.setAttribute('type', typeAttribute);
              }
            }
            script.innerHTML = tempScripts[i].innerHTML;

            if (tempScripts[i].parentNode) {
              // the scripts were found by querying a common parent node, which _should_ still exist
              tempScripts[i].parentNode!.insertBefore(script, tempScripts[i]);
              tempScripts[i].parentNode!.removeChild(tempScripts[i]);
            } else {
              // if for some reason the parent node no longer exists, something's manipulated it while we were parsing
              // the script tags. this can lead to undesirable & hard to debug behavior, fail.
              reject('the parent node for script tags no longer exists. exiting.');
            }
          }
        };

        parseAndRebuildScriptTags();

        /**
         * Create a listener for Stencil's "appload" event to signal to the test framework the application and its
         * children have finished loading
         */
        const onAppLoad = () => {
          window.removeEventListener('appload', onAppLoad);
          allReady().then(() => {
            resolve(testElement);
          });
        };
        window.addEventListener('appload', onAppLoad);
      };

      /**
       * Ensure that all `onComponentReady` functions on Stencil elements in the DOM have been called before rendering
       * @returns an array of promises, one for each `onComponentReady` found on a Stencil component
       */
      const allReady = (): Promise<d.HTMLStencilElement[] | void> => {
        const promises: Promise<d.HTMLStencilElement>[] = [];

        /**
         * Function that recursively traverses the DOM, looking for Stencil components. Any `componentOnReady`
         * functions found on Stencil components are pushed to a buffer to be run after traversing the entire DOM.
         * @param elm the current element being inspected
         */
        const waitForDidLoad = (elm: Element): void => {
          if (elm != null && elm.nodeType === 1) {
            // the element exists and is an `ELEMENT_NODE`
            for (let i = 0; i < elm.children.length; i++) {
              const childElm = elm.children[i];
              if (childElm.tagName.includes('-') && isHtmlStencilElement(childElm)) {
                promises.push(childElm.componentOnReady());
              }
              waitForDidLoad(childElm);
            }
          }
        };

        // recursively walk the DOM to find all `onComponentReady` functions
        waitForDidLoad(window.document.documentElement);

        return Promise.all(promises).catch((e) => console.error(e));
      };

      try {
        const testHtmlRequest = new XMLHttpRequest();
        testHtmlRequest.addEventListener('load', indexHtmlLoaded);
        testHtmlRequest.addEventListener('error', (err) => {
          console.error('error testHtmlRequest.addEventListener', err);
          reject(err);
        });
        testHtmlRequest.open('GET', url);
        testHtmlRequest.send();
      } catch (e: unknown) {
        console.error('catch error', e);
        reject(e);
      }
    });
  }

  /**
   * @see {@link DomTestUtilities#tearDownDom}
   */
  function tearDownDom(): void {
    if (testBed) {
      testBed.innerHTML = '';
    }
  }

  return { setupDom, tearDownDom };
}

/**
 * Type guard to verify some entity is an instance of Stencil HTML Element
 * @param elm the entity to test
 * @returns `true` if the entity is a Stencil HTML Element, `false` otherwise
 */
function isHtmlStencilElement(elm: unknown): elm is d.HTMLStencilElement {
  // `hasOwnProperty` does not act as a type guard/narrow `elm` in any way, so we use an assertion to verify that
  // `onComponentReady` is a function
  return (
    elm != null &&
    typeof elm === 'object' &&
    elm.hasOwnProperty('onComponentReady') &&
    typeof (elm as any).onComponentReady === 'function'
  );
}
