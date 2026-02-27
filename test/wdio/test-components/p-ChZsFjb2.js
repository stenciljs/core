import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpLevel3Css = () => `.sc-cmp-level-3-h{padding:8px}`;

const CmpLevel3 = /*@__PURE__*/ proxyCustomElement(class CmpLevel3 extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '8b339304b1357075b5c6562c7aff503020a77f0b' }, h("slot", { key: 'f779cecd76881e576b95aa392086311fbde7bcb3' }, "DEFAULT")));
    }
    static get style() { return cmpLevel3Css(); }
}, [262, "cmp-level-3"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-level-3"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-level-3":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpLevel3);
            }
            break;
    } });
}

export { CmpLevel3 as C, defineCustomElement as d };
