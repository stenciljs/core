import {
  CONTENT_REF_ID,
  HYDRATE_ID,
  ORG_LOCATION_ID,
  SLOT_NODE_ID,
  TEXT_NODE_ID,
  XLINK_NS,
} from '../runtime/runtime-constants';
import { cloneAttributes } from './attribute';
import { NODE_TYPES } from './constants';
import { type MockDocument } from './document';
import { type MockNode } from './node';

/**
 * Set default values for serialization options.
 * @param opts options to control serialization behavior
 * @returns normalized serialization options
 */
function normalizeSerializationOptions(opts: Partial<SerializeNodeToHtmlOptions> = {}) {
  return {
    ...opts,
    outerHtml: typeof opts.outerHtml !== 'boolean' ? false : opts.outerHtml,
    ...(opts.prettyHtml
      ? {
          indentSpaces: typeof opts.indentSpaces !== 'number' ? 2 : opts.indentSpaces,
          newLines: typeof opts.newLines !== 'boolean' ? true : opts.newLines,
        }
      : {
          prettyHtml: false,
          indentSpaces: typeof opts.indentSpaces !== 'number' ? 0 : opts.indentSpaces,
          newLines: typeof opts.newLines !== 'boolean' ? false : opts.newLines,
        }),
    approximateLineWidth: typeof opts.approximateLineWidth !== 'number' ? -1 : opts.approximateLineWidth,
    removeEmptyAttributes: typeof opts.removeEmptyAttributes !== 'boolean' ? true : opts.removeEmptyAttributes,
    removeAttributeQuotes: typeof opts.removeAttributeQuotes !== 'boolean' ? false : opts.removeAttributeQuotes,
    removeBooleanAttributeQuotes:
      typeof opts.removeBooleanAttributeQuotes !== 'boolean' ? false : opts.removeBooleanAttributeQuotes,
    removeHtmlComments: typeof opts.removeHtmlComments !== 'boolean' ? false : opts.removeHtmlComments,
    serializeShadowRoot:
      typeof opts.serializeShadowRoot === 'undefined' ? 'declarative-shadow-dom' : opts.serializeShadowRoot,
    fullDocument: typeof opts.fullDocument !== 'boolean' ? true : opts.fullDocument,
  } as const;
}

/**
 * Serialize a node (either a DOM node or a mock-doc node) to an HTML string.
 * This operation is similar to `outerHTML` but allows for more control over the
 * serialization process. It is fully synchronous meaning that it will not
 * wait for a component to be fully rendered before serializing it. Use `streamToHtml`
 * for a streaming version of this function.
 *
 * @param elm the node to serialize
 * @param serializationOptions options to control serialization behavior
 * @returns an html string
 */
export function serializeNodeToHtml(elm: Node | MockNode, serializationOptions: SerializeNodeToHtmlOptions = {}) {
  const opts = normalizeSerializationOptions(serializationOptions);
  const output: SerializeOutput = {
    currentLineWidth: 0,
    indent: 0,
    isWithinBody: false,
    text: [],
  };

  let renderedNode = '';
  const children =
    !opts.fullDocument && (elm as MockDocument).body
      ? Array.from((elm as MockDocument).body.childNodes)
      : opts.outerHtml
        ? [elm]
        : Array.from(getChildNodes(elm));

  for (let i = 0, ii = children.length; i < ii; i++) {
    const child = children[i];
    const chunks = Array.from(streamToHtml(child, opts, output));
    renderedNode += chunks.join('');
  }

  return renderedNode.trim();
}

const shadowRootTag = 'mock:shadow-root';

/**
 * Same as `serializeNodeToHtml` but returns a generator that yields the serialized
 * HTML in chunks. This is useful for streaming the serialized HTML to the client
 * as it is being generated.
 *
 * @param node the node to serialize
 * @param opts options to control serialization behavior
 * @param output keeps track of the current line width and indentation
 * @returns a generator that yields the serialized HTML in chunks
 */
