import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$3 } from './p-B-Rsn2jP.js';
import { d as defineCustomElement$2 } from './p-DuMapXxK.js';

const Host = /*@__PURE__*/ proxyCustomElement(class Host extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '9c6c05bab43b371d77e3171954ce6ea5867918c3' }, h("ion-parent", { key: '566320548ccbd4dc3960b54324746ee6bf508803' }, h("slot", { key: '57fa2b6dd9508dc0d793eeef175ef163a9b76480', name: "label", slot: "label" }), h("slot", { key: 'dc41f8b9866dea054fcfb5df4952bc37adf19b97', name: "suffix", slot: "suffix" }), h("slot", { key: '9a615f08a6c0c3f6bec8f921f3d511e2ab5c151a', name: "message", slot: "message" }))));
    }
}, [262, "ion-host"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-host", "ion-child", "ion-parent"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-host":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Host);
            }
            break;
        case "ion-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "ion-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const IonHost = Host;
const defineCustomElement = defineCustomElement$1;

export { IonHost, defineCustomElement };
