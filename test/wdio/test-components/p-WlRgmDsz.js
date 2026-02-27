import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-ChZsFjb2.js';

const cmpLevel2Css = () => `.sc-cmp-level-2-h ${transformTag("cmp-level-3")}.sc-cmp-level-2{font-weight:800}.sc-cmp-level-2-h ${transformTag("cmp-level-3")}.sc-cmp-level-2 #test-element.sc-cmp-level-2{font-weight:600}`;

const CmpLevel2 = /*@__PURE__*/ proxyCustomElement(class CmpLevel2 extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("cmp-level-3", { key: 'dab43c899ef97c370b02ace58d948186b4943717' }, h("slot", { key: 'a45b04a61cf7dd217e156d48734419c99d8ffc9c' })));
    }
    static get style() { return cmpLevel2Css(); }
}, [262, "cmp-level-2"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-level-2", "cmp-level-3"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-level-2":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpLevel2);
            }
            break;
        case "cmp-level-3":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CmpLevel2 as C, defineCustomElement as d };
