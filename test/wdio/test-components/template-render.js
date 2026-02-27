import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const TemplateRender$1 = /*@__PURE__*/ proxyCustomElement(class TemplateRender extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.items = ['Item 1', 'Item 2', 'Item 3'];
        this.addItem = () => {
            this.items = [...this.items, `Item ${this.items.length + 1}`];
        };
    }
    render() {
        return (h("div", { key: '05b37ee61e7d4eea04d53bc97a7a2101d985a445' }, h("h1", { key: '2b8f6e60003aac2193d9e8c6d8ecf4de4642ed98' }, "Template Element Test"), h("template", { key: 'ac5151f9b10897ca068807caff267189818dba02', id: "simple-template" }, h("p", { key: 'c48a4740176ed0394a6736bff36ae9b53eae56bb', class: "template-content" }, "This is template content")), h("template", { key: '547f6c3eed383c6952c05fa0d5e225168b48a2e6', id: "nested-template" }, h("div", { key: 'e55ae5504164e5b9584e3a94c37a3c8b7c958251', class: "container" }, h("h2", { key: '5b692c5ef137fef1f36d1fb4e9bb9fbad1e76d34' }, "Nested Template"), h("p", { key: '8ed129a37618db44ce4d9efde38572a4ded6b898' }, "With multiple children"), h("span", { key: 'ac617f5665b0ac6b70cb9ebb4e9a7aeeb6ce36ed' }, "And different tags"))), h("template", { key: '48178ef069eaa08d830201866aee278eeab3eb8d', id: "list-template" }, h("li", { key: 'a7a860e424bc37e59196250f3560c90483c7bbdd', class: "list-item" }, h("span", { key: 'deceb94911e4406e3a8cf34b1fbe4d3f8243e8d3', class: "item-text" }, "Placeholder"))), h("div", { key: '2dd00cfa2797176f50c61ce7b7c5aae4ef6bc120' }, h("button", { key: '7eddfd23f33703ff0c5cc7bf7f571222771b4de2', id: "add-item", onClick: this.addItem }, "Add Item"), h("ul", { key: 'b010341fa2ae9c784aaaf21d82611b4ef6d04985', id: "item-list" }, this.items.map((item) => (h("li", { key: item }, item))))), h("div", { key: '103f84b96316de2507e42d6003e8ac21ed8d1774', id: "cloned-container" })));
    }
}, [1, "template-render", {
        "items": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["template-render"];
    components.forEach(tagName => { switch (tagName) {
        case "template-render":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TemplateRender$1);
            }
            break;
    } });
}

const TemplateRender = TemplateRender$1;
const defineCustomElement = defineCustomElement$1;

export { TemplateRender, defineCustomElement };
