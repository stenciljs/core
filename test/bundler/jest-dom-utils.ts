import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export type DomTestUtilities = {
  setupDom: (htmlPathFromRepoRoot: string) => Promise<HTMLElement>;
  tearDownDom: () => void;
};

export function setupDomTests(document: Document): DomTestUtilities {
  let testBed = document.getElementById('test-app');
  if (!testBed) {
    testBed = document.createElement('div');
    testBed.id = 'test-app';
    document.body.appendChild(testBed);
  }

  async function setupDom(htmlPathFromRepoRoot: string): Promise<HTMLElement> {
    if (!testBed) {
      throw new Error('The Stencil/Jest test bed could not be found.');
    }
    const testElement = document.createElement('div');
    testElement.className = 'test-spec';
    testBed.appendChild(testElement);

    const absPath = path.resolve(process.cwd(), htmlPathFromRepoRoot.replace(/^\//, ''));
    const html = fs.readFileSync(absPath, 'utf-8');
    testElement.innerHTML = html;

    // execute module scripts referenced by the built index.html so components register
    const baseDir = path.dirname(absPath);
    const scripts = Array.from(testElement.querySelectorAll('script')) as HTMLScriptElement[];
    for (const s of scripts) {
      const type = (s.getAttribute('type') || '').toLowerCase();
      const src = s.getAttribute('src');
      if (type === 'module' && src && src.endsWith('.js')) {
        const rel = src.startsWith('/') ? src.slice(1) : src;
        const jsAbs = path.resolve(baseDir, rel);
        const fileUrl = pathToFileURL(jsAbs);
        // dynamic import to execute the built bundle
        // eslint-disable-next-line no-await-in-loop
        await import(fileUrl.href);
      }
    }

    // wait for app readiness similar to Karma helper
    await new Promise<void>((resolve) => {
      const onAppLoad = () => {
        window.removeEventListener('appload', onAppLoad);
        resolve();
      };
      window.addEventListener('appload', onAppLoad);
      // if app already loaded synchronously, resolve on next tick
      setTimeout(() => resolve(), 0);
    });

    await allReady();
    return testElement;
  }

  function tearDownDom(): void {
    if (testBed) {
      testBed.innerHTML = '';
    }
  }

  async function allReady(): Promise<void> {
    const promises: Promise<any>[] = [];
    const waitForDidLoad = (elm: Element): void => {
      if (elm != null && elm.nodeType === 1) {
        for (let i = 0; i < elm.children.length; i++) {
          const childElm = elm.children[i] as any;
          if (childElm.tagName && childElm.tagName.includes('-') && typeof childElm.componentOnReady === 'function') {
            promises.push(childElm.componentOnReady());
          }
          waitForDidLoad(childElm);
        }
      }
    };
    waitForDidLoad(window.document.documentElement);
    await Promise.all(promises).catch((e) => console.error(e));
  }

  return { setupDom, tearDownDom };
}
