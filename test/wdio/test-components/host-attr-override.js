import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const HostAttrOverride$1 = /*@__PURE__*/ proxyCustomElement(class HostAttrOverride extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '837b61defd15837cee6b5fc653119d8c01493188', class: "default", role: "header" }, h("slot", { key: 'b3d1e527b8aadbbe364169cf0b10e58511933d08' })));
    }
}, [257, "host-attr-override"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["host-attr-override"];
    components.forEach(tagName => { switch (tagName) {
        case "host-attr-override":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), HostAttrOverride$1);
            }
            break;
    } });
}

const HostAttrOverride = HostAttrOverride$1;
const defineCustomElement = defineCustomElement$1;

export { HostAttrOverride, defineCustomElement };
