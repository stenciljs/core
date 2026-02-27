import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const SlotNestedDefaultOrderChild = /*@__PURE__*/ proxyCustomElement(class SlotNestedDefaultOrderChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '1c734c63004ad484ef86627f513f08d09ceae4df' }, h("div", { key: '2cd3c568e72a19b4911ef291355025d5d83d2330' }, "State: ", this.state.toString()), h("slot", { key: 'c6a6ff1aeb459b81f7706d0a6222f65aa1a0faaf' })));
    }
}, [260, "slot-nested-default-order-child", {
        "state": [4]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-nested-default-order-child"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-nested-default-order-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotNestedDefaultOrderChild);
            }
            break;
    } });
}

export { SlotNestedDefaultOrderChild as S, defineCustomElement as d };
