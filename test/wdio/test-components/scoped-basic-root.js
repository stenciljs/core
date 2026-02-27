import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-gAHuODu2.js';

const cmpRootMdCss = () => `.sc-scoped-basic-root-md-h{color:white}`;

const ScopedBasicRoot$1 = /*@__PURE__*/ proxyCustomElement(class ScopedBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("scoped-basic", { key: 'f7cc2bc704a37e7d561faabe9099e927efc1013c' }, h("span", { key: 'ef84fbd85a4a7eda499acd68d4b11346913452ae' }, "light")));
    }
    static get style() { return {
        md: cmpRootMdCss()
    }; }
}, [34, "scoped-basic-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-basic-root", "scoped-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-basic-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ScopedBasicRoot$1);
            }
            break;
        case "scoped-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ScopedBasicRoot = ScopedBasicRoot$1;
const defineCustomElement = defineCustomElement$1;

export { ScopedBasicRoot, defineCustomElement };