function* streamToHtml(
  node: Node | MockNode,
  opts: SerializeNodeToHtmlOptions,
  output: Omit<SerializeOutput, 'text'>,
): Generator<string, void, undefined> {
  const isShadowRoot = node.nodeType === NODE_TYPES.DOCUMENT_FRAGMENT_NODE;

  if (node.nodeType === NODE_TYPES.ELEMENT_NODE || isShadowRoot) {
    const tagName = isShadowRoot ? shadowRootTag : getTagName(node as Element);

    if (tagName === 'body') {
      output.isWithinBody = true;
    }

    const ignoreTag = opts.excludeTags != null && opts.excludeTags.includes(tagName);

    if (ignoreTag === false) {
      const isWithinWhitespaceSensitiveNode =
        opts.newLines || (opts.indentSpaces ?? 0) > 0 ? isWithinWhitespaceSensitive(node) : false;
      if (opts.newLines && !isWithinWhitespaceSensitiveNode) {
        yield '\n';
        output.currentLineWidth = 0;
      }

      if ((opts.indentSpaces ?? 0) > 0 && !isWithinWhitespaceSensitiveNode) {
        for (let i = 0; i < output.indent; i++) {
          yield ' ';
        }
        output.currentLineWidth += output.indent;
      }

      const tag = tagName === shadowRootTag ? 'template' : tagName;

      yield '<' + tag;
      output.currentLineWidth += tag.length + 1;

      /**
       * ToDo(https://github.com/stenciljs/core/issues/4111): the shadow root class is `#document-fragment`
       * and has no mode attribute. We should consider adding a mode attribute.
       */
      if (
        tag === 'template' &&
        (!(node as Element).getAttribute || !(node as Element).getAttribute('shadowrootmode')) &&
        /**
         * If the node is a shadow root, we want to add the `shadowrootmode` attribute
         */
        ('host' in node || node.nodeName.toLocaleLowerCase() === shadowRootTag)
      ) {
        const mode = ` shadowrootmode="open"`;
        yield mode;
        output.currentLineWidth += mode.length;
      }

      const attrsLength = (node as HTMLElement).attributes.length;
      const attributes =
        opts.prettyHtml && attrsLength > 1
          ? cloneAttributes((node as HTMLElement).attributes as any, true)
          : (node as Element).attributes;

      for (let i = 0; i < attrsLength; i++) {
        const attr = attributes.item(i)!;
        const attrName = attr.name;

        if (attrName === 'style') {
          continue;
        }

        let attrValue = attr.value;
        if (opts.removeEmptyAttributes && attrValue === '' && REMOVE_EMPTY_ATTR.has(attrName)) {
          continue;
        }

        const attrNamespaceURI = attr.namespaceURI;
        if (attrNamespaceURI == null) {
          output.currentLineWidth += attrName.length + 1;
          if (
            opts.approximateLineWidth &&
            opts.approximateLineWidth > 0 &&
            output.currentLineWidth > opts.approximateLineWidth
          ) {
            yield '\n' + attrName;
            output.currentLineWidth = 0;
          } else {
            yield ' ' + attrName;
          }
        } else if (attrNamespaceURI === 'http://www.w3.org/XML/1998/namespace') {
          yield ' xml:' + attrName;
          output.currentLineWidth += attrName.length + 5;
        } else if (attrNamespaceURI === 'http://www.w3.org/2000/xmlns/') {
          if (attrName !== 'xmlns') {
            yield ' xmlns:' + attrName;
            output.currentLineWidth += attrName.length + 7;
          } else {
            yield ' ' + attrName;
            output.currentLineWidth += attrName.length + 1;
          }
        } else if (attrNamespaceURI === XLINK_NS) {
          yield ' xlink:' + attrName;
          output.currentLineWidth += attrName.length + 7;
        } else {
          yield ' ' + attrNamespaceURI + ':' + attrName;
          output.currentLineWidth += attrNamespaceURI.length + attrName.length + 2;
        }

        if (opts.prettyHtml && attrName === 'class') {
          attrValue = attr.value = attrValue
            .split(' ')
            .filter((t) => t !== '')
            .sort()
            .join(' ')
            .trim();
        }

        if (attrValue === '') {
          if (opts.removeBooleanAttributeQuotes && BOOLEAN_ATTR.has(attrName)) {
            continue;
          }
          if (opts.removeEmptyAttributes && attrName.startsWith('data-')) {
            continue;
          }
        }

        if (opts.removeAttributeQuotes && CAN_REMOVE_ATTR_QUOTES.test(attrValue)) {
          yield '=' + escapeString(attrValue, true);
          output.currentLineWidth += attrValue.length + 1;
        } else {
          yield '="' + escapeString(attrValue, true) + '"';
          output.currentLineWidth += attrValue.length + 3;
        }
      }

      if ((node as Element).hasAttribute('style')) {
        const cssText = (node as HTMLElement).style.cssText;

        if (
          opts.approximateLineWidth &&
          opts.approximateLineWidth > 0 &&
          output.currentLineWidth + cssText.length + 10 > opts.approximateLineWidth
        ) {
          yield `\nstyle="${cssText}">`;
          output.currentLineWidth = 0;
        } else {
          yield ` style="${cssText}">`;
          output.currentLineWidth += cssText.length + 10;
        }
      } else {
        yield '>';
        output.currentLineWidth += 1;
      }
    }

    if (EMPTY_ELEMENTS.has(tagName) === false) {
      const shadowRoot = (node as HTMLElement).shadowRoot;
      if (shadowRoot != null && opts.serializeShadowRoot !== false) {
        output.indent = output.indent + (opts.indentSpaces ?? 0);

        yield* streamToHtml(shadowRoot, opts, output);
        output.indent = output.indent - (opts.indentSpaces ?? 0);

        const childNodes = getChildNodes(node);
        if (
          opts.newLines &&
          (childNodes.length === 0 ||
            (childNodes.length === 1 &&
              childNodes[0].nodeType === NODE_TYPES.TEXT_NODE &&
              childNodes[0].nodeValue?.trim() === ''))
        ) {
          yield '\n';
          output.currentLineWidth = 0;

          for (let i = 0; i < output.indent; i++) {
            yield ' ';
          }
          output.currentLineWidth += output.indent;
        }
      }

      if (opts.excludeTagContent == null || opts.excludeTagContent.includes(tagName) === false) {
        const tag = tagName === shadowRootTag ? 'template' : tagName;
        const childNodes =
          tagName === 'template'
            ? ((node as any as HTMLTemplateElement).content.childNodes as any)
            : getChildNodes(node);
        const childNodeLength = childNodes.length;

        if (childNodeLength > 0) {
          if (
            childNodeLength === 1 &&
            childNodes[0].nodeType === NODE_TYPES.TEXT_NODE &&
            (typeof childNodes[0].nodeValue !== 'string' || childNodes[0].nodeValue.trim() === '')
          ) {
            // skip over empty text nodes
          } else {
            const isWithinWhitespaceSensitiveNode =
              opts.newLines || (opts.indentSpaces ?? 0) > 0 ? isWithinWhitespaceSensitive(node) : false;

            if (!isWithinWhitespaceSensitiveNode && (opts.indentSpaces ?? 0) > 0 && ignoreTag === false) {
              output.indent = output.indent + (opts.indentSpaces ?? 0);
            }

            for (let i = 0; i < childNodeLength; i++) {
              /**
               * In cases where a user would pass in a declarative shadow dom of a
               * Stencil component, we want to skip over the template tag as we
               * will be parsing the shadow root of the component again.
               *
               * We know it is a hydrated Stencil component by checking if the `HYDRATE_ID`
               * is set on the node.
               */
              const sId = (node as HTMLElement).attributes.getNamedItem(HYDRATE_ID);
              const isStencilDeclarativeShadowDOM = childNodes[i].nodeName.toLowerCase() === 'template' && sId;
              if (isStencilDeclarativeShadowDOM) {
                yield `\n${' '.repeat(output.indent)}<!--r.${sId.value}-->`;
                continue;
              }

              yield* streamToHtml(childNodes[i], opts, output);
            }

            if (ignoreTag === false) {
              if (opts.newLines && !isWithinWhitespaceSensitiveNode) {
                yield '\n';
                output.currentLineWidth = 0;
              }

              if ((opts.indentSpaces ?? 0) > 0 && !isWithinWhitespaceSensitiveNode) {
                output.indent = output.indent - (opts.indentSpaces ?? 0);
                for (let i = 0; i < output.indent; i++) {
                  yield ' ';
                }
                output.currentLineWidth += output.indent;
              }
            }
          }
        }

        if (ignoreTag === false) {
          yield '</' + tag + '>';
          output.currentLineWidth += tag.length + 3;
        }
      }
    }

    if ((opts.approximateLineWidth ?? 0) > 0 && STRUCTURE_ELEMENTS.has(tagName)) {
      yield '\n';
      output.currentLineWidth = 0;
    }

    if (tagName === 'body') {
      output.isWithinBody = false;
    }
  } else if (node.nodeType === NODE_TYPES.TEXT_NODE) {
    let textContent = node.nodeValue;

    if (typeof textContent === 'string') {
      const trimmedTextContent = textContent.trim();
      if (trimmedTextContent === '') {
        // this text node is whitespace only
        if (isWithinWhitespaceSensitive(node)) {
          // whitespace matters within this element
          // just add the exact text we were given
          yield textContent;
          output.currentLineWidth += textContent.length;
        } else if ((opts.approximateLineWidth ?? 0) > 0 && !output.isWithinBody) {
          // do nothing if we're not in the <body> and we're tracking line width
        } else if (!opts.prettyHtml) {
          // this text node is only whitespace, and it's not
          // within a whitespace sensitive element like <pre> or <code>
          // so replace the entire white space with a single new line
          output.currentLineWidth += 1;

          if (
            opts.approximateLineWidth &&
            opts.approximateLineWidth > 0 &&
            output.currentLineWidth > opts.approximateLineWidth
          ) {
            // good enough for a new line
            // for perf these are all just estimates
            // we don't care to ensure exact line lengths
            yield '\n';
            output.currentLineWidth = 0;
          } else {
            // let's keep it all on the same line yet
            yield ' ';
          }
        }
      } else {
        // this text node has text content
        const isWithinWhitespaceSensitiveNode =
          opts.newLines || (opts.indentSpaces ?? 0) > 0 || opts.prettyHtml ? isWithinWhitespaceSensitive(node) : false;
        if (opts.newLines && !isWithinWhitespaceSensitiveNode) {
          yield '\n';
          output.currentLineWidth = 0;
        }

        if ((opts.indentSpaces ?? 0) > 0 && !isWithinWhitespaceSensitiveNode) {
          for (let i = 0; i < output.indent; i++) {
            yield ' ';
          }
          output.currentLineWidth += output.indent;
        }

        let textContentLength = textContent.length;
        if (textContentLength > 0) {
          // this text node has text content

          const parentTagName =
            node.parentNode != null && node.parentNode.nodeType === NODE_TYPES.ELEMENT_NODE
              ? node.parentNode.nodeName
              : null;
          if (typeof parentTagName === 'string' && NON_ESCAPABLE_CONTENT.has(parentTagName)) {
            // this text node cannot have its content escaped since it's going
            // into an element like <style> or <script>
            if (isWithinWhitespaceSensitive(node)) {
              yield textContent;
            } else {
              yield trimmedTextContent;
              textContentLength = trimmedTextContent.length;
            }
            output.currentLineWidth += textContentLength;
          } else {
            // this text node is going into a normal element and html can be escaped
            if (opts.prettyHtml && !isWithinWhitespaceSensitiveNode) {
              // pretty print the text node
              yield escapeString(textContent.replace(/\s\s+/g, ' ').trim(), false);
              output.currentLineWidth += textContentLength;
            } else {
              // not pretty printing the text node
              if (isWithinWhitespaceSensitive(node)) {
                output.currentLineWidth += textContentLength;
              } else {
                // this element is not a whitespace sensitive one, like <pre> or <code> so
                // any whitespace at the start and end can be cleaned up to just be one space
                if (/\s/.test(textContent.charAt(0))) {
                  textContent = ' ' + textContent.trimLeft();
                }

                textContentLength = textContent.length;
                if (textContentLength > 1) {
                  if (/\s/.test(textContent.charAt(textContentLength - 1))) {
                    if (
                      opts.approximateLineWidth &&
                      opts.approximateLineWidth > 0 &&
                      output.currentLineWidth + textContentLength > opts.approximateLineWidth
                    ) {
                      textContent = textContent.trimRight() + '\n';
                      output.currentLineWidth = 0;
                    } else {
                      textContent = textContent.trimRight() + ' ';
                    }
                  }
                }
                output.currentLineWidth += textContentLength;
              }

              yield escapeString(textContent, false);
            }
          }
        }
      }
    }
  } else if (node.nodeType === NODE_TYPES.COMMENT_NODE) {
    const nodeValue = node.nodeValue;

    const isHydrateAnnotation =
      nodeValue?.startsWith(CONTENT_REF_ID + '.') ||
      nodeValue?.startsWith(ORG_LOCATION_ID + '.') ||
      nodeValue?.startsWith(SLOT_NODE_ID + '.') ||
      nodeValue?.startsWith(TEXT_NODE_ID + '.');

    /**
     * remove comments from stringified output if user set the `removeHtmlComments` e.g.
     * in the `renderToString` function and we are no dealing with a hydrate annotation
     */
    if (opts.removeHtmlComments && !isHydrateAnnotation) {
      return;
    }

    const isWithinWhitespaceSensitiveNode =
      opts.newLines || (opts.indentSpaces ?? 0) > 0 ? isWithinWhitespaceSensitive(node) : false;
    if (opts.newLines && !isWithinWhitespaceSensitiveNode) {
      yield '\n';
      output.currentLineWidth = 0;
    }

    if ((opts.indentSpaces ?? 0) > 0 && !isWithinWhitespaceSensitiveNode) {
      for (let i = 0; i < output.indent; i++) {
        yield ' ';
      }
      output.currentLineWidth += output.indent;
    }

    yield '<!--' + nodeValue + '-->';
    if (nodeValue) {
      output.currentLineWidth += nodeValue.length + 7;
    }
  } else if (node.nodeType === NODE_TYPES.DOCUMENT_TYPE_NODE) {
    yield '<!doctype html>';
  }
}

