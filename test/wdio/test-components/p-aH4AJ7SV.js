import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { p as printLifecycle, d as defineCustomElement$1 } from './p-CHg-J0yO.js';

const cmpCCss = () => `${transformTag("cmp-c")}{display:block;padding:10px;background:fuchsia}`;

const CmpC = /*@__PURE__*/ proxyCustomElement(class CmpC extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        printLifecycle('CmpC', 'componentWillLoad');
    }
    componentDidLoad() {
        printLifecycle('CmpC', 'componentDidLoad');
    }
    render() {
        return (h("div", { key: '1ba02914af61ac108c95640402c284c44a174e59' }, h("div", { key: '492f7a941ccb9f2da6061f73e1df482a4da90e68' }, "CmpC"), h("cmp-d", { key: 'bd400affa7c1b321aa780311e1d39a0cbac2e7ba', uniqueId: "c-child" })));
    }
    static get style() { return cmpCCss(); }
}, [0, "cmp-c"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-c", "cmp-d"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpC);
            }
            break;
        case "cmp-d":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CmpC as C, defineCustomElement as d };
