import { t as transformTag, p as proxyCustomElement, H, h, d as Host } from './p-DYdAJnXF.js';
import { d as defineCustomElement$7 } from './p-Dj8mA2Pf.js';
import { d as defineCustomElement$6 } from './p-DDPFIrwt.js';
import { d as defineCustomElement$5 } from './p-aH4AJ7SV.js';
import { d as defineCustomElement$4 } from './p-CHg-J0yO.js';
import { d as defineCustomElement$3 } from './p-BeCJGTGd.js';
import { d as defineCustomElement$2 } from './p-Dl8ANRrd.js';

const appRootCss = () => `${transformTag("app-root")}{display:block;padding:10px;background:blue}.server{padding:10px;background:darkorange}.client{padding:10px;background:cyan}`;

const AppRoot$1 = /*@__PURE__*/ proxyCustomElement(class AppRoot extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
    }
    render() {
        return (h(Host, { key: '9ac2dd29f1a6f9bbf0ca08ba6d63049aff43dd91' }, h("cmp-a", { key: 'f720c4fb4a13b96897289329cf563c19bca55abe' }, h("cmp-d", { key: '476010b46e5ad890c575de17b37a08902ffd2d0d', uniqueId: "a1-child" }), h("cmp-d", { key: 'f2addf8df1b1c5fc35b6792115c86525b5fa3540', uniqueId: "a2-child" }), h("cmp-d", { key: 'fad883894a2c37ef2facd36a4a843509da18ef4c', uniqueId: "a3-child" }), h("cmp-d", { key: '48db4ac69537d6e8c219fbe6110317c794c29c0b', uniqueId: "a4-child" })), h("div", { key: '36dd1a00c90ae85722996755ba555434b95306d8', class: "server" }, h("div", { key: 'abb323da1ebab2ca1d218a1c7604b49b7815764d', id: "server-componentWillLoad" }), h("div", { key: 'a596e377bb1ddf58d1c6b5685aa891a368f94798', id: "server-componentDidLoad" })), h("div", { key: 'de727c8e4b99ece215a3d623ea557f84d6174352', class: "client" }, h("div", { key: '1df7e1625d9a7f9256a4029c01d9f3404d73f0d1', id: "client-componentWillLoad" }), h("div", { key: '00b2f6471b45baadfa451ab8e71bd35fefe30dbd', id: "client-componentDidLoad" })), h("div", { key: '736757cae13c751141e4c29efd4daf72acce79b6' }, h("cmp-scoped-a", { key: '3d48ec50eb1ee4bc78fc7b23f2fe7bb11ec128da' })), h("div", { key: 'ff4d14217f89f478897c8ff6f2fa6d342f382a25' }, h("cmp-scoped-b", { key: '39dbda9e91ff3bed2d29d752e0eb59b592603c3d' }))));
    }
    static get style() { return appRootCss(); }
}, [0, "app-root"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["app-root", "cmp-a", "cmp-b", "cmp-c", "cmp-d", "cmp-scoped-a", "cmp-scoped-b"];
    components.forEach(tagName => { switch (tagName) {
        case "app-root":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), AppRoot$1);
            }
            break;
        case "cmp-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$7();
            }
            break;
        case "cmp-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$6();
            }
            break;
        case "cmp-c":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$5();
            }
            break;
        case "cmp-d":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$4();
            }
            break;
        case "cmp-scoped-a":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$3();
            }
            break;
        case "cmp-scoped-b":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                defineCustomElement$2();
            }
            break;
    } });
}

const AppRoot = AppRoot$1;
const defineCustomElement = defineCustomElement$1;

export { AppRoot, defineCustomElement };
