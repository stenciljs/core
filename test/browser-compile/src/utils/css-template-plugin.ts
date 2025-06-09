import StencilTypes from '@stencil/core/compiler';

export const styleImports = new Map<string, string>();
styleImports.set(
  `/shared.css`,
  `
button {
  font-size: 24px;
  color: white;
  font-weight: bold;
}
`,
);

styleImports.set(
  `/style-import.css`,
  `
@import "./shared.css";

my-button { display: block; padding: 20px; background: #ddd; }

my-button::before { content: "style-import.css"; position: absolute; left: 0; top: 0; }

button { background: purple; }
`,
);

styleImports.set(
  `/scoped-style-import.css`,
  `
@import "./shared.css";

:host { display: block; padding: 20px; background: #ddd; }

:host::before { content: "scoped-style-import.css"; position: absolute; left: 0; top: 0; }

button { background: maroon; }
`,
);

styleImports.set(
  `/ios.css`,
  `
@import "shared.css";

:host { display: block; padding: 20px; background: #ddd; }

:host::before { content: "ios.css"; position: absolute; left: 0; top: 0; }

button { background: blue; }
`,
);

styleImports.set(
  `/md.css`,
  `
@import "/shared.css";

:host { display: block; padding: 20px; background: #ddd; }

:host::before { content: "md.css"; position: absolute; left: 50px; top: 0; }

button { background: green; }
`,
);

export const cssTemplatePlugin = {
  name: 'cssTemplatePlugin',

  async load(id: string) {
    let code = styleImports.get(id.split('?')[0]);
    if (code) {
      const results = await stencil.transpile(code, {
        file: id,
      });
      return results.code;
    }
    return code;
  },
};

declare const stencil: typeof StencilTypes;
