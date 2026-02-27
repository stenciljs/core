import { H, h, t as transformTag, p as proxyCustomElement } from './index.js';

const RenderBase = class extends H {
    constructor() {
        super(false);
    }
    // Base class state/props that child can access
    baseTitle = 'Base Component';
    baseClass = 'base-container';
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
    }
    componentTitle = 'Extended Component';
    additionalContent = 'Additional component content';
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
        return (h("div", { key: 'dcdda75a38f9da3d40efc43e884b95b3caafe151', class: "component-wrapper" }, h("div", { key: '4e16e42cc9394f1a079a01f03cad46533a6c266e', class: "component-header" }, h("h2", { key: '33fe8c5a1e65da16e6c08d7160e7f32f51ecaf09', class: "component-title" }, this.componentTitle)), super.render(), h("div", { key: '934220a735c39ed93dcde5338edcfc313732008a', class: "component-additional" }, h("p", { key: 'a16d9b96b7e203a902e29c0f0430baccf9ee7e29', class: "additional-content" }, this.additionalContent))));
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
            if (!customElements.get(transformTag(tagName))) {
                customElements.define(transformTag(tagName), RenderCmp);
            }
            break;
    } });
}
defineCustomElement$1();

const ExtendsRender = RenderCmp;
const defineCustomElement = defineCustomElement$1;

export { ExtendsRender, defineCustomElement };
//# sourceMappingURL=extends-render.js.map

//# sourceMappingURL=extends-render.js.map