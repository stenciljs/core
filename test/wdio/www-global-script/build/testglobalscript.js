
(function() {
  function checkSupport() {
    if (!document.body) {
      setTimeout(checkSupport);
      return;
    }
    function supportsDynamicImports() {
      try {
        new Function('import("")');
        return true;
      } catch (e) {}
      return false;
    }
    var supportsEsModules = !!('noModule' in document.createElement('script'));

    if (!supportsEsModules) {
      document.body.innerHTML = '\n  \n<style>\nbody {\n  display: block !important;\n  font-family: sans-serif;\n  padding: 20px;\n  line-height:22px;\n}\nh1 {\n  font-size: 18px;\n}\nh2 {\n  font-size: 14px;\n  margin-top: 40px;\n}\n</style>\n\n\n  <h1>This Stencil app is disabled for this browser.</h1>\n\n  <h2>Developers:</h2>\n  <ul>\n    <li>ES5 builds are disabled <strong>during development</strong> to take advantage of 2x faster build times.</li>\n    <li>Please see the example below or our <a href="https://stenciljs.com/docs/stencil-config" target="_blank" rel="noopener noreferrer">config docs</a> if you would like to develop on a browser that does not fully support ES2017 and custom elements.</li>\n    <li>Note that as of Stencil v2, ES5 builds and polyfills are <strong>disabled</strong> during production builds. You can enable these <a href="https://stenciljs.com/docs/config#buildes5" target="_blank" rel="noopener noreferrer">in your stencil.config.ts file</a>.</li>\n    <li>When testing browsers it is recommended to always test in production mode, and ES5 builds should always be enabled during production builds.</li>\n    <li><em>This is only an experiment and if it slows down app development then we will revert this and enable ES5 builds during dev.</em></li>\n  </ul>\n\n\n  <h2>Enabling ES5 builds during development:</h2>\n  <pre>\n    <code>npm run dev --es5</code>\n  </pre>\n  <p>For stencil-component-starter, use:</p>\n  <pre>\n    <code>npm start --es5</code>\n  </pre>\n\n\n  <h2>Enabling full production builds during development:</h2>\n  <pre>\n    <code>npm run dev --prod</code>\n  </pre>\n  <p>For stencil-component-starter, use:</p>\n  <pre>\n    <code>npm start --prod</code>\n  </pre>\n\n  <h2>Current Browser\'s Support:</h2>\n  <ul>\n    <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import">ES Module Imports</a>: <span id="es-modules-test"></span></li>\n    <li><a href="http://2ality.com/2017/01/import-operator.html">ES Dynamic Imports</a>: <span id="es-dynamic-modules-test"></span></li>\n    <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements">Custom Elements</a>: <span id="custom-elements-test"></span></li>\n    <li><a href="https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM">Shadow DOM</a>: <span id="shadow-dom-test"></span></li>\n    <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API">fetch</a>: <span id="fetch-test"></span></li>\n    <li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables">CSS Variables</a>: <span id="css-variables-test"></span></li>\n  </ul>\n\n  <h2>Current Browser:</h2>\n  <pre>\n    <code id="current-browser-output"></code>\n  </pre>\n';

      document.getElementById('current-browser-output').textContent = window.navigator.userAgent;
      document.getElementById('es-modules-test').textContent = supportsEsModules;
      document.getElementById('es-dynamic-modules-test').textContent = supportsDynamicImports();
      document.getElementById('shadow-dom-test').textContent = !!(document.head.attachShadow);
      document.getElementById('custom-elements-test').textContent = !!(window.customElements);
      document.getElementById('css-variables-test').textContent = !!(window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--c)'));
      document.getElementById('fetch-test').textContent = !!(window.fetch);
    } else {
      document.body.innerHTML = '\n  \n<style>\nbody {\n  display: block !important;\n  font-family: sans-serif;\n  padding: 20px;\n  line-height:22px;\n}\nh1 {\n  font-size: 18px;\n}\nh2 {\n  font-size: 14px;\n  margin-top: 40px;\n}\n</style>\n\n\n  <h1>Update src/index.html</h1>\n\n  <p>Stencil recently changed how scripts are loaded in order to improve performance.</p>\n\n  <h2>BEFORE:</h2>\n  <p>Previously, a single script was included that handled loading the correct JavaScript based on browser support.</p>\n  <pre>\n    <code>&lt;script src=&quot;/build/testglobalscript.js&quot;&gt;&lt;/script&gt;\n</code>\n  </pre>\n\n  <h2 style="margin-top:0">AFTER:</h2>\n  <p>The index.html should now include two scripts using the modern ES Module script pattern.\n  Note that only one file will actually be requested and loaded based on the browser\'s native support for ES Modules.\n  For more info, please see <a href="https://developers.google.com/web/fundamentals/primers/modules#browser" target="_blank" rel="noopener noreferrer">Using JavaScript modules on the web</a>.\n  </p>\n  <pre>\n  <code>&lt;script <span style="background:yellow">type="module"</span> src="/build/testglobalscript<span style="background:yellow">.esm</span>.js"&gt;&lt;/script&gt;\n  &lt;script <span style="background:yellow">nomodule</span> src=&quot;/build/testglobalscript.js&quot;&gt;&lt;/script&gt;</code>\n    </pre>\n';
    }
  }

  setTimeout(checkSupport);
})();