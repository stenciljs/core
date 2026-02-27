import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const AngularSlotBinding = /*@__PURE__*/ proxyCustomElement(class AngularSlotBinding extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'c99a2d865d9adb9a9635c0b446b94b8c02cb82c3' }, h("slot", { key: '3d81357b1e89e3ea493fdb881d870508d6271652' })));
    }
}, [260, "slot-ng-if"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-ng-if"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-ng-if":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AngularSlotBinding);
            }
            break;
    } });
}

const SlotNgIf = AngularSlotBinding;
const defineCustomElement = defineCustomElement$1;

export { SlotNgIf, defineCustomElement };
