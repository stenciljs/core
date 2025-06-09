export const loadDeps = async (resolveLookup: Map<string, string>, fs: Map<string, string>) => {
  resolveLookup.set('@stencil/core/internal/client', '/@stencil/core/internal/client/index.js');
  resolveLookup.set('@stencil/core/internal/app-data', '/@stencil/core/internal/app-data/index.js');

  await loadDep('/@stencil/core/compiler/stencil.js');

  const rollupDep: [string, unknown] = Object.entries(stencil.versions).find(
    (dep: [string, unknown]) => dep[0] === 'rollup',
  );
  await loadDep(`https://cdn.jsdelivr.net/npm/rollup@${rollupDep[1]}/dist/rollup.browser.js`);

  const fetchResults = await Promise.all([
    await fetch('/@stencil/core/internal/client/index.js'),
    await fetch('/@stencil/core/internal/client/shadow-css.js'),
    await fetch('/@stencil/core/internal/app-data/index.js'),
    await fetch('/@stencil/core/internal/client/css-shim.js'),
    await fetch('/@stencil/core/internal/client/dom.js'),
  ]);

  await Promise.all([
    fetchResults.map(async (r) => {
      const file = new URL(r.url).pathname;
      const code = await r.text();
      fs.set(file, code);
    }),
  ]);
};

const loadDep = (url: string) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.onload = () => {
      console.log('loaded dep:', url);
      setTimeout(resolve);
    };
    script.onerror = (e) => {
      console.log('error loading dep:', url);
      reject(e);
    };
    script.src = url;
    document.head.appendChild(script);
  });
};

declare const stencil: any;
