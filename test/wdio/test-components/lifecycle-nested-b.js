import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { o as output } from './p-DsmUNt_b.js';

const Cmpb = /*@__PURE__*/ proxyCustomElement(class Cmpb extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async componentWillLoad() {
        output('componentWillLoad-b');
    }
    async componentDidLoad() {
        output('componentDidLoad-b');
    }
    render() {
        return h("slot", { key: 'b526d1e88aab20bdddaed07d551881a92cdfa46e' });
    }
}, [257, "lifecycle-nested-b"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-nested-b"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-nested-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Cmpb);
            }
            break;
    } });
}

const LifecycleNestedB = Cmpb;
const defineCustomElement = defineCustomElement$1;

export { LifecycleNestedB, defineCustomElement };
