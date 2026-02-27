import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const ConditionalRerender = /*@__PURE__*/ proxyCustomElement(class ConditionalRerender extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("main", { key: '8b4e9b6b251159200a2390da31cf5e11c5f64453' }, h("slot", { key: 'c1db7237f3cd4649e8885fceaed1a801365aa884' }), h("nav", { key: '87d28af88316d1053af1ef4c053170bb552a72b7' }, "Nav")));
    }
}, [260, "conditional-rerender"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["conditional-rerender"];
    components.forEach(tagName => { switch (tagName) {
        case "conditional-rerender":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ConditionalRerender);
            }
            break;
    } });
}

export { ConditionalRerender as C, defineCustomElement as d };
