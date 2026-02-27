import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpTextBlueCss = () => `.sc-cmp-text-blue-h{display:block;border:10px solid rgb(0, 255, 0);margin:10px;padding:10px;background-color:white}text-blue.sc-cmp-text-blue{display:block;color:rgb(0, 0, 255);font-weight:bold}`;

const CmpTextBlue = /*@__PURE__*/ proxyCustomElement(class CmpTextBlue extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("text-blue", { key: 'c620a2f75bcb268916a089d5a8b9619d91244730' }, "blue text, green border");
    }
    static get style() { return cmpTextBlueCss(); }
}, [2, "cmp-text-blue"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-text-blue"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-text-blue":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpTextBlue);
            }
            break;
    } });
}

export { CmpTextBlue as C, defineCustomElement as d };
