import{r as t,h as s}from"./p-c001178f.js";class o{constructor(s){t(this,s),this.a="",this.b=""}async componentWillLoad(){const t=`/data/builds/master.json?ts=${Date.now()}`,s=await fetch(t);s.ok&&(this.build=await s.json())}onSubmit(t){t.preventDefault(),t.stopPropagation();let s=this.a.trim().toLowerCase(),o=this.b.trim().toLowerCase();s&&o&&(s=s.substring(0,7),o=o.substring(0,7),window.location.href=`/${s}/${o}`)}render(){return[s("header",null,s("div",{class:"logo"},s("a",{href:"/"},s("img",{src:"/assets/logo.png?1"})))),s("section",null,this.build?s("section",{class:"master"},s("p",null,s("a",{href:"/master"},this.build.message))):null,s("form",{onSubmit:this.onSubmit.bind(this)},s("div",null,s("input",{onInput:t=>this.a=t.target.value})),s("div",null,s("input",{onInput:t=>this.b=t.target.value})),s("div",null,s("button",{type:"submit"},"Compare Screenshots"))))]}static get style(){return"header{padding:8px;background:#fff;-webkit-box-shadow:var(--header-box-shadow);box-shadow:var(--header-box-shadow)}img{width:174px;height:32px}.logo{-ms-flex:1;flex:1;padding:7px}a{padding:8px;color:var(--analysis-data-color);text-decoration:none}.master{text-align:center}a:hover{text-decoration:underline}form{width:160px;margin:40px auto}form div{margin:10px}input{width:100%}"}}export{o as screenshot_lookup};