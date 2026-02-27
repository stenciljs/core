import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const pageListItemCss = () => `:host{display:block}`;

const MyOtherComponent = /*@__PURE__*/ proxyCustomElement(class MyOtherComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        /**
         * Set the number to be displayed.
         */
        this.active = false;
    }
    render() {
        const paginationItemClass = {
            'pagination-item': true,
            active: this.active,
        };
        return (h("div", { key: 'f499aadbc5eab8b244de2d20759b319a0c316394' }, h("div", { key: 'cc8598145068837200ca5006a416e0928699026e', class: paginationItemClass }, this.label)));
    }
    static get style() { return pageListItemCss(); }
}, [1, "page-list-item", {
        "label": [2],
        "active": [4]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["page-list-item"];
    components.forEach(tagName => { switch (tagName) {
        case "page-list-item":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyOtherComponent);
            }
            break;
    } });
}

export { MyOtherComponent as M, defineCustomElement as d };
