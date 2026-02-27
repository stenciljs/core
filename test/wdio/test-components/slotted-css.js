import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const cmpCss = () => `:host{display:inline-flex;border:2px dashed gray;padding:2px}.content ::slotted(*){background-color:rgb(0, 255, 0)}::slotted(:not([slot="header-slot-name"])){border:4px solid rgb(0, 0, 255);color:rgb(0, 0, 255);font-weight:bold}::slotted([slot="header-slot-name"]){border:4px solid rgb(255, 0, 0);color:rgb(255, 0, 0);font-weight:bold}::slotted(*){margin:8px;padding:8px}`;

const SlottedCss$1 = /*@__PURE__*/ proxyCustomElement(class SlottedCss extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: '2314fed1292edb2410dcd7c49cb24fd044c27784' }, h("section", { key: 'a3ca482439e5a6bc6231878d55a3069f40328cd4' }, h("header", { key: 'ac66ce799dd571e9c7932475e3b0007167d4f9cf' }, h("slot", { key: 'f67fa6749d76b8a4091062c0c3a75f712b852dd0', name: "header-slot-name" })), h("section", { key: '63a7d849d650a7a0ce1bf0585719fb61cde20b06', class: "content" }, h("slot", { key: '21bbab2805787c3ac8e56e04b334063e4e2f99eb' })), h("footer", { key: 'fe2fccf36d3a99f8f047f2f1a77576c187f4273c' }, h("slot", { key: '139d51aacefd097a41edd523bc1b43688f20e404', name: "footer-slot-name" })))));
    }
    static get style() { return cmpCss(); }
}, [257, "slotted-css"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slotted-css"];
    components.forEach(tagName => { switch (tagName) {
        case "slotted-css":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlottedCss$1);
            }
            break;
    } });
}

const SlottedCss = SlottedCss$1;
const defineCustomElement = defineCustomElement$1;

export { SlottedCss, defineCustomElement };
