/*!
 template
 Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
(function(){var e="undefined"===typeof HTMLTemplateElement;/Trident/.test(navigator.userAgent)&&function(){var a=Document.prototype.importNode;Document.prototype.importNode=function(){var c=a.apply(this,arguments);if(c.nodeType===Node.DOCUMENT_FRAGMENT_NODE){var f=this.createDocumentFragment();f.appendChild(c);return f}return c}}();var g=Node.prototype.cloneNode,t=Document.prototype.createElement,u=Document.prototype.importNode,l=function(){if(!e){var a=document.createElement("template"),c=document.createElement("template");
c.content.appendChild(document.createElement("div"));a.content.appendChild(c);a=a.cloneNode(!0);return 0===a.content.childNodes.length||0===a.content.firstChild.content.childNodes.length||!(document.createDocumentFragment().cloneNode()instanceof DocumentFragment)}}(),b=function(){};if(e){var d=document.implementation.createHTMLDocument("template"),m=!0,n=document.createElement("style");n.textContent="template{display:none;}";var p=document.head;p.insertBefore(n,p.firstElementChild);b.prototype=Object.create(HTMLElement.prototype);
var v=!document.createElement("div").hasOwnProperty("innerHTML");b.decorate=function(a){if(!a.content){a.content=d.createDocumentFragment();for(var c;c=a.firstChild;)a.content.appendChild(c);if(v)a.__proto__=b.prototype;else if(a.cloneNode=function(a){return b._cloneNode(this,a)},m)try{q(a),r(a)}catch(f){m=!1}b.bootstrap(a.content)}};var q=function(a){Object.defineProperty(a,"innerHTML",{get:function(){for(var a="",b=this.content.firstChild;b;b=b.nextSibling)a+=b.outerHTML||b.data.replace(w,x);return a},
set:function(a){d.body.innerHTML=a;for(b.bootstrap(d);this.content.firstChild;)this.content.removeChild(this.content.firstChild);for(;d.body.firstChild;)this.content.appendChild(d.body.firstChild)},configurable:!0})},r=function(a){Object.defineProperty(a,"outerHTML",{get:function(){return"<template>"+this.innerHTML+"</template>"},set:function(a){if(this.parentNode){d.body.innerHTML=a;for(a=document.createDocumentFragment();d.body.firstChild;)a.appendChild(d.body.firstChild);this.parentNode.replaceChild(a,
this)}else throw Error("Failed to set the 'outerHTML' property on 'Element': This element has no parent node.");},configurable:!0})};q(b.prototype);r(b.prototype);b.bootstrap=function(a){a=a.querySelectorAll("template");for(var c=0,f=a.length,d;c<f&&(d=a[c]);c++)b.decorate(d)};document.addEventListener("DOMContentLoaded",function(){b.bootstrap(document)});Document.prototype.createElement=function(){var a=t.apply(this,arguments);"template"===a.localName&&b.decorate(a);return a};var w=/[&\u00A0<>]/g,
x=function(a){switch(a){case "&":return"&amp;";case "<":return"&lt;";case ">":return"&gt;";case "\u00a0":return"&nbsp;"}}}if(e||l)b._cloneNode=function(a,b){var c=g.call(a,!1);this.decorate&&this.decorate(c);b&&(c.content.appendChild(g.call(a.content,!0)),this.fixClonedDom(c.content,a.content));return c},b.prototype.cloneNode=function(a){return b._cloneNode(this,a)},b.fixClonedDom=function(a,b){if(b.querySelectorAll)for(var c=b.querySelectorAll("template"),d=a.querySelectorAll("template"),e=0,g=d.length,
h,k;e<g;e++)k=c[e],h=d[e],this.decorate&&this.decorate(k),h.parentNode.replaceChild(k.cloneNode(!0),h)},Node.prototype.cloneNode=function(a){if(this instanceof DocumentFragment)if(a)var c=this.ownerDocument.importNode(this,!0);else return this.ownerDocument.createDocumentFragment();else c=g.call(this,a);a&&b.fixClonedDom(c,this);return c},Document.prototype.importNode=function(a,c){if("template"===a.localName)return b._cloneNode(a,c);var d=u.call(this,a,c);c&&b.fixClonedDom(d,a);return d},l&&(window.HTMLTemplateElement.prototype.cloneNode=
function(a){return b._cloneNode(this,a)});e&&(window.HTMLTemplateElement=b)})();