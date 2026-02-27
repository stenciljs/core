import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const TestSvg$1 = /*@__PURE__*/ proxyCustomElement(class TestSvg extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return h("svg", { key: '062dc138e1804e1f71491ece80d3abd5494b7e24' });
    }
}, [1, "test-svg"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["test-svg"];
    components.forEach(tagName => { switch (tagName) {
        case "test-svg":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TestSvg$1);
            }
            break;
    } });
}

const TestSvg = TestSvg$1;
const defineCustomElement = defineCustomElement$1;

export { TestSvg, defineCustomElement };
