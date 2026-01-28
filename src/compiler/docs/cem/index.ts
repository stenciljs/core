import { dashToPascalCase, isOutputTargetDocsCustomElementsManifest } from '@utils';

import type * as d from '../../../declarations';

/**
 * Generate Custom Elements Manifest (custom-elements.json) output
 * conforming to the Custom Elements Manifest specification.
 * @see https://github.com/webcomponents/custom-elements-manifest
 *
 * @param compilerCtx the current compiler context
 * @param docsData the generated docs data from Stencil components
 * @param outputTargets the output targets configured for the build
 */
export const generateCustomElementsManifestDocs = async (
  compilerCtx: d.CompilerCtx,
  docsData: d.JsonDocs,
  outputTargets: d.OutputTarget[],
): Promise<void> => {
  const cemOutputTargets = outputTargets.filter(isOutputTargetDocsCustomElementsManifest);
  if (cemOutputTargets.length === 0) {
    return;
  }

  const manifest = generateManifest(docsData);
  const jsonContent = JSON.stringify(manifest, null, 2);

  await Promise.all(cemOutputTargets.map((outputTarget) => compilerCtx.fs.writeFile(outputTarget.file!, jsonContent)));
};

/**
 * Generate the Custom Elements Manifest from Stencil docs data
 * @param docsData the generated docs data
 * @returns the Custom Elements Manifest object
 */
const generateManifest = (docsData: d.JsonDocs): CustomElementsManifest => {
  // Group components by their source file path
  const componentsByFile = new Map<string, d.JsonDocsComponent[]>();

  for (const component of docsData.components) {
    const filePath = component.filePath;
    if (!componentsByFile.has(filePath)) {
      componentsByFile.set(filePath, []);
    }
    componentsByFile.get(filePath)!.push(component);
  }

  const modules: JavaScriptModule[] = [];

  for (const [filePath, components] of componentsByFile) {
    const declarations: CustomElementDeclaration[] = components.map((component) => componentToDeclaration(component));

    const exports: (JavaScriptExport | CustomElementExport)[] = components.flatMap((component) => {
      const className = dashToPascalCase(component.tag);
      return [
        {
          kind: 'js' as const,
          name: className,
          declaration: {
            name: className,
          },
        },
        {
          kind: 'custom-element-definition' as const,
          name: component.tag,
          declaration: {
            name: className,
          },
        },
      ];
    });

    modules.push({
      kind: 'javascript-module',
      path: filePath,
      declarations,
      exports,
    });
  }

  return {
    schemaVersion: '2.1.0',
    modules,
  };
};

/**
 * Convert Stencil's ComponentCompilerTypeReferences to CEM TypeReference array
 * @param references Stencil's type references map
 * @returns CEM TypeReference array
 */
const convertTypeReferences = (references?: d.ComponentCompilerTypeReferences): TypeReference[] | undefined => {
  if (!references || Object.keys(references).length === 0) {
    return undefined;
  }

  return Object.entries(references).map(([name, ref]) => ({
    name,
    // Global types (like HTMLElement, Array) get 'global:' package
    ...(ref.location === 'global' && { package: 'global:' }),
    // Imported types get their module path
    ...(ref.location === 'import' && ref.path && { module: ref.path }),
    // Local types don't need package or module (they're in the same module)
  }));
};

/**
 * Create a CEM Type object from a type string and optional references
 * @param text the type string
 * @param references Stencil's type references map
 * @returns CEM Type object
 */
const createType = (text: string, references?: d.ComponentCompilerTypeReferences): Type => {
  const typeRefs = convertTypeReferences(references);
  return {
    text,
    ...(typeRefs && { references: typeRefs }),
  };
};

/**
 * Convert a Stencil component to a Custom Element Declaration
 * @param component the Stencil component docs data
 * @returns the Custom Element Declaration
 */
