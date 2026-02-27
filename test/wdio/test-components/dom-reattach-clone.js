import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const DomReattachClone$1 = /*@__PURE__*/ proxyCustomElement(class DomReattachClone extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h("div", { key: 'a993fed193b456321c5cdee282888e5086a68139', class: "wrapper" }, h("span", { key: '49e189016917652a9c25238c06938b5e1cb2338a', class: "component-mark-up" }, "Component mark-up"), h("slot", { key: '891fc61acb935ab7e1784ef57337f3fe975c2a0a' })));
    }
}, [262, "dom-reattach-clone"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["dom-reattach-clone"];
    components.forEach(tagName => { switch (tagName) {
        case "dom-reattach-clone":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), DomReattachClone$1);
            }
            break;
    } });
}

const DomReattachClone = DomReattachClone$1;
const defineCustomElement = defineCustomElement$1;

export { DomReattachClone, defineCustomElement };
