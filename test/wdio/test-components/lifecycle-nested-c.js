import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';
import { o as output } from './p-DsmUNt_b.js';

const Cmpc = /*@__PURE__*/ proxyCustomElement(class Cmpc extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    async componentWillLoad() {
        output('componentWillLoad-c');
    }
    componentDidLoad() {
        output('componentDidLoad-c');
    }
    render() {
        return (h(Host, { key: '2390d9b9eeece2dc10780267c69acfb78733add0' }, h("div", { key: '0c51cd7ba3489e72180344a907205e0556f8c6e8' }, "hello")));
    }
}, [1, "lifecycle-nested-c"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["lifecycle-nested-c"];
    components.forEach(tagName => { switch (tagName) {
        case "lifecycle-nested-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), Cmpc);
            }
            break;
    } });
}

const LifecycleNestedC = Cmpc;
const defineCustomElement = defineCustomElement$1;

export { LifecycleNestedC, defineCustomElement };
