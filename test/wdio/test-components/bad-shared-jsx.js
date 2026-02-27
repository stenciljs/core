import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const BadSharedJSX = /*@__PURE__*/ proxyCustomElement(class BadSharedJSX extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        const sharedNode = h("div", { key: 'c52e0282ca2988c0060183f44265dc58d80617cf' }, "Do Not Share JSX Nodes!");
        return (h("div", { key: '28706be86466640e45115126cd9e97c28c70f62e' }, sharedNode, sharedNode));
    }
}, [0, "bad-shared-jsx"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["bad-shared-jsx"];
    components.forEach(tagName => { switch (tagName) {
        case "bad-shared-jsx":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), BadSharedJSX);
            }
            break;
    } });
}

const BadSharedJsx = BadSharedJSX;
const defineCustomElement = defineCustomElement$1;

export { BadSharedJsx, defineCustomElement };
