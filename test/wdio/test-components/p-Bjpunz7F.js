import { p as proxyCustomElement, H, h, t as transformTag } from './p-DYdAJnXF.js';

const SlotFallback = /*@__PURE__*/ proxyCustomElement(class SlotFallback extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.inc = 0;
    }
    render() {
        return (h("div", { key: '18955b32c5d5ce92b4d74e7a6474e1d3e6f9f968' }, h("hr", { key: '63f86bf8afa0a5faf593a3c4840625b2c7ceddc5' }), h("slot", { key: 'afb1e6e4912eece80704a47b851ec47bc84020da', name: "start" }, "slot start fallback ", this.inc), h("section", { key: '827174a73cd772543d92b9e004bad05e4d308957' }, h("slot", { key: 'ad0e69cc30ca03a64ff702cdf8612a619a551169' }, "slot default fallback ", this.inc)), h("article", { key: 'd1fd075d192f9546645a684bc61cf374e141059e' }, h("span", { key: 'f5fc1320ea5142d5bd6cef9ef2febf170c32d965' }, h("slot", { key: '0843835e4b709d864ace43123e9945df5b60c2cb', name: "end" }, "slot end fallback ", this.inc)))));
    }
}, [260, "slot-fallback", {
        "inc": [2]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["slot-fallback"];
    components.forEach(tagName => { switch (tagName) {
        case "slot-fallback":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), SlotFallback);
            }
            break;
    } });
}

export { SlotFallback as S, defineCustomElement as d };
