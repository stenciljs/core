import { parseCss } from '../parse-css';
import { serializeCss } from '../serialize-css';

describe('css parse/serialize', () => {
  // Modified tests from Rework CSS
  // https://github.com/reworkcss/css/tree/master/test/cases
  // https://github.com/reworkcss/css/blob/master/LICENSE

  it.each([
    ['at-namespace', '@namespace svg "http://www.w3.org/2000/svg";\n', '@namespace svg "http://www.w3.org/2000/svg";'],
    [
      'charset',
      '@charset "UTF-8";       /* Set the encoding of the style sheet to Unicode UTF-8 */\n@charset \'iso-8859-15\'; /* Set the encoding of the style sheet to Latin-9 (Western European languages, with euro sign) */\n',
      '@charset "UTF-8";@charset \'iso-8859-15\';',
    ],
    ['charset-linebreak', '@charset\n    "UTF-8"\n    ;\n', '@charset "UTF-8";'],
    ['colon-space', 'a {\n    margin  : auto;\n    padding : 0;\n}\n', 'a{margin:auto;padding:0}'],
    ['duplicate', 'h1, h1, h2, h2, h3 {color:red}', 'h1,h2,h3{color:red}'],
    ['comma-attribute 1', '.foo[bar="baz,quz"] {\n  foobar: 123;\n}\n\n', '.foo[bar="baz,quz"]{foobar:123}'],
    [
      'comma-attribute 2',
      '.bar,\n#bar[baz="qux,foo"],\n#qux {\n  foobar: 456;\n}\n\n',
      '.bar,#bar[baz="qux,foo"],#qux{foobar:456}',
    ],
    [
      'comma-attribute 3',
      '.baz[qux=",foo"],\n.baz[qux="foo,"],\n.baz[qux="foo,bar,baz"],\n.baz[qux=",foo,bar,baz,"],\n.baz[qux=" , foo , bar , baz , "] {\n  foobar: 789;\n}\n',
      '.baz[qux=",foo"],.baz[qux="foo,"],.baz[qux="foo,bar,baz"],.baz[qux=",foo,bar,baz,"],.baz[qux=" , foo , bar , baz , "]{foobar:789}',
    ],
    [
      'comma-attribute 4',
      '\n.qux[foo=\'bar,baz\'],\n.qux[bar="baz,foo"],\n#qux[foo="foobar"],\n#qux[foo=\',bar,baz, \'] {\n  foobar: 012;\n}\n\n#foo[foo=""],\n#foo[bar=" "],\n#foo[bar=","],\n#foo[bar=", "],\n#foo[bar=" ,"],\n#foo[bar=" , "],\n#foo[baz=\'\'],\n#foo[qux=\' \'],\n#foo[qux=\',\'],\n#foo[qux=\', \'],\n#foo[qux=\' ,\'],\n#foo[qux=\' , \'] {\n  foobar: 345;\n}\n',
      '.qux[foo=\'bar,baz\'],.qux[bar="baz,foo"],#qux[foo="foobar"],#qux[foo=\',bar,baz, \']{foobar:012}#foo[foo=""],#foo[bar=" "],#foo[bar=","],#foo[bar=", "],#foo[bar=" ,"],#foo[bar=" , "],#foo[baz=\'\'],#foo[qux=\' \'],#foo[qux=\',\'],#foo[qux=\', \'],#foo[qux=\' ,\'],#foo[qux=\' , \']{foobar:345}',
    ],
    [
      'comma-selector-function',
      '.foo:matches(.bar,.baz),\n.foo:matches(.bar, .baz),\n.foo:matches(.bar , .baz),\n.foo:matches(.bar ,.baz) {\n  prop: value;\n}\n\n.foo:matches(.bar,.baz,.foobar),\n.foo:matches(.bar, .baz,),\n.foo:matches(,.bar , .baz) {\n  anotherprop: anothervalue;\n}\n',
      '.foo:matches(.bar,.baz){prop:value}.foo:matches(.bar,.baz,.foobar),.foo:matches(.bar,.baz,),.foo:matches(,.bar,.baz){anotherprop:anothervalue}',
    ],
    [
      'comment',
      "/* 1 */\n\nhead, /* footer, */body/*, nav */ { /* 2 */\n  /* 3 */\n  /**/foo: 'bar';\n  /* 4 */\n} /* 5 */\n\n/* 6 */\n",
      "head,body{foo:'bar';}",
    ],
    ['comment-/*!', '/*! 1 */ div { /* 2 */ } /*! 3 */', '/*! 1 */div{}/*! 3 */'],
    [
      'comment-in',
      'a {\n    color/**/: 12px;\n    padding/*4815162342*/: 1px /**/ 2px /*13*/ 3px;\n    border/*\\**/: solid; border-top/*\\**/: none\\9;\n}\n',
      'a{color:12px;padding:1px  2px  3px;border:solid;border-top:none\\9}',
    ],
    [
      'comment-url',
      '/* http://foo.com/bar/baz.html */\n/**/\n\nfoo { /*/*/\n  /* something */\n  bar: baz; /* http://foo.com/bar/baz.html */\n}\n',
      'foo{bar:baz;}',
    ],
    [
      'custom-media',
      '@custom-media --narrow-window (max-width: 30em);\n@custom-media --wide-window screen and (min-width: 40em);\n',
      '@custom-media --narrow-window (max-width: 30em);@custom-media --wide-window screen and (min-width: 40em);',
    ],
    [
      'custom-media-linebreak',
      '@custom-media\n    --test\n    (min-width: 200px)\n;\n',
      '@custom-media --test (min-width: 200px);',
    ],
    [
      'document',
      '@-moz-document url-prefix() {\n  /* ui above */\n  .ui-select .ui-btn select {\n    /* ui inside */\n    opacity:.0001\n  }\n\n  .icon-spin {\n    height: .9em;\n  }\n}\n',
      '@-moz-document url-prefix(){.ui-select .ui-btn select{opacity:.0001}.icon-spin{height:.9em}}',
    ],
    [
      'document-linebreak',
      '@document\n    url-prefix()\n    {\n\n        .test {\n            color: blue;\n        }\n\n    }\n',
      '@document url-prefix(){.test{color:blue}}',
    ],
    ['empty', '\n', ''],
    ['empty h1', 'h1 {}', ''],
    ['no selector', '{color:blue}', ''],
    ['no prop value', 'h2 {}', ''],
    [
      'escapes 1',
      '/* tests compressed for easy testing */\n/* http://mathiasbynens.be/notes/css-escapes */\n/* will match elements with class=":`(" */\n.\\3A \\`\\({}\n/* will match elements with class="1a2b3c" */\n.\\31 a2b3c{}\n/* will match the element with id="#fake-id" */\n#\\#fake-id{}\n/* will match the element with id="---" */\n#\\---{}\n/* will match the element with id="-a-b-c-" */\n#-a-b-c-{}\n/* will match the element with id="©" */\n#©{}\n/* More tests from http://mathiasbynens.be/demo/html5-id */\nhtml{font:1.2em/1.6 Arial;}\ncode{font-family:Consolas;}\nli code{background:rgba(255, 255, 255, .5);padding:.3em;}\nli{background:orange;}\n#♥{background:lime}\n#©{background:lime}\n#“‘’”{background:lime}\n#☺☃{background:lime}\n#⌘⌥{background:lime}\n#𝄞♪♩♫♬{background:lime}\n#\\?{background:lime}\n#\\@{background:lime}\n#\\.{background:lime}\n#\\3A \\){background:lime}\n#\\3A \\`\\({background:lime}\n#\\31 23{background:lime}\n#\\31 a2b3c{background:lime}\n#\\<p\\>{background:lime}\n#\\<\\>\\<\\<\\<\\>\\>\\<\\>{background:lime}\n#\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.{background:lime}\n#\\#{background:lime}\n#\\#\\#{background:lime}\n#\\#\\.\\#\\.\\#{background:lime}\n#\\_{background:lime}\n#\\.fake\\-class{background:lime}\n#foo\\.bar{background:lime}\n#\\3A hover{background:lime}\n#\\3A hover\\3A focus\\3A active{background:lime}\n#\\[attr\\=value\\]{background:lime}\n#f\\/o\\/o{background:lime}\n#f\\\\o\\\\o{background:lime}\n#f\\*o\\*o{background:lime}\n#f\\!o\\!o{background:lime}\n#f\\\'o\\\'o{background:lime}\n#f\\~o\\~o{background:lime}\n#f\\+o\\+o{background:lime}\n\n/* css-parse does not yet pass this test */\n/*#\\{\\}{background:lime}*/\n',
      "html{font:1.2em/1.6 Arial}code{font-family:Consolas}li code{background:rgba(255, 255, 255, .5);padding:.3em}li{background:orange}#♥{background:lime}#©{background:lime}#“‘’”{background:lime}#☺☃{background:lime}#⌘⌥{background:lime}#𝄞♪♩♫♬{background:lime}#\\?{background:lime}#\\@{background:lime}#\\.{background:lime}#\\3A \\){background:lime}#\\3A \\`\\({background:lime}#\\31 23{background:lime}#\\31 a2b3c{background:lime}#\\<p\\>{background:lime}#\\<\\>\\<\\<\\<\\>\\>\\<\\>{background:lime}#\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\[\\>\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\>\\+\\+\\+\\>\\+\\<\\<\\<\\<\\-\\]\\>\\+\\+\\.\\>\\+\\.\\+\\+\\+\\+\\+\\+\\+\\.\\.\\+\\+\\+\\.\\>\\+\\+\\.\\<\\<\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\+\\.\\>\\.\\+\\+\\+\\.\\-\\-\\-\\-\\-\\-\\.\\-\\-\\-\\-\\-\\-\\-\\-\\.\\>\\+\\.\\>\\.{background:lime}#\\#{background:lime}#\\#\\#{background:lime}#\\#\\.\\#\\.\\#{background:lime}#\\_{background:lime}#\\.fake\\-class{background:lime}#foo\\.bar{background:lime}#\\3A hover{background:lime}#\\3A hover\\3A focus\\3A active{background:lime}#\\[attr\\=value\\]{background:lime}#f\\/o\\/o{background:lime}#f\\\\o\\\\o{background:lime}#f\\*o\\*o{background:lime}#f\\!o\\!o{background:lime}#f\\'o\\'o{background:lime}#f\\~o\\~o{background:lime}#f\\+o\\+o{background:lime}",
    ],
    [
      'font-face',
      '@font-face {\n  font-family: "Bitstream Vera Serif Bold";\n  src: url("http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf");\n}\n\nbody {\n  font-family: "Bitstream Vera Serif Bold", serif;\n}\n',
      '@font-face{font-family:"Bitstream Vera Serif Bold";src:url("http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf")}body{font-family:"Bitstream Vera Serif Bold", serif}',
    ],
    [
      'font-face-linebreak',
      '@font-face\n  \n       {\n  font-family: "Bitstream Vera Serif Bold";\n  src: url("http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf");\n}\n\nbody {\n  font-family: "Bitstream Vera Serif Bold", serif;\n}\n',
      '@font-face{font-family:"Bitstream Vera Serif Bold";src:url("http://developer.mozilla.org/@api/deki/files/2934/=VeraSeBd.ttf")}body{font-family:"Bitstream Vera Serif Bold", serif}',
    ],
    ['empty font-face', '@font-face;', ''],
    ['hose-linebreak', '@host\n    {\n        :scope { color: white; }\n    }\n', '@host{:scope{color:white}}'],
    ['host', '@host {\n  :scope {\n    display: block;\n  }\n}\n', '@host{:scope{display:block}}'],
    [
      'import',
      '@import url("fineprint.css") print;\n@import url("bluish.css") projection, tv;\n@import \'custom.css\';\n@import "common.css" screen, projection;\n@import url(\'landscape.css\') screen and (orientation:landscape);\n',
      '@import url("fineprint.css") print;@import url("bluish.css") projection, tv;@import \'custom.css\';@import "common.css" screen, projection;@import url(\'landscape.css\') screen and (orientation:landscape);',
    ],
    ['import-linebreak', '@import\n    url(test.css)\n    screen\n    ;\n', '@import url(test.css)\n    screen;'],
    [
      'import-messed',
      '\n   @import url("fineprint.css") print;\n  @import url("bluish.css") projection, tv;\n      @import \'custom.css\';\n  @import "common.css" screen, projection  ;\n\n  @import url(\'landscape.css\') screen and (orientation:landscape);\n',
      '@import url("fineprint.css") print;@import url("bluish.css") projection, tv;@import \'custom.css\';@import "common.css" screen, projection;@import url(\'landscape.css\') screen and (orientation:landscape);',
    ],
    [
      'keyframes',
      '@keyframes fade {\n  /* from above */\n  from {\n    /* from inside */\n    opacity: 0;\n  }\n\n  /* to above */\n  to {\n    /* to inside */\n    opacity: 1;\n  }\n}\n',
      '@keyframes fade{from{opacity:0}to{opacity:1}}',
    ],
    [
      'keyframes-advanced',
      '@keyframes advanced {\n  top {\n    opacity[sqrt]: 0;\n  }\n\n  100 {\n    opacity: 0.5;\n  }\n\n  bottom {\n    opacity: 1;\n  }\n}\n',
      '@keyframes advanced{top{opacity[sqrt]:0}100{opacity:0.5}bottom{opacity:1}}',
    ],
    [
      'keyframes-complex',
      '@keyframes foo {\n  0% { top: 0; left: 0 }\n  30.50% { top: 50px }\n  .68% ,\n  72%\n      , 85% { left: 50px }\n  100% { top: 100px; left: 100% }\n}\n',
      '@keyframes foo{0%{top:0;left:0}30.50%{top:50px}.68%,72%,85%{left:50px}100%{top:100px;left:100%}}',
    ],
    [
      'keyframes-linebreak',
      '@keyframes\n    test\n    {\n        from { opacity: 1; }\n        to { opacity: 0; }\n    }\n',
      '@keyframes test{from{opacity:1}to{opacity:0}}',
    ],
    [
      'keyframes-messed',
      '@keyframes fade {from\n  {opacity: 0;\n     }\nto\n  {\n     opacity: 1}}\n',
      '@keyframes fade{from{opacity:0}to{opacity:1}}',
    ],
    [
      'keyframes-vendor',
      '@-webkit-keyframes fade {\n  from { opacity: 0 }\n  to { opacity: 1 }\n}\n',
      '@-webkit-keyframes fade{from{opacity:0}to{opacity:1}}',
    ],
    [
      'media',
      '@media screen, projection {\n  /* html above */\n  html {\n    /* html inside */\n    background: #fffef0;\n    color: #300;\n  }\n\n  /* body above */\n  body {\n    /* body inside */\n    max-width: 35em;\n    margin: 0 auto;\n  }\n}\n\n@media print {\n  html {\n    background: #fff;\n    color: #000;\n  }\n  body {\n    padding: 1in;\n    border: 0.5pt solid #666;\n  }\n}\n',
      '@media screen, projection{html{background:#fffef0;color:#300}body{max-width:35em;margin:0 auto}}@media print{html{background:#fff;color:#000}body{padding:1in;border:0.5pt solid #666}}',
    ],
    [
      'media-linebreak',
      '@media\n\n(\n    min-width: 300px\n)\n{\n    .test { width: 100px; }\n}\n',
      '@media ( min-width: 300px ){.test{width:100px}}',
    ],
    [
      'media-messed',
      '@media screen, projection{ html\n  \n  {\nbackground: #fffef0;\n    color:#300;\n  }\n  body\n\n{\n    max-width: 35em;\n    margin: 0 auto;\n\n\n}\n  }\n\n@media print\n{\n              html {\n              background: #fff;\n              color: #000;\n              }\n              body {\n              padding: 1in;\n              border: 0.5pt solid #666;\n              }\n}\n',
      '@media screen, projection{html{background:#fffef0;color:#300}body{max-width:35em;margin:0 auto}}@media print{html{background:#fff;color:#000}body{padding:1in;border:0.5pt solid #666}}',
    ],
    [
      'media-screen-and-max',
      '@media only \n\n screen and\n\n (max-width:    22.5em  ) {.lead{font-size:21px;}}',
      '@media only screen and (max-width: 22.5em ){.lead{font-size:21px}}',
    ],
    [
      'media-screen-and-min-and-max',
      '@media only    screen and   \n (min-width: 64.0625em)   \t and (max-width: 40em) {.lead{font-size:21px;}}',
      '@media only screen and (min-width: 64.0625em) and (max-width: 40em){.lead{font-size:21px}}',
    ],
    [
      'messed-up',
      "body { foo\n  :\n  'bar' }\n\n   body{foo:bar;bar:baz}\n   body\n   {\n     foo\n     :\n     bar\n     ;\n     bar\n     :\n     baz\n     }\n",
      "body{foo:'bar'}body{foo:bar;bar:baz}body{foo:bar;bar:baz}",
    ],
    [
      'namespace',
      '@namespace "http://www.w3.org/1999/xhtml";\n@namespace svg "http://www.w3.org/2000/svg";\n',
      '@namespace "http://www.w3.org/1999/xhtml";@namespace svg "http://www.w3.org/2000/svg";',
    ],
    [
      'namespace-linebreak',
      '@namespace\n    "http://www.w3.org/1999/xhtml"\n    ;\n',
      '@namespace "http://www.w3.org/1999/xhtml";',
    ],
    [
      'no-semi',
      '\ntobi loki jane {\n  are: \'all\';\n  the-species: called "ferrets"\n}\n',
      'tobi loki jane{are:\'all\';the-species:called "ferrets"}',
    ],
    ['page-linebreak', '@page\n    toc\n    {\n        color: black;\n    }\n', '@page toc{color:black}'],
    [
      'paged-media',
      '/* toc above */\n@page toc, index:blank {\n  /* toc inside */\n  color: green;\n}\n\n@page {\n  font-size: 16pt;\n}\n\n@page :left {\n  margin-left: 5cm;\n}\n',
      '@page toc, index:blank{color:green}@page {font-size:16pt}@page :left{margin-left:5cm}',
    ],
    [
      'props',
      "\ntobi loki jane {\n  are: 'all';\n  the-species: called \"ferrets\";\n  *even: 'ie crap';\n}\n",
      "tobi loki jane{are:'all';the-species:called \"ferrets\";*even:'ie crap'}",
    ],
    ['quote-escape', 'p[qwe="a\\",b"] { color: red }\n', 'p[qwe="a\\",b"]{color:red}'],
    [
      'quoted',
      "body {\n  background: url('some;stuff;here') 50% 50% no-repeat;\n}\n",
      "body{background:url('some;stuff;here') 50% 50% no-repeat}",
    ],
    ['rule', "foo {\n  bar: 'baz';\n}\n", "foo{bar:'baz'}"],
    [
      'rules',
      "tobi {\n  name: 'tobi';\n  age: 2;\n}\n\nloki {\n  name: 'loki';\n  age: 1;\n}\n",
      "tobi{name:'tobi';age:2}loki{name:'loki';age:1}",
    ],
    ['selectors', "foo,\nbar,\nbaz {\n  color: 'black';\n}\n", "foo,bar,baz{color:'black'}"],
    [
      'supports',
      '@supports (display: flex) or (display: box) {\n  /* flex above */\n  .flex {\n    /* flex inside */\n    display: box;\n    display: flex;\n  }\n\n  div {\n    something: else;\n  }\n}\n',
      '@supports (display: flex) or (display: box){.flex{display:box;display:flex}div{something:else}}',
    ],
    [
      'supports-linebreak',
      '@supports\n    (display: flex)\n    {\n        .test { display: flex; }\n    }\n',
      '@supports (display: flex){.test{display:flex}}',
    ],
    [
      'wtf',
      '.wtf {\n  *overflow-x: hidden;\n  //max-height: 110px;\n  #height: 18px;\n}\n',
      '.wtf{*overflow-x:hidden;//max-height:110px;#height:18px}',
    ],
    [
      `background url`,
      `.test  \n { background :   url(top.png) no-repeat, url(bottom.png) no-repeat, url(middle.png) no-repeat \t;}`,
      `.test{background:url(top.png) no-repeat, url(bottom.png) no-repeat, url(middle.png) no-repeat}`,
    ],
    [
      `import`,
      `@import   url('./one.css') ; \n@import  url('./three.css')  ; /*some \ncomment!\n*/ #imports-with-comment   {   color  : #999;   }`,
      `@import url('./one.css');@import url('./three.css');#imports-with-comment{color:#999}`,
    ],
    [
      `:root`,
      `:root  { \n--color  : red  ; } body { color:    var(--color);  nowrap: '';}`,
      `:root{--color:red}body{color:var(--color);nowrap:''}`,
    ],
    [
      `input attr`,
      `input[type=text], input[type=password]  ,\n   input.text,   div  span  ,   select {   margin:  0.5em 0; }`,
      `input[type=text],input[type=password],input.text,div span,select{margin:0.5em 0}`,
    ],
    [`content`, `.clearfix:before { content : "\\0020"; } `, `.clearfix:before{content:"\\0020"}`],
    [
      `attribute w/ ]`,
      `a   #i[title="my \\] long title"]  { color:red ;;}`,
      `a #i[title="my \\] long title"]{color:red}`,
    ],
    [`:focus`, `:focus   , :hover   {\n outline   : 0   ;\n}`, `:focus,:hover{outline:0}`],
    [`quotes`, `blockquote   , q {\n\t  quotes: "" "";}`, `blockquote,q{quotes:"" ""}`],
    [
      `content2`,
      `.clear:after   ,    .container:before   { content: "."; }`,
      `.clear:after,.container:before{content:"."}`,
    ],
    [`* html`, `*   html a[id] .clear  {\n height  :  1%;\t}`, `* html a[id] .clear{height:1%}`],
    [`:not`, `a  :not(b >  w):not( #c )    :nth(2 ) {  color  :  red  ;  }`, `a :not(b>w):not(#c) :nth(2){color:red}`],
    [
      `:host(.a)`,
      `:host ( .a )  [id]   ::slotted( b    ),\n    div   {  color : red ;  }`,
      `:host(.a) [id] ::slotted(b),div{color:red}`,
    ],
    [`#id`, `#id   #id > :not(a)  {color:red;}`, `#id #id>:not(a){color:red}`],
    [
      `whatever`,
      `a b  c\n d  \t e f  #id .f + g + a.r[r] a{ \t  color    :    red    ;  \t  }`,
      `a b c d e f #id .f+g+a.r[r] a{color:red}`,
    ],
    [
      `audio:not([controls])`,
      `audio:not(  [controls] )   #a[b] {color:red ;; }`,
      `audio:not([controls]) #a[b]{color:red}`,
    ],
    [`svg:not(:root)`, `svg:not(:root)   {\t\n\roverflow \r: hidden;}`, `svg:not(:root){overflow:hidden}`],
    [
      `hr~a>[`,
      `hr  ~ a  >  [id] b + c  {   -webkit-box-sizing: content-box;  -moz-box-sizing  : content-box;      box-sizing: content-box;  }`,
      `hr~a>[id] b+c{-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box}`,
    ],
    [
      `::-webkit`,
      `input[type="number"]::-webkit-inner-spin-button  { a : a }`,
      `input[type="number"]::-webkit-inner-spin-button{a:a}`,
    ],
    [`!important`, `img {  max-width  : 100% !important  ;}`, `img{max-width:100% !important}`],
    [
      `@media (min-width:`,
      `@media (min-width: 768px) { .lead {  font-size: 21px;   }}`,
      `@media (min-width: 768px){.lead{font-size:21px}}`,
    ],
    [
      `abbr[title]`,
      `abbr[title] , abbr   [title="hello   world"] {   cursor: help;  border-bottom:  1px dotted  #777;}`,
      `abbr[title],abbr [title="hello   world"]{cursor:help;border-bottom:1px dotted  #777}`,
    ],
  ])('%s', (_testName, cssString, expectedOutput) => {
    const results = parseCss(cssString);
    const output = serializeCss(results.stylesheet, {});
    expect(output).toBe(expectedOutput);
  });
});
