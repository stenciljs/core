import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-Inrdy3KW.js';

const AttributeBasicRoot$1 = /*@__PURE__*/ proxyCustomElement(class AttributeBasicRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        this.url = new URL(window.location.href);
    }
    testClick() {
        const cmp = this.el.querySelector(`${transformTag("attribute-basic")}`);
        cmp.setAttribute('single', 'single-update');
        cmp.setAttribute('multi-word', 'multiWord-update');
        cmp.setAttribute('my-custom-attr', 'my-custom-attr-update');
        cmp.setAttribute('getter', 'getter-update');
    }
    render() {
        return (h("div", { key: 'd6d1377fd4dc199fcdb12566955099bd4df4d813' }, h("button", { key: 'a23fdb5029a9d5fdc369a3b4ea1e2ada47feeb04', onClick: this.testClick.bind(this) }, "Test"), h("attribute-basic", { key: 'ec451c80ba3e892fe7a137291712ed13ef71b8f9' }), h("div", { key: 'a62acbb134107a4a88d98eaad31208f080dc573f' }, "hostname: ", this.url.hostname, ", pathname: ", this.url.pathname)));
    }
    get el() { return this; }
}, [0, "attribute-basic-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["attribute-basic-root", "attribute-basic"];
    components.forEach(tagName => { switch (tagName) {
        case "attribute-basic-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AttributeBasicRoot$1);
            }
            break;
        case "attribute-basic":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const AttributeBasicRoot = AttributeBasicRoot$1;
const defineCustomElement = defineCustomElement$1;

export { AttributeBasicRoot, defineCustomElement };
