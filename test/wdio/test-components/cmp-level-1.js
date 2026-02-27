import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-WlRgmDsz.js';
import { d as defineCustomElement$2 } from './p-ChZsFjb2.js';

const cmpLevel1Css = () => `.sc-cmp-level-1-h ${transformTag("cmp-level-2")}.sc-cmp-level-1-s>#test-element,.sc-cmp-level-1-h ${transformTag("cmp-level-2")} .sc-cmp-level-1-s>#test-element{color:blue}.sc-cmp-level-1-h ${transformTag("cmp-level-2")}.sc-cmp-level-1 ${transformTag("cmp-level-3")}.sc-cmp-level-1{padding:32px}.sc-cmp-level-1-h ${transformTag("cmp-level-2")}.sc-cmp-level-1 ${transformTag("cmp-level-3")}.sc-cmp-level-1 #test-element.sc-cmp-level-1{padding:24px}`;

const CmpLevel1$1 = /*@__PURE__*/ proxyCustomElement(class CmpLevel1 extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("cmp-level-2", { key: 'e4885a6740f81b3d3e272a0a185f37ee628e1ff0' }, h("slot", { key: 'd3915e003bafaf9a88b2164df7bb938b8d28578c' })));
    }
    static get style() { return cmpLevel1Css(); }
}, [262, "cmp-level-1"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-level-1", "cmp-level-2", "cmp-level-3"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-level-1":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpLevel1$1);
            }
            break;
        case "cmp-level-2":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "cmp-level-3":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CmpLevel1 = CmpLevel1$1;
const defineCustomElement = defineCustomElement$1;

export { CmpLevel1, defineCustomElement };
