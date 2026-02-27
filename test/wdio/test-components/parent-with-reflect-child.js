import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-DiAB6w1O.js';

const MyComponent = /*@__PURE__*/ proxyCustomElement(class MyComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        // counter to proxy the number of times a render has occurred
        this.renderCount = 0;
    }
    render() {
        this.renderCount += 1;
        return (h("div", { key: '8a870efd10c9827138eef4ce7178170d0eb43f2d' }, h("div", { key: '8e23ffacfea89d86481967992320fa9601bb9cd9' }, "Parent Render Count: ", this.renderCount), h("child-with-reflection", { key: 'f1f1ddf8bb5d14896b59d6cf6813768dceacf002', val: 1 })));
    }
    componentDidUpdate() {
        this.renderCount += 1;
    }
}, [1, "parent-with-reflect-child"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["parent-with-reflect-child", "child-with-reflection"];
    components.forEach(tagName => { switch (tagName) {
        case "parent-with-reflect-child":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyComponent);
            }
            break;
        case "child-with-reflection":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ParentWithReflectChild = MyComponent;
const defineCustomElement = defineCustomElement$1;

export { ParentWithReflectChild, defineCustomElement };
