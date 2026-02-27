import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const delegatesFocusCss = () => `:host{display:block;border:5px solid red;padding:10px;margin:10px}input{display:block;width:100%}:host(:focus){border:5px solid blue}`;

const DelegatesFocus$1 = /*@__PURE__*/ proxyCustomElement(class DelegatesFocus extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: 'f88c0e235a7afe52db61792e1b65908b4a4c3180' }, h("input", { key: 'a6cd7ec95ceedca97e529d7773cbbcf4560799c8' })));
    }
    static get delegatesFocus() { return true; }
    static get style() { return delegatesFocusCss(); }
}, [17, "delegates-focus"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["delegates-focus"];
    components.forEach(tagName => { switch (tagName) {
        case "delegates-focus":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DelegatesFocus$1);
            }
            break;
    } });
}

const DelegatesFocus = DelegatesFocus$1;
const defineCustomElement = defineCustomElement$1;

export { DelegatesFocus, defineCustomElement };
