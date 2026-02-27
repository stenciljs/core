import { p as proxyCustomElement, H, h, d as Host, t as transformTag } from './p-DYdAJnXF.js';

const cssEntryCss = () => `hr{height:100px;background-color:red}.css-importee{color:blue;font-weight:bold}.css-importee::after{content:': from css-importee.css'}html{line-height:1.15;-webkit-text-size-adjust:100%;}body{margin:0}main{display:block}h1{font-size:2em;margin:0.67em 0}hr{box-sizing:content-box;height:0;overflow:visible;}pre{font-family:monospace, monospace;font-size:1em;}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted;}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace, monospace;font-size:1em;}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0;}button,input{overflow:visible}button,select{text-transform:none}button,[type="button"],[type="reset"],[type="submit"]{-webkit-appearance:button}button::-moz-focus-inner,[type="button"]::-moz-focus-inner,[type="reset"]::-moz-focus-inner,[type="submit"]::-moz-focus-inner{border-style:none;padding:0}button:-moz-focusring,[type="button"]:-moz-focusring,[type="reset"]:-moz-focusring,[type="submit"]:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:0.35em 0.75em 0.625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal;}progress{vertical-align:baseline}textarea{overflow:auto}[type="checkbox"],[type="radio"]{box-sizing:border-box;padding:0;}[type="number"]::-webkit-inner-spin-button,[type="number"]::-webkit-outer-spin-button{height:auto}[type="search"]{-webkit-appearance:textfield;outline-offset:-2px;}[type="search"]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit;}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}.css-entry{color:purple;font-weight:bold}.css-entry::after{content:': from css-entry.css'}`;

const CssCmp$1 = /*@__PURE__*/ proxyCustomElement(class CssCmp extends H {
    constructor(registerHost) {
        super();
        if (registerHost !== false) {
            this.__registerHost();
        }
        this.__attachShadow();
    }
    render() {
        return (h(Host, { key: 'dca5f1af27567bf1cae15a3a1be88affc37969cb' }, h("div", { key: 'c205d011c2b599ee633076238c1414afd3570971', class: "css-entry" }, "Css Entry"), h("div", { key: '5e2a5322a83dc2318c7e3853f8aaa4d5feef0bcc', class: "css-importee" }, "Css Importee"), h("hr", { key: '5e5820ff545ded46fe9b32730430914481f6d7ef' })));
    }
    static get style() { return cssEntryCss(); }
}, [1, "css-cmp"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["css-cmp"];
    components.forEach(tagName => { switch (tagName) {
        case "css-cmp":
            if (!customElements.get(transformTag(transformTag(tagName)))) {
                customElements.define(transformTag(transformTag(tagName)), CssCmp$1);
            }
            break;
    } });
}

const CssCmp = CssCmp$1;
const defineCustomElement = defineCustomElement$1;

export { CssCmp, defineCustomElement };
