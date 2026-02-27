import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';

const createAndAppendElement = (text) => {
    const p = document.createElement(transformTag('p'));
    p.textContent = text;
    document.body.appendChild(p);
};

const CustomElementsHierarchyLifecycleChild = /*@__PURE__*/ proxyCustomElement(class CustomElementsHierarchyLifecycleChild extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async componentDidLoad() {
        createAndAppendElement('DID LOAD CHILD');
        return Promise.resolve();
    }
    render() {
        return h("p", { key: '949a2ed93e7bb0972a4f8e39f011261247941a67' }, "CHILD CONTENT");
    }
}, [1, "custom-elements-hierarchy-lifecycle-child"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-elements-hierarchy-lifecycle-child"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-elements-hierarchy-lifecycle-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomElementsHierarchyLifecycleChild);
            }
            break;
    } });
}

export { CustomElementsHierarchyLifecycleChild as C, createAndAppendElement as c, defineCustomElement as d };
