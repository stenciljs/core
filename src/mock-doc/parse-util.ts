import {
  type html,
  parse,
  parseFragment,
  type ParserOptions,
  type Token,
  type TreeAdapter,
  type TreeAdapterTypeMap,
} from 'parse5';

import { MockComment } from './comment-node';
import { NODE_NAMES, NODE_TYPES } from './constants';
import { MockDocument } from './document';
import { MockDocumentFragment } from './document-fragment';
import { MockTemplateElement } from './element';
import { MockElement, MockNode, MockTextNode } from './node';

const docParser = new WeakMap<any, any>();

export function parseDocumentUtil(ownerDocument: any, html: string) {
  const doc = parse(html.trim(), getParser(ownerDocument)) as any;

  doc.documentElement = doc.firstElementChild;
  doc.head = doc.documentElement.firstElementChild;
  doc.body = doc.head.nextElementSibling;

  return doc;
}

export function parseFragmentUtil(ownerDocument: any, html: string) {
  if (typeof html === 'string') {
    html = html.trim();
  } else {
    html = '';
  }
  const frag = parseFragment(html, getParser(ownerDocument)) as any;
  return frag;
}

function getParser(ownerDocument: MockDocument) {
  let parseOptions: ParserOptions<TreeAdapterTypeMap> = docParser.get(ownerDocument);

  if (parseOptions != null) {
    return parseOptions;
  }

  const treeAdapter: TreeAdapter = {
    createDocument() {
      const doc = ownerDocument.createElement(NODE_NAMES.DOCUMENT_NODE);
      (doc as any)['x-mode'] = 'no-quirks';
      return doc;
    },

    setNodeSourceCodeLocation(node, location) {
      (node as any).sourceCodeLocation = location;
    },

    getNodeSourceCodeLocation(node) {
      return (node as any).sourceCodeLocation;
    },

    createDocumentFragment() {
      return ownerDocument.createDocumentFragment();
    },

    createElement(tagName: string, namespaceURI: string, attrs: Token.Attribute[]) {
      const elm = ownerDocument.createElementNS(namespaceURI, tagName);
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];

        if (attr.namespace == null || attr.namespace === 'http://www.w3.org/1999/xhtml') {
          elm.setAttribute(attr.name, attr.value);
        } else {
          elm.setAttributeNS(attr.namespace, attr.name, attr.value);
        }
      }

      return elm;
    },

    createCommentNode(data: string) {
      return ownerDocument.createComment(data);
    },

    appendChild(parentNode: MockNode, newNode: MockNode) {
      parentNode.appendChild(newNode);
    },

    insertBefore(parentNode: MockNode, newNode: MockNode, referenceNode: MockNode) {
      parentNode.insertBefore(newNode, referenceNode);
    },

    setTemplateContent(templateElement: MockTemplateElement, contentElement: MockDocumentFragment) {
      templateElement.content = contentElement;
    },

    getTemplateContent(templateElement: MockTemplateElement) {
      return templateElement.content;
    },

    setDocumentType(doc: MockDocument, name: string, publicId: string, systemId: string) {
      let doctypeNode = doc.childNodes.find((n) => n.nodeType === NODE_TYPES.DOCUMENT_TYPE_NODE);

      if (doctypeNode == null) {
        doctypeNode = ownerDocument.createDocumentTypeNode();
        doc.insertBefore(doctypeNode, doc.firstChild);
      }

      doctypeNode.nodeValue = '!DOCTYPE';
      (doctypeNode as any)['x-name'] = name;
      (doctypeNode as any)['x-publicId'] = publicId;
      (doctypeNode as any)['x-systemId'] = systemId;
    },

    setDocumentMode(doc: any, mode: string) {
      doc['x-mode'] = mode;
    },

    getDocumentMode(doc: any) {
      return doc['x-mode'];
    },

    detachNode(node: MockNode) {
      node.remove();
    },

    insertText(parentNode: MockNode, text: string) {
      const lastChild = parentNode.lastChild;

      if (lastChild != null && lastChild.nodeType === NODE_TYPES.TEXT_NODE) {
        lastChild.nodeValue += text;
      } else {
        parentNode.appendChild(ownerDocument.createTextNode(text));
      }
    },

    insertTextBefore(parentNode: MockNode, text: string, referenceNode: MockNode) {
      const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

      if (prevNode != null && prevNode.nodeType === NODE_TYPES.TEXT_NODE) {
        prevNode.nodeValue += text;
      } else {
        parentNode.insertBefore(ownerDocument.createTextNode(text), referenceNode);
      }
    },

    adoptAttributes(recipient: MockElement, attrs: Token.Attribute[]) {
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];

        if (recipient.hasAttributeNS(attr.namespace, attr.name) === false) {
          recipient.setAttributeNS(attr.namespace, attr.name, attr.value);
        }
      }
    },

    getFirstChild(node: MockNode) {
      return node.childNodes[0];
    },

    getChildNodes(node: MockNode) {
      return node.childNodes;
    },

    getParentNode(node: MockNode) {
      return node.parentNode;
    },

    getAttrList(element: MockElement) {
      const attrs: Token.Attribute[] = element.attributes.__items.map((attr) => {
        return {
          name: attr.name,
          value: attr.value,
          namespace: attr.namespaceURI,
          prefix: null,
        };
      });
      return attrs;
    },

    getTagName(element: MockElement) {
      if (element.namespaceURI === 'http://www.w3.org/1999/xhtml') {
        return element.nodeName.toLowerCase();
      } else {
        return element.nodeName;
      }
    },

    getNamespaceURI(element: MockElement) {
      // mock-doc widens the type of an element's namespace uri to 'string | null'
      // we use a type assertion here to adhere to parse5's type definitions
      return element.namespaceURI as html.NS;
    },

    getTextNodeContent(textNode: MockTextNode) {
      return textNode.nodeValue;
    },

    getCommentNodeContent(commentNode: MockComment) {
      return commentNode.nodeValue;
    },

    getDocumentTypeNodeName(doctypeNode: any) {
      return doctypeNode['x-name'];
    },

    getDocumentTypeNodePublicId(doctypeNode: any) {
      return doctypeNode['x-publicId'];
    },

    getDocumentTypeNodeSystemId(doctypeNode: any) {
      return doctypeNode['x-systemId'];
    },

    // @ts-ignore - a `MockNode` will never be assignable to a `TreeAdapterTypeMap['text']`. As a result, we cannot
    // complete this function signature
    isTextNode(node: MockNode) {
      return node.nodeType === NODE_TYPES.TEXT_NODE;
    },

    // @ts-ignore - a `MockNode` will never be assignable to a `TreeAdapterTypeMap['comment']`. As a result, we cannot
    // complete this function signature (which requires its return type to be a type predicate)
    isCommentNode(node: MockNode): boolean {
      return node.nodeType === NODE_TYPES.COMMENT_NODE;
    },

    // @ts-ignore - a `MockNode` will never be assignable to a `TreeAdapterTypeMap['document']`. As a result, we cannot
    // complete this function signature (which requires its return type to be a type predicate)
    isDocumentTypeNode(node: MockNode) {
      return node.nodeType === NODE_TYPES.DOCUMENT_TYPE_NODE;
    },

    // @ts-ignore - a `MockNode` will never be assignable to a `TreeAdapterTypeMap['element']`. As a result, we cannot
    // complete this function signature (which requires its return type to be a type predicate)
    isElementNode(node: MockNode) {
      return node.nodeType === NODE_TYPES.ELEMENT_NODE;
    },
  };

  parseOptions = {
    treeAdapter: treeAdapter,
  };

  docParser.set(ownerDocument, parseOptions);

  return parseOptions;
}
