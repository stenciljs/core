import { p as proxyCustomElement, H, t as transformTag, h } from './p-DYdAJnXF.js';

const TagTransformChild = /*@__PURE__*/ proxyCustomElement(class TagTransformChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.message = 'Hello from Child';
    }
    async closestParentTag() {
        return this.el.closest(`${transformTag("parent-tag-transform")}`);
    }
    render() {
        return (h("div", { key: 'f883dddbb1023f8e4eb2f88cebd587bf4302d341' }, h("h2", { key: '14f7f6043deeb8b84a20ee0be461bf984514d8ea' }, "Child Component"), h("slot", { key: '1665395341704e330ee6627e7a6cc7ce423585a5' })));
    }
    get el() { return this; }
    static get style() { return `${transformTag("child-tag-transform")} {
      display: block;
      padding: 10px;
      margin: 5px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #f0f0f0;
    }

    ${transformTag("child-tag-transform")}.active {
      border-color: #007acc;
      background: #e6f2ff;
    }

    ${transformTag("child-tag-transform")}:hover {
      background: #d0e7ff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }`; }
}, [260, "child-tag-transform", {
        "message": [1],
        "closestParentTag": [64]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["child-tag-transform"];
    components.forEach(tagName => { switch (tagName) {
        case "child-tag-transform":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), TagTransformChild);
            }
            break;
    } });
}

export { TagTransformChild as T, defineCustomElement as d };
