function t(t,n,o){const r=e(t,n,o),s=localStorage.getItem(r);if("string"==typeof s){const t=parseInt(s,10);if(!isNaN(t))return t}return null}function n(t,n,o,r){const s=e(t,n,o);localStorage.setItem(s,String(r))}function e(t,n,e){return`screenshot_mismatch_${t}_${n}_${e}`}export{t as g,n as s};