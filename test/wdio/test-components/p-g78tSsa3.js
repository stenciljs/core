import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpTextGreenCss = () => `.sc-cmp-text-green-h{display:block;border:10px solid rgb(0, 0, 255);margin:10px;padding:10px;background-color:white}text-green.sc-cmp-text-green{display:block;color:rgb(0, 255, 0);font-weight:bold}`;

const CmpTextGreen = /*@__PURE__*/ proxyCustomElement(class CmpTextGreen extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("text-green", { key: 'efad2abe18c4d174d2146ca8bdec33c300391556' }, "green text, blue border");
    }
    static get style() { return cmpTextGreenCss(); }
}, [2, "cmp-text-green"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-text-green"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-text-green":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpTextGreen);
            }
            break;
    } });
}

export { CmpTextGreen as C, defineCustomElement as d };
