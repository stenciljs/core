import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const cmpRootCss = () => `div#relativeToRoot{background-image:url("/assets/favicon.ico?relativeToRoot")}div#relative{background-image:url("../assets/favicon.ico?relative")}div#absolute{background-image:url("https://www.google.com/favicon.ico")}`;

const InitCssRoot$1 = /*@__PURE__*/ proxyCustomElement(class InitCssRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return [h("div", { key: 'bf8f92d06fcb3d5e6907375ecf17fcb7174c125b', id: "relative" }), h("div", { key: '0e201878f8e902b145ddfb24f43ec62652dd1355', id: "relativeToRoot" }), h("div", { key: '6bc497cc03dad2f27bfe30491e817be919037a5d', id: "absolute" })];
    }
    static get style() { return cmpRootCss(); }
}, [0, "init-css-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["init-css-root"];
    components.forEach(tagName => { switch (tagName) {
        case "init-css-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), InitCssRoot$1);
            }
            break;
    } });
}

const InitCssRoot = InitCssRoot$1;
const defineCustomElement = defineCustomElement$1;

export { InitCssRoot, defineCustomElement };
