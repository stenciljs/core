import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';
import { d as defineCustomElement$2 } from './p-CTNlrM4F.js';

const pageListCss = () => `:host{display:block}`;

const PatternlibPagination = /*@__PURE__*/ proxyCustomElement(class PatternlibPagination extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
        this.lastPage = null;
        this.pages = [];
    }
    fillPageArray(start, num) {
        const pages = [];
        for (let i = 0; i < num; i++) {
            pages.push(start + i);
        }
        return pages;
    }
    componentWillLoad() {
        // range guard
        this.lastPage = this.lastPage && this.lastPage >= 1 ? this.lastPage : 1;
        this.pages = this.fillPageArray(0, this.lastPage);
    }
    render() {
        return (h("div", { key: '52772752e8361614561bb0acb7bda65c8ea3a2d0' }, h("div", { key: '6c65f367e03f7ba8105f2c210d75c2028678e869', class: "pagination" }, h("div", { key: '800e8da6a0ee80a9010b38167c809efb83998700', class: "pagination-pages pagination-notation" }, this.pages.map((i) => (h("page-list-item", { label: i })))))));
    }
    static get style() { return pageListCss(); }
}, [1, "page-list", {
        "lastPage": [1026, "last-page"],
        "pages": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["page-list", "page-list-item"];
    components.forEach(tagName => { switch (tagName) {
        case "page-list":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), PatternlibPagination);
            }
            break;
        case "page-list-item":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const PageList = PatternlibPagination;
const defineCustomElement = defineCustomElement$1;

export { PageList, defineCustomElement };
