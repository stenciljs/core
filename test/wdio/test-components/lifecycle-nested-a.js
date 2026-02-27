import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { o as output } from './p-DsmUNt_b.js';

const Cmpa = /*@__PURE__*/ proxyCustomElement(class Cmpa extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async componentWillLoad() {
        output('componentWillLoad-a');
    }
    async componentDidLoad() {
        output('componentDidLoad-a');
    }
    render() {
        return h("slot", { key: 'c6b70d815b1c0c58870a98daa00f932494603a89' });
    }
}, [257, "lifecycle-nested-a"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-nested-a"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-nested-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Cmpa);
            }
            break;
    } });
}

const LifecycleNestedA = Cmpa;
const defineCustomElement = defineCustomElement$1;

export { LifecycleNestedA, defineCustomElement };
