import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const StaticStyles$1 = /*@__PURE__*/ proxyCustomElement(class StaticStyles extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '2508906777174b38610a28d4d7ffc4e0a1818f54' }, h("h1", { key: 'e289b58e29ef5b5fafc5ab29b6e2d0183d3d4488' }, "static get styles()")));
    }
    static get style() { return `h1 {
        color: red;
      }`; }
}, [0, "static-styles"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["static-styles"];
    components.forEach(tagName => { switch (tagName) {
        case "static-styles":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StaticStyles$1);
            }
            break;
    } });
}

const StaticStyles = StaticStyles$1;
const defineCustomElement = defineCustomElement$1;

export { StaticStyles, defineCustomElement };
