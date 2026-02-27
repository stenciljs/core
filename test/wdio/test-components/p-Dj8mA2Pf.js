import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { p as printLifecycle, d as defineCustomElement$1 } from './p-CHg-J0yO.js';
import { d as defineCustomElement$3 } from './p-DDPFIrwt.js';
import { d as defineCustomElement$2 } from './p-aH4AJ7SV.js';

const cmpACss = () => `${transformTag("cmp-a")}{display:block;padding:10px;background:red}`;

const CmpA = /*@__PURE__*/ proxyCustomElement(class CmpA extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        printLifecycle('CmpA', 'componentWillLoad');
    }
    componentDidLoad() {
        printLifecycle('CmpA', 'componentDidLoad');
    }
    render() {
        return (h("div", { key: 'c99e4328427b1e1e06f6d8d08e00937c6734047b' }, h("div", { key: 'def7bf115045e67b3b76e8a9587a2e9bf09aabaf' }, "CmpA"), h("cmp-b", { key: 'b2f730963ed2ba8dc7f08b4f1dec8f649f1c4da2' }), h("slot", { key: '1e21ac8346472a5eb21a02d8e2c216959e92ec75' })));
    }
    static get style() { return cmpACss(); }
}, [260, "cmp-a"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-a", "cmp-b", "cmp-c", "cmp-d"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpA);
            }
            break;
        case "cmp-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "cmp-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
        case "cmp-d":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CmpA as C, defineCustomElement as d };
