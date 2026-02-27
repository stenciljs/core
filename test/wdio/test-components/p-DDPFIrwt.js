import { t as transformTag, p as proxyCustomElement, H, h } from './p-DYdAJnXF.js';
import { p as printLifecycle, d as defineCustomElement$1 } from './p-CHg-J0yO.js';
import { d as defineCustomElement$2 } from './p-aH4AJ7SV.js';

const cmpBCss = () => `${transformTag("cmp-b")}{display:block;padding:10px;background:yellow}`;

const CmpB = /*@__PURE__*/ proxyCustomElement(class CmpB extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    componentWillLoad() {
        printLifecycle('CmpB', 'componentWillLoad');
    }
    componentDidLoad() {
        printLifecycle('CmpB', 'componentDidLoad');
    }
    render() {
        return (h("div", { key: '27667535b686dcef5199b010d6ce7934511785de' }, h("div", { key: 'b4defa515fa30350fb5c4e37ac410957e76235e2' }, "CmpB"), h("cmp-c", { key: 'd03d37a3e17ff8dca3ab65c7efea5c3478a73298' })));
    }
    static get style() { return cmpBCss(); }
}, [0, "cmp-b"]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["cmp-b", "cmp-c", "cmp-d"];
    components.forEach(tagName => { switch (tagName) {
        case "cmp-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CmpB);
            }
            break;
        case "cmp-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
        case "cmp-d":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { CmpB as C, defineCustomElement as d };
