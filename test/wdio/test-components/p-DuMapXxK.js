import { p as proxyCustomElement, H, h, F as Fragment, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$1 } from './p-B-Rsn2jP.js';

const Parent = /*@__PURE__*/ proxyCustomElement(class Parent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Fragment, { key: '62f2924cef4812812cf6f9257cf574d5a6481de6' }, h("label", { key: '6f66e1420c0f868b50ccc7c64d1afa47721909f9' }, h("slot", { key: 'adb27265fbee13c4760e0492726a24e7478febca', name: "label" })), h("ion-child", { key: '3857555491255c09c3dbc9e7439b5d93f281b17e' }, h("slot", { key: '1462133d2114152bf35ce9c1b0f63f9996806330', name: "suffix", slot: "suffix" })), h("slot", { key: 'd5b3e362734c1a73a9b5cc2fb81c725d1449716f', name: "message" })));
    }
}, [262, "ion-parent"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-parent", "ion-child"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-parent":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Parent);
            }
            break;
        case "ion-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { Parent as P, defineCustomElement as d };
