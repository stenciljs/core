import { p as proxyCustomElement, H, h, F as Fragment, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CWXwSQMk.js';

const MyComponent$1 = /*@__PURE__*/ proxyCustomElement(class MyComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Fragment, { key: '2b2e5422d6cc4df8830b5b9dd0b4353e3a232832' }, h("cmp-avatar", { key: 'ff811f7a551731a8e6d8e42acb0ad07de82b95c7' }, this.shortName), h("button", { key: '064cc304744612f6c349885b320835d4e45cdf17', id: "toggle-button", onClick: () => (this.shortName = this.shortName ? null : 'JD') }, "Toggle ShortName")));
    }
}, [2, "my-component", {
        "shortName": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["my-component", "cmp-avatar"];
    components.forEach(tagName => { switch (tagName) {
        case "my-component":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyComponent$1);
            }
            break;
        case "cmp-avatar":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const MyComponent = MyComponent$1;
const defineCustomElement = defineCustomElement$1;

export { MyComponent, defineCustomElement };