const AMP_REGEX = /&/g;
const NBSP_REGEX = /\u00a0/g;
const DOUBLE_QUOTE_REGEX = /"/g;
const LT_REGEX = /</g;
const GT_REGEX = />/g;
const CAN_REMOVE_ATTR_QUOTES = /^[^ \t\n\f\r"'`=<>\/\\-]+$/;

function getTagName(element: Element) {
  if (element.namespaceURI === 'http://www.w3.org/1999/xhtml') {
    return element.nodeName.toLowerCase();
  } else {
    return element.nodeName;
  }
}

function escapeString(str: string, attrMode: boolean) {
  str = str.replace(AMP_REGEX, '&amp;').replace(NBSP_REGEX, '&nbsp;');

  if (attrMode) {
    return str.replace(DOUBLE_QUOTE_REGEX, '&quot;');
  }

  return str.replace(LT_REGEX, '&lt;').replace(GT_REGEX, '&gt;');
}

/**
 * Determine whether a given node is within a whitespace-sensitive node by
 * walking the parent chain until either a whitespace-sensitive node is found or
 * there are no more parents to examine.
 *
 * @param node a node to check
 * @returns whether or not this is within a whitespace-sensitive node
 */
function isWithinWhitespaceSensitive(node: Node | MockNode) {
  let _node: Node | MockNode | null = node;
  while (_node?.nodeName) {
    if (WHITESPACE_SENSITIVE.has(_node.nodeName)) {
      return true;
    }
    _node = _node.parentNode;
  }
  return false;
}

/**
 * Normalizes the `childNodes` of a node due to if `experimentalSlotFixes` is enabled, `
 * childNodes` will only return 'slotted' / lightDOM nodes
 *
 * @param node to return `childNodes` from
 * @returns a node list of child nodes
 */
function getChildNodes(node: Node | MockNode) {
  return ((node as any).__childNodes || node.childNodes) as NodeList;
}

// TODO(STENCIL-1299): Audit this list, remove unsupported/deprecated elements
/*@__PURE__*/ export const NON_ESCAPABLE_CONTENT = new Set([
  'STYLE',
  'SCRIPT',
  'IFRAME',
  'NOSCRIPT',
  'XMP',
  'NOEMBED',
  'NOFRAMES',
  'PLAINTEXT',
]);

// TODO(STENCIL-1299): Audit this list, remove unsupported/deprecated elements
/**
 * A list of whitespace sensitive tag names, such as `code`, `pre`, etc.
 */
/*@__PURE__*/ export const WHITESPACE_SENSITIVE = new Set([
  'CODE',
  'OUTPUT',
  'PLAINTEXT',
  'PRE',
  'SCRIPT',
  'TEMPLATE',
  'TEXTAREA',
]);

// TODO(STENCIL-1299): Audit this list, remove unsupported/deprecated elements
/*@__PURE__*/ export const EMPTY_ELEMENTS = new Set([
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'trace',
  'track',
  'wbr',
]);

// TODO(STENCIL-1299): Audit this list, remove unsupported/deprecated attr
/*@__PURE__*/ const REMOVE_EMPTY_ATTR = new Set(['class', 'dir', 'id', 'lang', 'name', 'title']);

// TODO(STENCIL-1299): Audit this list, remove unsupported/deprecated attr
/*@__PURE__*/ const BOOLEAN_ATTR = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'compact',
  'controls',
  'declare',
  'default',
  'defaultchecked',
  'defaultmuted',
  'defaultselected',
  'defer',
  'disabled',
  'enabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nohref',
  'nomodule',
  'noresize',
  'noshade',
  'novalidate',
  'nowrap',
  'open',
  'pauseonexit',
  'readonly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  'selected',
  'sortable',
  'truespeed',
  'typemustmatch',
  'visible',
]);

