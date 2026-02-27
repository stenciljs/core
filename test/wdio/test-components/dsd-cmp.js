import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const DsdComponent = /*@__PURE__*/ proxyCustomElement(class DsdComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        const env = globalThis.constructor.name === 'MockWindow' ? 'Server' : 'Client';
        return h("div", { key: '8781e64410c22d9fdfb56bcc08951b9df4c4c79d' }, "I am rendered on the ", env, "!");
    }
}, [1, "dsd-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dsd-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "dsd-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DsdComponent);
            }
            break;
    } });
}

const DsdCmp = DsdComponent;
const defineCustomElement = defineCustomElement$1;

export { DsdCmp, defineCustomElement };
