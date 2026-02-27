import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ScopedBasic = /*@__PURE__*/ proxyCustomElement(class ScopedBasic extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [
            h("span", { key: 'e32162bd7564418adad8372e4ed2b37a90acdc87' }, "scoped"),
            h("p", { key: '5c844eaf61a7f49e89915ecee5bd45f84acc56fc' }, h("slot", { key: '579eb078e1d32985c823adaa231293b599eaa254' })),
        ];
    }
    static get style() { return `.sc-scoped-basic-h {
      display: block;
      background: black;
      color: grey;
    }

    span.sc-scoped-basic {
      color: red;
    }

    .sc-scoped-basic-s > span {
      color: yellow;
    }`; }
}, [262, "scoped-basic"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedBasic);
            }
            break;
    } });
}

export { ScopedBasic as S, defineCustomElement as d };
