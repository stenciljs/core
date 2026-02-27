import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const CustomSvgElement$1 = /*@__PURE__*/ proxyCustomElement(class CustomSvgElement extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h("svg", { key: 'f9d54f24198db3071a6a6c469b2cb96cfc3503dc', viewBox: "0 0 54 54" }, h("circle", { key: '2e1ea6b4b08c7ab1b132996c3500767ae3ed75ab', cx: "8", cy: "18", width: "54", height: "8", r: "2" })));
    }
}, [1, "custom-svg-element"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["custom-svg-element"];
    components.forEach(tagName => { switch (tagName) {
        case "custom-svg-element":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CustomSvgElement$1);
            }
            break;
    } });
}

const CustomSvgElement = CustomSvgElement$1;
const defineCustomElement = defineCustomElement$1;

export { CustomSvgElement, defineCustomElement };
