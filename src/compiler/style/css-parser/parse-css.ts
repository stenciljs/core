import type * as d from '../../../declarations';
import { type CssNode, CssNodeType, type CssParsePosition, type ParseCssResults } from './css-parse-declarations';

export const parseCss = (css: string, filePath?: string): ParseCssResults => {
  let lineno = 1;
  let column = 1;

  const diagnostics: d.Diagnostic[] = [];

  const updatePosition = (str: string) => {
    const lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    const i = str.lastIndexOf('\n');
    column = ~i ? str.length - i : column + str.length;
  };

  const position = () => {
    const start = { line: lineno, column: column };

    return (node: CssNode) => {
      node.position = new ParsePosition(start);
      whitespace();
      return node;
    };
  };

  const error = (msg: string): null => {
    const srcLines = css.split('\n');

    const d: d.Diagnostic = {
      level: 'error',
      type: 'css',
      language: 'css',
      header: 'CSS Parse',
      messageText: msg,
      absFilePath: filePath,
      lines: [
        {
          lineIndex: lineno - 1,
          lineNumber: lineno,
          errorCharStart: column,
          text: css[lineno - 1],
        },
      ],
    };

    if (lineno > 1) {
      const previousLine: d.PrintLine = {
        lineIndex: lineno - 1,
        lineNumber: lineno - 1,
        text: css[lineno - 2],
        errorCharStart: -1,
        errorLength: -1,
      };
      d.lines.unshift(previousLine);
    }

    if (lineno + 2 < srcLines.length) {
      const nextLine: d.PrintLine = {
        lineIndex: lineno,
        lineNumber: lineno + 1,
        text: srcLines[lineno],
        errorCharStart: -1,
        errorLength: -1,
      };

      d.lines.push(nextLine);
    }

    diagnostics.push(d);

    return null;
  };

  const stylesheet = (): CssNode => {
    const rulesList = rules();

    return {
      type: CssNodeType.StyleSheet,
      stylesheet: {
        source: filePath,
        rules: rulesList,
      },
    };
  };

  const open = () => match(/^{\s*/);
  const close = () => match(/^}/);

  const match = (re: any) => {
    const m = re.exec(css);
    if (!m) return;
    const str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  };

  const rules = () => {
    let node: CssNode | void;
    const rules: CssNode[] = [];

    whitespace();
    comments(rules);

    while (css.length && css.charAt(0) !== '}' && (node = atrule() || rule())) {
      rules.push(node);
      comments(rules);
    }
    return rules;
  };

  /**
   * Parse whitespace.
   */

  const whitespace = () => match(/^\s*/);

  const comments = (rules?: CssNode[]) => {
    let c;
    rules = rules || [];
    while ((c = comment())) {
      rules.push(c);
    }
    return rules;
  };

  const comment = () => {
    const pos = position();
    if ('/' !== css.charAt(0) || '*' !== css.charAt(1)) return null;

    let i = 2;
    while ('' !== css.charAt(i) && ('*' !== css.charAt(i) || '/' !== css.charAt(i + 1))) ++i;
    i += 2;

    if ('' === css.charAt(i - 1)) {
      return error('End of comment missing');
    }

    const comment = css.slice(2, i - 2);
    column += 2;
    updatePosition(comment);
    css = css.slice(i);
    column += 2;

    return pos({
      type: CssNodeType.Comment,
      comment,
    });
  };

  const selector = () => {
    const m: any = match(/^([^{]+)/);
    if (!m) return null;

    return trim(m[0])
      .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
      .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function (m) {
        return m.replace(/,/g, '\u200C');
      })
      .split(/\s*(?![^(]*\)),\s*/)
      .map(function (s) {
        return s.replace(/\u200C/g, ',');
      });
  };

  const declaration = () => {
    const pos = position();

    // prop
    let prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return null;
    prop = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error(`property missing ':'`);

    // val
    const val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    const ret = pos({
      type: CssNodeType.Declaration,
      property: prop.replace(commentre, ''),
      value: val ? trim(val[0]).replace(commentre, '') : '',
    });

    match(/^[;\s]*/);

    return ret;
  };

  const declarations = () => {
    const decls: CssNode[] = [];

    if (!open()) return error(`missing '{'`);
    comments(decls);

    // declarations
    let decl;
    while ((decl = declaration())) {
      decls.push(decl);
      comments(decls);
    }

    if (!close()) return error(`missing '}'`);
    return decls;
  };

  const keyframe = () => {
    let m;
    const values: string[] = [];
    const pos = position();

    while ((m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/))) {
      values.push(m[1]);
      match(/^,\s*/);
    }

    if (!values.length) return null;

    return pos({
      type: CssNodeType.KeyFrame,
      values,
      declarations: declarations(),
    });
  };

  const atkeyframes = () => {
    const pos = position();
    let m = match(/^@([-\w]+)?keyframes\s*/);
    if (!m) return null;

    const vendor = m[1];

    // identifier
    m = match(/^([-\w]+)\s*/);
    if (!m) return error(`@keyframes missing name`);
    const name = m[1];

    if (!open()) return error(`@keyframes missing '{'`);

    let frame: CssNode;
    let frames = comments();
    while ((frame = keyframe())) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error(`@keyframes missing '}'`);

    return pos({
      type: CssNodeType.KeyFrames,
      name: name,
      vendor: vendor,
      keyframes: frames,
    });
  };

  const atsupports = () => {
    const pos = position();
    const m = match(/^@supports *([^{]+)/);

    if (!m) return null;
    const supports = trim(m[1]);

    if (!open()) return error(`@supports missing '{'`);

    const style = comments().concat(rules());

    if (!close()) return error(`@supports missing '}'`);

    return pos({
      type: CssNodeType.Supports,
      supports: supports,
      rules: style,
    });
  };

  const athost = () => {
    const pos = position();
    const m = match(/^@host\s*/);

    if (!m) return null;

    if (!open()) return error(`@host missing '{'`);

    const style = comments().concat(rules());

    if (!close()) return error(`@host missing '}'`);

    return pos({
      type: CssNodeType.Host,
      rules: style,
    });
  };

  const atmedia = () => {
    const pos = position();
    const m = match(/^@media *([^{]+)/);

    if (!m) return null;
    const media = trim(m[1]);

    if (!open()) return error(`@media missing '{'`);

    const style = comments().concat(rules());

    if (!close()) return error(`@media missing '}'`);

    return pos({
      type: CssNodeType.Media,
      media: media,
      rules: style,
    });
  };

  const atcustommedia = () => {
    const pos = position();
    const m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    if (!m) return null;

    return pos({
      type: CssNodeType.CustomMedia,
      name: trim(m[1]),
      media: trim(m[2]),
    });
  };

  const atpage = () => {
    const pos = position();
    const m = match(/^@page */);
    if (!m) return null;

    const sel = selector() || [];

    if (!open()) return error(`@page missing '{'`);
    let decls = comments();

    let decl: CssNode | void;
    while ((decl = declaration())) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error(`@page missing '}'`);

    return pos({
      type: CssNodeType.Page,
      selectors: sel,
      declarations: decls,
    });
  };

  const atdocument = () => {
    const pos = position();
    const m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return null;

    const vendor = trim(m[1]);
    const doc = trim(m[2]);

    if (!open()) return error(`@document missing '{'`);

    const style = comments().concat(rules());

    if (!close()) return error(`@document missing '}'`);

    return pos({
      type: CssNodeType.Document,
      document: doc,
      vendor: vendor,
      rules: style,
    });
  };

  const atfontface = () => {
    const pos = position();
    const m = match(/^@font-face\s*/);
    if (!m) return null;

    if (!open()) return error(`@font-face missing '{'`);
    let decls = comments();

    let decl: CssNode | void;
    while ((decl = declaration())) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error(`@font-face missing '}'`);

    return pos({
      type: CssNodeType.FontFace,
      declarations: decls,
    });
  };

  const compileAtrule = (nodeName: string, nodeType: CssNodeType) => {
    const re = new RegExp('^@' + nodeName + '\\s*([^;]+);');
    return () => {
      const pos = position();
      const m = match(re);
      if (!m) return null;
      const node: any = {
        type: nodeType,
      };
      (node as any)[nodeName] = m[1].trim();
      return pos(node);
    };
  };

  const atimport = compileAtrule('import', CssNodeType.Import);

  const atcharset = compileAtrule('charset', CssNodeType.Charset);

  const atnamespace = compileAtrule('namespace', CssNodeType.Namespace);

  const atrule = () => {
    if (css[0] !== '@') return null;
    return (
      atkeyframes() ||
      atmedia() ||
      atcustommedia() ||
      atsupports() ||
      atimport() ||
      atcharset() ||
      atnamespace() ||
      atdocument() ||
      atpage() ||
      athost() ||
      atfontface()
    );
  };

  const rule = () => {
    const pos = position();
    const sel = selector();

    if (!sel) return error('selector missing');
    comments();

    return pos({
      type: CssNodeType.Rule,
      selectors: sel,
      declarations: declarations(),
    });
  };

  class ParsePosition implements CssParsePosition {
    start: any;
    end: any;
    source: any;
    content: string;

    constructor(start: any) {
      this.start = start;
      this.end = { line: lineno, column: column };
      this.source = filePath;
    }
  }
  ParsePosition.prototype.content = css;

  return {
    diagnostics,
    ...addParent(stylesheet()),
  };
};

const trim = (str: string) => (str ? str.trim() : '');

/**
 * Adds non-enumerable parent node reference to each node.
 */

const addParent = (obj?: any, parent?: any) => {
  const isNode = obj && typeof obj.type === 'string';
  const childParent = isNode ? obj : parent;

  for (const k in obj) {
    const value = obj[k];
    if (Array.isArray(value)) {
      value.forEach(function (v) {
        addParent(v, childParent);
      });
    } else if (value && typeof value === 'object') {
      addParent(value, childParent);
    }
  }

  if (isNode) {
    Object.defineProperty(obj, 'parent', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null,
    });
  }

  return obj;
};

// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
const commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;
