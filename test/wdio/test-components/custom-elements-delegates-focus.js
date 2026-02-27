import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const sharedDelegatesFocusCss = () => `:host{display:block;border:5px solid red;padding:10px;margin:10px}:host(:focus){border:5px solid green}input{display:block;width:100%}`;

const CustomElementsDelegatesFocus$1 = /*@__PURE__*/ proxyCustomElement(class CustomElementsDelegatesFocus extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '5307ee9300c9a5047d62042edd479eb5d4715f1e' }, h("input", { key: '2535a718e3b9804230eb77a73299700d7bf39d63' })));
    }
    static get delegatesFocus() { return true; }
    static get style() { return sharedDelegatesFocusCss(); }
}, [17, "custom-elements-delegates-focus"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-elements-delegates-focus"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-elements-delegates-focus":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementsDelegatesFocus$1);
            }
            break;
    } });
}

const CustomElementsDelegatesFocus = CustomElementsDelegatesFocus$1;
const defineCustomElement = defineCustomElement$1;

export { CustomElementsDelegatesFocus, defineCustomElement };
