import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotNoDefault$1 = /*@__PURE__*/ proxyCustomElement(class SlotNoDefault extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '7db2b56fb37d78885de00456b89de966d5666f50' }, h("slot", { key: '35ee07abf7d20d9548ad2a778a27a0dc1bca745a', name: "a-slot-name" }), h("section", { key: '8966299ceb79814beca14a66f0a6a89792df6855' }, h("slot", { key: 'c3caad2122ff2839194982233c3a74e190e72f17', name: "footer-slot-name" })), h("div", { key: '316ce512359228f385c1166e8e5ca38ddfe34516' }, h("article", { key: '5e09d047f5e0dad1ea1a5a93f68a456e99df62aa' }, h("slot", { key: '3aa950b0a64e18d3ddc4238c0c3e36a81433530a', name: "nav-slot-name" })))));
    }
}, [260, "slot-no-default"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-no-default"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-no-default":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNoDefault$1);
            }
            break;
    } });
}

const SlotNoDefault = SlotNoDefault$1;
const defineCustomElement = defineCustomElement$1;

export { SlotNoDefault, defineCustomElement };
