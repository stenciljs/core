import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const sharedDelegatesFocusCss = () => `:host{display:block;border:5px solid red;padding:10px;margin:10px}:host(:focus){border:5px solid green}input{display:block;width:100%}`;

const CustomElementsNoDelegatesFocus$1 = /*@__PURE__*/ proxyCustomElement(class CustomElementsNoDelegatesFocus extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: 'b02867203b4b64f4f4c1819ed89426dbd18535f0' }, h("input", { key: '18c798e4dd8ec6520a5b481ed91638e4d97a8e81' })));
    }
    static get style() { return sharedDelegatesFocusCss(); }
}, [1, "custom-elements-no-delegates-focus"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-elements-no-delegates-focus"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-elements-no-delegates-focus":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementsNoDelegatesFocus$1);
            }
            break;
    } });
}

const CustomElementsNoDelegatesFocus = CustomElementsNoDelegatesFocus$1;
const defineCustomElement = defineCustomElement$1;

export { CustomElementsNoDelegatesFocus, defineCustomElement };