/*@__PURE__*/ const STRUCTURE_ELEMENTS = new Set([
  'html',
  'body',
  'head',
  'iframe',
  'meta',
  'link',
  'base',
  'title',
  'script',
  'style',
]);

interface SerializeOutput {
  currentLineWidth: number;
  indent: number;
  isWithinBody: boolean;
  text: string[];
}

/**
 * Partially duplicate of https://github.com/stenciljs/core/blob/6017dad2cb6fe366242e2e0594f82c8e3a3b5d15/src/declarations/stencil-public-compiler.ts#L895
 * Types can't be imported in this documented as Eslint will not embed the types
 * in the d.ts file.
 */
export interface SerializeNodeToHtmlOptions {
  approximateLineWidth?: number;
  excludeTagContent?: string[];
  excludeTags?: string[];
  indentSpaces?: number;
  newLines?: boolean;
  outerHtml?: boolean;
  prettyHtml?: boolean;
  removeAttributeQuotes?: boolean;
  removeBooleanAttributeQuotes?: boolean;
  removeEmptyAttributes?: boolean;
  removeHtmlComments?: boolean;
  serializeShadowRoot?:
    | 'declarative-shadow-dom'
    | 'scoped'
    | {
        'declarative-shadow-dom'?: string[];
        scoped?: string[];
        default: 'declarative-shadow-dom' | 'scoped';
      }
    | boolean;
  fullDocument?: boolean;
}
