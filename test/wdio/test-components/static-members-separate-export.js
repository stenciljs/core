import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const StaticMembersWithSeparateExport = /*@__PURE__*/ proxyCustomElement(class StaticMembersWithSeparateExport extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: '5bb793e289e85c6cbd6d74c4c7595743f1054144' }, "This is a component with static ", StaticMembersWithSeparateExport.property, " and", ' ', StaticMembersWithSeparateExport.anotherProperty, " members"));
    }
}, [0, "static-members-separate-export"]);
/**
 * See the spec file associated with this file for the motivation for this test
 */
StaticMembersWithSeparateExport.property = 'public';
StaticMembersWithSeparateExport.anotherProperty = 'private';
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["static-members-separate-export"];
    components.forEach(tagName => { switch (tagName) {
        case "static-members-separate-export":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), StaticMembersWithSeparateExport);
            }
            break;
    } });
}

const StaticMembersSeparateExport = StaticMembersWithSeparateExport;
const defineCustomElement = defineCustomElement$1;

export { StaticMembersSeparateExport, defineCustomElement };
