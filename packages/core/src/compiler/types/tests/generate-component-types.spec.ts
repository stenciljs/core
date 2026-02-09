import { ComponentCompilerMeta, ComponentCompilerMethod } from '@stencil/core';
import { generateComponentTypes } from '../generate-component-types';
import { stubComponentCompilerMeta } from './ComponentCompilerMeta.stub';
import { stubComponentCompilerMethod } from './ComponentCompilerMethod.stub';
import { stubComponentCompilerProperty } from './ComponentCompilerProperty.stub';

describe('generateComponentTypes', () => {
  describe('HTMLElement method conflicts', () => {
    it('should generate standard interface when no method conflicts exist', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        methods: [
          {
            ...stubComponentCompilerMethod(),
            name: 'customMethod',
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.element).toContain('interface HTMLMyButtonElement extends Components.MyButton, HTMLStencilElement');
      expect(result.element).not.toContain('Omit');
    });

    it('should use Omit when focus method conflicts with HTMLElement', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        docs: {
          text: 'docs',
          tags: [],
        },
        methods: [
          {
            ...stubComponentCompilerMethod(),
            name: 'focus',
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.element).toContain('Omit<Components.MyButton, "focus">');
      expect(result.element).toContain('"focus": () => Promise<void>;');
    });

    it('should handle multiple method conflicts', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        docs: {
          text: 'docs',
          tags: [],
        },
        methods: [
          {
            ...stubComponentCompilerMethod(),
            name: 'focus',
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
          {
            ...stubComponentCompilerMethod(),
            name: 'blur',
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
          {
            ...stubComponentCompilerMethod(),
            name: 'click',
            complexType: {
              signature: '(force?: boolean) => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      console.log(result.element);
      expect(result.element).toMatch(
        /interface HTMLMyButtonElement extends Omit<Components\.MyButton, (?=.*"blur")(?=.*"click")(?=.*"focus").*>, HTMLStencilElement \{/,
      );
      expect(result.element).toContain('"focus": () => Promise<void>;');
      expect(result.element).toContain('"blur": () => Promise<void>;');
      expect(result.element).toContain('"click": (force?: boolean) => Promise<void>;');
    });

    it('should handle mixed conflicts and non-conflicts', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        methods: [
          {
            ...stubComponentCompilerMethod(),
            name: 'focus',
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
          {
            ...stubComponentCompilerMethod(),
            name: 'customMethod',
            complexType: {
              signature: '() => Promise<string>',
              parameters: [],
              references: {},
              return: 'Promise<string>',
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.element).toContain('Omit<Components.MyButton, "focus">');
      expect(result.element).toContain('"focus": () => Promise<void>;');
    });

    it('should preserve JSDoc for conflicting methods', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        methods: [
          {
            ...stubComponentCompilerMethod(),
            name: 'focus',
            docs: {
              text: 'Custom focus method that returns a promise',
              tags: [],
            },
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.element).toContain('Custom focus method that returns a promise');
    });

    it('should handle comprehensive list of HTMLElement method conflicts', () => {
      const htmlElementMethods = [
        'animate',
        'getAttribute',
        'setAttribute',
        'removeAttribute',
        'hasAttribute',
        'addEventListener',
        'removeEventListener',
        'appendChild',
        'removeChild',
        'insertBefore',
        'querySelector',
        'querySelectorAll',
        'closest',
        'matches',
        'getBoundingClientRect',
        'getClientRects',
        'scrollIntoView',
        'scroll',
        'scrollBy',
        'scrollTo',
        'requestFullscreen',
        'attachShadow',
        'cloneNode',
        'contains',
        'normalize',
        'replaceChild',
        'append',
        'prepend',
        'before',
        'after',
        'remove',
        'replaceWith',
        'dispatchEvent',
        'toggleAttribute',
      ];

      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'comprehensive-test',
        methods: htmlElementMethods.slice(0, 5).map(
          (methodName): ComponentCompilerMethod => ({
            ...stubComponentCompilerMethod(),
            name: methodName,
            complexType: {
              signature: '() => Promise<void>',
              parameters: [],
              references: {},
              return: 'Promise<void>',
            },
          }),
        ),
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      // Should use Omit for conflicting methods
      expect(result.element).toMatch(
        /Omit<Components\.ComprehensiveTest, (?=.*"animate")(?=.*"getAttribute")(?=.*"setAttribute")(?=.*"removeAttribute")(?=.*"hasAttribute").*>/,
      );

      // Should re-declare the methods with component signatures
      htmlElementMethods.slice(0, 5).forEach((methodName) => {
        expect(result.element).toContain(`"${methodName}": () => Promise<void>;`);
      });
    });
  });

  describe('form-associated attributes', () => {
    it('should add name, disabled, and form attributes to JSX for form-associated components', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-input',
        formAssociated: true,
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.jsx).toContain('"disabled"?: boolean;');
      expect(result.jsx).toContain('"form"?: string;');
      expect(result.jsx).toContain('"name"?: string;');
    });

    it('should not add form-associated attributes for non-form-associated components', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-button',
        formAssociated: false,
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      expect(result.jsx).not.toContain('"disabled"');
      expect(result.jsx).not.toContain('"form"');
      expect(result.jsx).not.toContain('"name"');
    });

    it('should not duplicate attributes when component defines them as props', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-input',
        formAssociated: true,
        properties: [
          {
            ...stubComponentCompilerProperty(),
            name: 'name',
            complexType: {
              original: 'string',
              resolved: 'string',
              references: {},
            },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      // Should only have one "name" attribute (from the prop)
      const nameMatches = result.jsx.match(/"name"/g);
      expect(nameMatches).toHaveLength(1);

      // Should still have the other form-associated attributes
      expect(result.jsx).toContain('"disabled"?: boolean;');
      expect(result.jsx).toContain('"form"?: string;');
    });

    it('should not duplicate any attributes when component defines all form-associated props', () => {
      const cmpMeta: ComponentCompilerMeta = {
        ...stubComponentCompilerMeta(),
        tagName: 'my-input',
        formAssociated: true,
        properties: [
          {
            ...stubComponentCompilerProperty(),
            name: 'name',
            complexType: { original: 'string', resolved: 'string', references: {} },
          },
          {
            ...stubComponentCompilerProperty(),
            name: 'disabled',
            complexType: { original: 'boolean', resolved: 'boolean', references: {} },
          },
          {
            ...stubComponentCompilerProperty(),
            name: 'form',
            complexType: { original: 'string', resolved: 'string', references: {} },
          },
        ],
      };

      const result = generateComponentTypes(cmpMeta, {}, false);

      // Each attribute should appear exactly once
      expect(result.jsx.match(/"name"/g)).toHaveLength(1);
      expect(result.jsx.match(/"disabled"/g)).toHaveLength(1);
      expect(result.jsx.match(/"form"/g)).toHaveLength(1);
    });
  });
});
