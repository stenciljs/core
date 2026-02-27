import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const MyComponent = /*@__PURE__*/ proxyCustomElement(class MyComponent extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.isLoaded = false;
    }
    componentWillLoad() {
        this.fetchData();
    }
    asyncThing() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const data = Array.from({ length: 20 }, (_, i) => ({ name: `name ${i + 1}` }));
                const getRandomItems = (arr, num) => {
                    const shuffled = arr.sort(() => 0.5 - Math.random());
                    return shuffled.slice(0, num);
                };
                resolve(getRandomItems(data, 10));
            }, 500);
        });
    }
    async fetchData() {
        this.data = await this.asyncThing();
        this.isLoaded = true;
    }
    async prev() {
        this.isLoaded = false;
        this.data = (await this.asyncThing()).slice(0, 5);
        this.isLoaded = true;
    }
    async after() {
        this.isLoaded = false;
        this.data = await this.asyncThing();
        this.isLoaded = true;
    }
    display() {
        return this.data !== undefined && this.data !== null;
    }
    render() {
        var _a;
        return (h(Host, { key: '038f08de01c684c2d5402a44c8ea29393efbd694' }, h("p", { key: '898d6fb359a754a12301c179283354992483057a' }, h("button", { key: 'b86dc22c0e218081aca3fbe735963d0f60ba0aa4', onClick: () => this.prev() }, "Previous"), h("button", { key: '26b3a5f4912c6ba1723bf8f54e39d4451ba673ca', onClick: () => this.after() }, "Next")), this.display() && (h("section", { key: '6f6562e0db99c045d5b898e1ff6fd5ea4fb08a37', class: `data-state ${this.isLoaded ? 'loaded' : ''}` }, (_a = this.data) === null || _a === void 0 ? void 0 : _a.map((d) => h("div", { class: "number" }, d.name))))));
    }
}, [2, "async-rerender", {
        "data": [32],
        "isLoaded": [32]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["async-rerender"];
    components.forEach(tagName => { switch (tagName) {
        case "async-rerender":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), MyComponent);
            }
            break;
    } });
}

const AsyncRerender = MyComponent;
const defineCustomElement = defineCustomElement$1;

export { AsyncRerender, defineCustomElement };
