import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-m8uhf9Mc.js';

const ParentReflectNanAttribute$1 = /*@__PURE__*/ proxyCustomElement(class ParentReflectNanAttribute extends H {
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
        return (h("div", { key: '9b093a612436aac8e2a96b46e66287a568067f46' }, h("div", { key: '7afbd95352916d416690b2cbd3a7a33816736178' }, "parent-reflect-nan-attribute Render Count: ", this.renderCount), h("child-reflect-nan-attribute", { key: 'e433f8a8d7fd861a64294bcd3c7a0e862c3e3f84', val: 'I am not a number!!' })));
    }
    componentDidUpdate() {
        // we don't expect the component to update, this will increment the render count in case it does (and should fail
        // the test)
        this.renderCount += 1;
    }
}, [1, "parent-reflect-nan-attribute"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["parent-reflect-nan-attribute", "child-reflect-nan-attribute"];
    components.forEach(tagName => { switch (tagName) {
        case "parent-reflect-nan-attribute":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ParentReflectNanAttribute$1);
            }
            break;
        case "child-reflect-nan-attribute":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const ParentReflectNanAttribute = ParentReflectNanAttribute$1;
const defineCustomElement = defineCustomElement$1;

export { ParentReflectNanAttribute, defineCustomElement };
