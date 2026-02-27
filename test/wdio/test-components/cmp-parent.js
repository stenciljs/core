import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './cmp-child-fail.js';

const CmpParent$1 = /*@__PURE__*/ proxyCustomElement(class CmpParent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '26f6c6adfea46d492fd46a24b081e1e0ccd5fa61' }, h("div", { key: 'd1af4c56fbd5dcb6a598cda23bcfeb7feb44dc56', class: "parent-content" }, "Parent Loaded"), h("cmp-child-fail", { key: 'a1246229a84ced2456e53f16dde0b62dfd4c8d1f' })));
    }
}, [0, "cmp-parent"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-parent", "cmp-child-fail"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpParent$1);
            }
            break;
        case "cmp-child-fail":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const CmpParent = CmpParent$1;
const defineCustomElement = defineCustomElement$1;

export { CmpParent, defineCustomElement };
