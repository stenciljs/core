import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const StaticMembers$1 = /*@__PURE__*/ proxyCustomElement(class StaticMembers extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'b8c00f0b022ce41123c2613cd6428327c4f58905' }, "This is a component with static ", StaticMembers.property, " and ", StaticMembers.anotherProperty, " members"));
    }
}, [0, "static-members"]);
/**
 * See the spec file associated with this file for the motivation for this test
 */
StaticMembers$1.property = 'public';
StaticMembers$1.anotherProperty = 'private';
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["static-members"];
    components.forEach(tagName => { switch (tagName) {
        case "static-members":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StaticMembers$1);
            }
            break;
    } });
}

const StaticMembers = StaticMembers$1;
const defineCustomElement = defineCustomElement$1;

export { StaticMembers, defineCustomElement };
