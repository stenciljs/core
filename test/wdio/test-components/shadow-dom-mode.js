import { p as proxyCustomElement, H, i as getMode, h, t as transformTag } from './p-DYdAJnXF.js';

const modeBlueCss = () => `:host{display:block;padding:100px;background:blue;color:white;font-weight:bold;font-size:32px}`;

const modeRedCss = () => `:host{display:block;padding:100px;background:red;color:white;font-weight:bold;font-size:32px}`;

const ShadowDomMode$1 = /*@__PURE__*/ proxyCustomElement(class ShadowDomMode extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.mode = getMode(this);
    }
    render() {
        return h("div", { key: '2b4a44707abdac81bf26adcb70aa108902f21020' }, this.mode);
    }
    static get style() { return {
        blue: modeBlueCss(),
        red: modeRedCss()
    }; }
}, [33, "shadow-dom-mode"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["shadow-dom-mode"];
    components.forEach(tagName => { switch (tagName) {
        case "shadow-dom-mode":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), ShadowDomMode$1);
            }
            break;
    } });
}

const ShadowDomMode = ShadowDomMode$1;
const defineCustomElement = defineCustomElement$1;

export { ShadowDomMode, defineCustomElement };
