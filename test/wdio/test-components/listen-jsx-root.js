import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CLH88Mj5.js';

const AttributeBasicRoot = /*@__PURE__*/ proxyCustomElement(class AttributeBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.wasClicked = '';
        this.onClick = () => {
            this.wasClicked = 'Parent event';
        };
    }
    render() {
        return [h("span", { key: 'ff14e642b12353e0e0dcb4abb521b3eeab37df1e', id: "result-root" }, this.wasClicked), h("listen-jsx", { key: '1d1d1ff3960878a2f08c19719303ad5f294e6f47', onClick: this.onClick })];
    }
}, [0, "listen-jsx-root", {
        "wasClicked": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["listen-jsx-root", "listen-jsx"];
    components.forEach(tagName => { switch (tagName) {
        case "listen-jsx-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBasicRoot);
            }
            break;
        case "listen-jsx":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ListenJsxRoot = AttributeBasicRoot;
const defineCustomElement = defineCustomElement$1;

export { ListenJsxRoot, defineCustomElement };
