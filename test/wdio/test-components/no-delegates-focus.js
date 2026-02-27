import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const delegatesFocusCss = () => `:host{display:block;border:5px solid red;padding:10px;margin:10px}input{display:block;width:100%}:host(:focus){border:5px solid blue}`;

const DelegatesFocus = /*@__PURE__*/ proxyCustomElement(class DelegatesFocus extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '891280731836b280aba0e72554a01b7511a624c4' }, h("input", { key: '3ac46b43daac4fd69a2f8aaf1a23ac47aad1edc9' })));
    }
    static get style() { return delegatesFocusCss(); }
}, [1, "no-delegates-focus"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["no-delegates-focus"];
    components.forEach(tagName => { switch (tagName) {
        case "no-delegates-focus":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DelegatesFocus);
            }
            break;
    } });
}

const NoDelegatesFocus = DelegatesFocus;
const defineCustomElement = defineCustomElement$1;

export { NoDelegatesFocus, defineCustomElement };
