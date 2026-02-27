import { p as proxyCustomElement, H, h, B as Build, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const BuildData$1 = /*@__PURE__*/ proxyCustomElement(class BuildData extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: 'eefdee9586077317d7d032508bd3ff4f78f59996' }, h("p", { key: '5eb82101c630da5eff4e166a3467ab58f389b832', class: "is-dev" }, "isDev: ", `${Build.isDev}`), h("p", { key: 'f3660799f4c884bbf32b32874a0b608a59f37ea4', class: "is-browser" }, "isBrowser: ", `${Build.isBrowser}`), h("p", { key: '7061567c98f14dd5a846b3937e42e0afb3a27b3c', class: "is-testing" }, "isTesting: ", `${Build.isTesting}`)));
    }
}, [0, "build-data"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["build-data"];
    components.forEach(tagName => { switch (tagName) {
        case "build-data":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), BuildData$1);
            }
            break;
    } });
}

const BuildData = BuildData$1;
const defineCustomElement = defineCustomElement$1;

export { BuildData, defineCustomElement };
