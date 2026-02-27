import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const StaticDecoratedMembers$1 = /*@__PURE__*/ proxyCustomElement(class StaticDecoratedMembers extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return h("div", { key: '400bf2f78ffaff3a9c123ec9abcae1b6f56cbda2' }, "This is a component with a static Stencil decorated member");
    }
}, [0, "static-decorated-members", {
        "property": [32]
    }]);
/**
 * See the spec file associated with this file for the motivation for this test
 */
StaticDecoratedMembers$1.property = '@State-ful';
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["static-decorated-members"];
    components.forEach(tagName => { switch (tagName) {
        case "static-decorated-members":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StaticDecoratedMembers$1);
            }
            break;
    } });
}

const StaticDecoratedMembers = StaticDecoratedMembers$1;
const defineCustomElement = defineCustomElement$1;

export { StaticDecoratedMembers, defineCustomElement };
