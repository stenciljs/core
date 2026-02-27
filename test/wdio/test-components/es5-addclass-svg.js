import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SvgAddClass = /*@__PURE__*/ proxyCustomElement(class SvgAddClass extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("div", { key: '5287a21a16c76d3737140c71afc2af71ded019c1' }, h("svg", { key: '90bd0421b311406ebe0e2acc1b52b73d795684e9', viewBox: "0 0 8 8", class: "existing-css-class" }, h("circle", { key: '487356c2268828eb43650ead361b57e0e13ab6a7', cx: "2", cy: "2", width: "64", height: "64", r: "2" }))));
    }
}, [1, "es5-addclass-svg"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["es5-addclass-svg"];
    components.forEach(tagName => { switch (tagName) {
        case "es5-addclass-svg":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SvgAddClass);
            }
            break;
    } });
}

const Es5AddclassSvg = SvgAddClass;
const defineCustomElement = defineCustomElement$1;

export { Es5AddclassSvg, defineCustomElement };
