import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const StaticMembersWithSeparateInitializer = /*@__PURE__*/ proxyCustomElement(class StaticMembersWithSeparateInitializer extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("div", { key: '5dcfdb5437f264d1945823da89a6055eb2c611fc' }, "This is a component with static an ", StaticMembersWithSeparateInitializer.property, " member");
    }
}, [0, "static-members-separate-initializer"]);
StaticMembersWithSeparateInitializer.property = 'externally initialized';
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["static-members-separate-initializer"];
    components.forEach(tagName => { switch (tagName) {
        case "static-members-separate-initializer":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StaticMembersWithSeparateInitializer);
            }
            break;
    } });
}

const StaticMembersSeparateInitializer = StaticMembersWithSeparateInitializer;
const defineCustomElement = defineCustomElement$1;

export { StaticMembersSeparateInitializer, defineCustomElement };
