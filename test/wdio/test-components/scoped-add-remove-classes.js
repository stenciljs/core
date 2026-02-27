import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const AddRemoveClasses = /*@__PURE__*/ proxyCustomElement(class AddRemoveClasses extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.handleItemClick = (item) => {
            this.selectedItems = [item.id];
        };
    }
    render() {
        return (h("div", { key: '1576d93b1a9ef9583c0f01cea97a1bc5f41d3eae', class: "menu" }, this.items.map((item) => (h("div", { class: {
                'menu-item': true,
                'menu-selected': this.selectedItems.includes(item.id),
            }, onClick: () => this.handleItemClick(item) }, item.label)))));
    }
    static get style() { return `.menu-item.sc-scoped-add-remove-classes {
      padding: 8px 16px;
      cursor: pointer;
    }
    .menu-selected.sc-scoped-add-remove-classes {
      background-color: #d17e7e;
    }`; }
}, [2, "scoped-add-remove-classes", {
        "selectedItems": [1040],
        "items": [16]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["scoped-add-remove-classes"];
    components.forEach(tagName => { switch (tagName) {
        case "scoped-add-remove-classes":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AddRemoveClasses);
            }
            break;
    } });
}

const ScopedAddRemoveClasses = AddRemoveClasses;
const defineCustomElement = defineCustomElement$1;

export { ScopedAddRemoveClasses, defineCustomElement };
