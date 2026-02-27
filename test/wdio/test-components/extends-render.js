import { H, h, p as proxyCustomElement, t as transformTag } from './p-DYdAJnXF.js';

const RenderBase = class extends H {
    constructor() {
        super(false);
        // Base class state/props that child can access
        this.baseTitle = 'Base Component';
        this.baseClass = 'base-container';
    }
    /**
     * Base render method that includes:
     * - Template structure with slots
     * - CSS classes
     * - Base content
     */
    render() {
        return (h("div", { class: this.baseClass }, h("header", { class: "base-header" }, h("h1", { class: "base-title" }, this.baseTitle)), h("main", { class: "base-content" }, h("slot", { name: "content" }), h("slot", null)), h("footer", { class: "base-footer" }, h("p", { class: "base-footer-text" }, "Base footer content"))));
    }
};

const RenderCmp = /*@__PURE__*/ proxyCustomElement(class RenderCmp extends RenderBase {
    constructor(registerHost) {
        super(false);
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.componentTitle = 'Extended Component';
        this.additionalContent = 'Additional component content';
    }
    // Override base class properties
    componentWillLoad() {
        this.baseTitle = 'Extended Base Title';
        this.baseClass = 'base-container extended';
    }
    /**
     * Render method that composes parent template with child content
     * Uses super.render() to include base template, then wraps it with additional structure
     */
    render() {
        // Compose parent template (via super.render()) with additional wrapper and content
        return (h("div", { key: '0ba98bf7af31965a3327c656bc52316f3b1d92c9', class: "component-wrapper" }, h("div", { key: '4d532014142dbff823decd91d17ac572aa80bf82', class: "component-header" }, h("h2", { key: 'bc96aca87db6e783441764513a70c647c234615f', class: "component-title" }, this.componentTitle)), super.render(), h("div", { key: 'ae5b63e554c3745e7efca55a71b4ddc0501ccb61', class: "component-additional" }, h("p", { key: '1111f7535374ea687eb621233b6c5b27348ef502', class: "additional-content" }, this.additionalContent))));
    }
}, [512, "extends-render", {
        "componentTitle": [32],
        "additionalContent": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["extends-render"];
    components.forEach(tagName => { switch (tagName) {
        case "extends-render":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), RenderCmp);
            }
            break;
    } });
}

const ExtendsRender = RenderCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsRender, defineCustomElement };
