import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const location$1 = 'module.js';

const location = 'module/index.js';

const NodeResolution$1 = /*@__PURE__*/ proxyCustomElement(class NodeResolution extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '224edb3448224448512d2083d0cdc19933d3ba92' }, h("h1", { key: '4bd5c48e2bf14fd7b52b4c3a2313d9db7923c53c' }, "node-resolution"), h("p", { key: 'ec8cf5dab391b3eb67d91d496292c68645253238', id: "module-index" }, location), h("p", { key: '363903e14abf7874225cd89f0dbb1d04e72af127', id: "module" }, location$1)));
    }
}, [0, "node-resolution"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["node-resolution"];
    components.forEach(tagName => { switch (tagName) {
        case "node-resolution":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), NodeResolution$1);
            }
            break;
    } });
}

const NodeResolution = NodeResolution$1;
const defineCustomElement = defineCustomElement$1;

export { NodeResolution, defineCustomElement };