const componentToDeclaration = (component: d.JsonDocsComponent): CustomElementDeclaration => {
  const className = dashToPascalCase(component.tag);

  const attributes: Attribute[] = component.props
    .filter((prop) => prop.attr !== undefined)
    .map((prop) => ({
      name: prop.attr!,
      ...(prop.docs && { description: prop.docs }),
      ...(prop.type && { type: createType(prop.type, prop.complexType?.references) }),
      ...(prop.default !== undefined && { default: prop.default }),
      fieldName: prop.name,
      ...(prop.deprecation !== undefined && { deprecated: prop.deprecation || true }),
    }));

  const members: (CustomElementField | ClassMethod)[] = [
    // Fields (properties)
    ...component.props.map(
      (prop): CustomElementField => ({
        kind: 'field',
        name: prop.name,
        ...(prop.docs && { description: prop.docs }),
        ...(prop.type && { type: createType(prop.type, prop.complexType?.references) }),
        ...(prop.default !== undefined && { default: prop.default }),
        ...(prop.deprecation !== undefined && { deprecated: prop.deprecation || true }),
        ...(!prop.mutable && { readonly: true }),
        ...(prop.attr && { attribute: prop.attr }),
        ...(prop.reflectToAttr && { reflects: true }),
      }),
    ),
    // Methods
    ...component.methods.map(
      (method): ClassMethod => ({
        kind: 'method',
        name: method.name,
        ...(method.docs && { description: method.docs }),
        ...(method.deprecation !== undefined && { deprecated: method.deprecation || true }),
        ...(method.parameters &&
          method.parameters.length > 0 && {
            parameters: method.parameters.map((param) => ({
              name: param.name,
              ...(param.docs && { description: param.docs }),
              ...(param.type && { type: createType(param.type, method.complexType?.references) }),
            })),
          }),
        ...(method.returns && {
          return: {
            ...(method.returns.type && { type: createType(method.returns.type, method.complexType?.references) }),
            ...(method.returns.docs && { description: method.returns.docs }),
          },
        }),
      }),
    ),
  ];

  const events: Event[] = component.events.map((event) => ({
    name: event.event,
    ...(event.docs && { description: event.docs }),
    type: createType(event.detail ? `CustomEvent<${event.detail}>` : 'CustomEvent', event.complexType?.references),
    ...(event.deprecation !== undefined && { deprecated: event.deprecation || true }),
  }));

  const slots: Slot[] = component.slots.map((slot) => ({
    name: slot.name,
    ...(slot.docs && { description: slot.docs }),
  }));

  const cssParts: CssPart[] = component.parts.map((part) => ({
    name: part.name,
    ...(part.docs && { description: part.docs }),
  }));

  const cssProperties: CssCustomProperty[] = component.styles
    .filter((style) => style.annotation === 'prop')
    .map((style) => ({
      name: style.name,
      ...(style.docs && { description: style.docs }),
    }));

  // Generate demos from usage examples
  const demos: Demo[] = Object.entries(component.usage || {}).map(([name, content]) => ({
    // Create relative URL from usagesDir + filename
    url: component.usagesDir ? `${component.usagesDir}/${name}.md` : `${name}.md`,
    ...(content && { description: content }),
  }));

  return {
    kind: 'class',
    customElement: true,
    tagName: component.tag,
    name: className,
    ...(component.docs && { description: component.docs }),
    ...(component.deprecation !== undefined && { deprecated: true }),
    ...(attributes.length > 0 && { attributes }),
    ...(members.length > 0 && { members }),
    ...(events.length > 0 && { events }),
    ...(slots.length > 0 && { slots }),
    ...(cssParts.length > 0 && { cssParts }),
    ...(cssProperties.length > 0 && { cssProperties }),
    ...(component.customStates.length > 0 && {
      customStates: component.customStates.map((state) => ({
        name: state.name,
        initialValue: state.initialValue,
        ...(state.docs && { description: state.docs }),
      })),
    }),
    ...(demos.length > 0 && { demos }),
  };
};

// Custom Elements Manifest Types
// Based on https://github.com/webcomponents/custom-elements-manifest/blob/main/schema.d.ts

interface CustomElementsManifest {
  schemaVersion: string;
  modules: JavaScriptModule[];
}

interface JavaScriptModule {
  kind: 'javascript-module';
  path: string;
  declarations?: CustomElementDeclaration[];
  exports?: (JavaScriptExport | CustomElementExport)[];
}

interface JavaScriptExport {
  kind: 'js';
  name: string;
  declaration: Reference;
}

interface CustomElementExport {
  kind: 'custom-element-definition';
  name: string;
  declaration: Reference;
}

interface Reference {
  name: string;
  package?: string;
  module?: string;
}

interface CustomElementDeclaration {
  kind: 'class';
  customElement: true;
  tagName: string;
  name: string;
  description?: string;
  deprecated?: boolean | string;
  attributes?: Attribute[];
  members?: (CustomElementField | ClassMethod)[];
  events?: Event[];
  slots?: Slot[];
  cssParts?: CssPart[];
  cssProperties?: CssCustomProperty[];
  customStates?: CustomState[];
  demos?: Demo[];
}

interface Demo {
  url: string;
  description?: string;
}

interface Attribute {
  name: string;
  description?: string;
  type?: Type;
  default?: string;
  fieldName?: string;
  deprecated?: boolean | string;
}

interface Type {
  text: string;
  references?: TypeReference[];
}

interface TypeReference {
  name: string;
  package?: string;
  module?: string;
}

interface CustomElementField {
  kind: 'field';
  name: string;
  description?: string;
  type?: Type;
  default?: string;
  deprecated?: boolean | string;
  readonly?: boolean;
  attribute?: string;
  reflects?: boolean;
}

interface ClassMethod {
  kind: 'method';
  name: string;
  description?: string;
  deprecated?: boolean | string;
  parameters?: Parameter[];
  return?: {
    type?: Type;
    description?: string;
  };
}

interface Parameter {
  name: string;
  description?: string;
  type?: Type;
}

interface Event {
  name: string;
  description?: string;
  type: Type;
  deprecated?: boolean | string;
}

interface Slot {
  name: string;
  description?: string;
}

interface CssPart {
  name: string;
  description?: string;
}

/**
 * Custom state that can be targeted with the CSS :state() pseudo-class.
 * This is a custom extension to the CEM spec.
 */
interface CustomState {
  name: string;
  initialValue: boolean;
  description?: string;
}

interface CssCustomProperty {
  name: string;
  description?: string;
}
