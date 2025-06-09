import {
  DEFAULT_STYLE_MODE,
  flatOne,
  isOutputTargetDocsJson,
  join,
  normalizePath,
  relative,
  sortBy,
  unique,
} from '@utils';
import { basename, dirname } from 'path';

import type * as d from '../../declarations';
import { JsonDocsValue } from '../../declarations';
import { typescriptVersion, version } from '../../version';
import { getBuildTimestamp } from '../build/build-ctx';
import { addFileToLibrary, getTypeLibrary } from '../transformers/type-library';
import { AUTO_GENERATE_COMMENT } from './constants';

/**
 * Generate metadata that will be used to generate any given documentation-related
 * output target(s)
 *
 * @param config the configuration associated with the current Stencil task run
 * @param compilerCtx the current compiler context
 * @param buildCtx the build context for the current Stencil task run
 * @returns the generated metadata
 */
export const generateDocData = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<d.JsonDocs> => {
  const jsonOutputTargets = config.outputTargets.filter(isOutputTargetDocsJson);
  const supplementalPublicTypes = findSupplementalPublicTypes(jsonOutputTargets);

  if (supplementalPublicTypes !== '') {
    // if supplementalPublicTypes is set then we want to add all the public
    // types in that file to the type library so that output targets producing
    // documentation can make use of that data later.
    addFileToLibrary(config, supplementalPublicTypes);
  }

  const typeLibrary = getTypeLibrary();

  return {
    timestamp: getBuildTimestamp(),
    compiler: {
      name: '@stencil/core',
      version,
      typescriptVersion,
    },
    components: await getDocsComponents(config, compilerCtx, buildCtx),
    typeLibrary,
  };
};

/**
 * If the `supplementalPublicTypes` option is set on one output target, find that value and return it.
 *
 * @param outputTargets an array of docs-json output targets
 * @returns the first value encountered for supplementalPublicTypes or an empty string
 */
function findSupplementalPublicTypes(outputTargets: d.OutputTargetDocsJson[]): string {
  for (const docsJsonOT of outputTargets) {
    if (docsJsonOT.supplementalPublicTypes) {
      return docsJsonOT.supplementalPublicTypes;
    }
  }
  return '';
}

/**
 * Derive the metadata for each Stencil component
 *
 * @param config the configuration associated with the current Stencil task run
 * @param compilerCtx the current compiler context
 * @param buildCtx the build context for the current Stencil task run
 * @returns the derived metadata
 */
const getDocsComponents = async (
  config: d.ValidatedConfig,
  compilerCtx: d.CompilerCtx,
  buildCtx: d.BuildCtx,
): Promise<d.JsonDocsComponent[]> => {
  const results = await Promise.all(
    buildCtx.moduleFiles.map(async (moduleFile) => {
      const filePath = moduleFile.sourceFilePath;
      const dirPath = normalizePath(dirname(filePath));
      const readmePath = normalizePath(join(dirPath, 'readme.md'));
      const usagesDir = normalizePath(join(dirPath, 'usage'));
      const readme = await getUserReadmeContent(compilerCtx, readmePath);
      const usage = await generateUsages(compilerCtx, usagesDir);

      return moduleFile.cmps
        .filter((cmp: d.ComponentCompilerMeta) => !cmp.internal && !cmp.isCollectionDependency)
        .map((cmp: d.ComponentCompilerMeta) => ({
          dirPath,
          filePath: normalizePath(relative(config.rootDir, filePath), false),
          fileName: basename(filePath),
          readmePath,
          usagesDir,
          tag: cmp.tagName,
          readme,
          overview: cmp.docs.text,
          usage,
          docs: generateDocs(readme, cmp.docs),
          docsTags: cmp.docs.tags,
          encapsulation: getDocsEncapsulation(cmp),
          dependents: cmp.directDependents,
          dependencies: cmp.directDependencies,
          dependencyGraph: buildDocsDepGraph(cmp, buildCtx.components),
          deprecation: getDocsDeprecationText(cmp.docs.tags),

          props: getDocsProperties(cmp),
          methods: getDocsMethods(cmp.methods),
          events: getDocsEvents(cmp.events),
          styles: getDocsStyles(cmp),
          slots: getDocsSlots(cmp.docs.tags),
          parts: getDocsParts(cmp.htmlParts, cmp.docs.tags),
          listeners: getDocsListeners(cmp.listeners),
        }));
    }),
  );

  return sortBy(flatOne(results), (cmp) => cmp.tag);
};

const buildDocsDepGraph = (
  cmp: d.ComponentCompilerMeta,
  cmps: d.ComponentCompilerMeta[],
): d.JsonDocsDependencyGraph => {
  const dependencies: d.JsonDocsDependencyGraph = {};
  function walk(tagName: string): void {
    if (!dependencies[tagName]) {
      const cmp = cmps.find((c) => c.tagName === tagName);
      const deps = cmp.directDependencies;
      if (deps.length > 0) {
        dependencies[tagName] = deps;
        deps.forEach(walk);
      }
    }
  }
  walk(cmp.tagName);

  // load dependents
  cmp.directDependents.forEach((tagName) => {
    if (dependencies[tagName] && !dependencies[tagName].includes(cmp.tagName)) {
      dependencies[tagName].push(cmp.tagName);
    } else {
      dependencies[tagName] = [cmp.tagName];
    }
  });
  return dependencies;
};

/**
 * Determines the encapsulation string to use, based on the provided compiler metadata
 * @param cmp the metadata for a single component
 * @returns the encapsulation level, expressed as a string
 */
const getDocsEncapsulation = (cmp: d.ComponentCompilerMeta): 'shadow' | 'scoped' | 'none' => {
  if (cmp.encapsulation === 'shadow') {
    return 'shadow';
  } else if (cmp.encapsulation === 'scoped') {
    return 'scoped';
  } else {
    return 'none';
  }
};

/**
 * Generate a collection of JSDoc metadata for both real and virtual props
 * @param cmpMeta the component metadata to derive JSDoc metadata from
 * @returns the derived metadata
 */
const getDocsProperties = (cmpMeta: d.ComponentCompilerMeta): d.JsonDocsProp[] => {
  return sortBy(
    [...getRealProperties(cmpMeta.properties), ...getVirtualProperties(cmpMeta.virtualProperties)],
    (p) => p.name,
  );
};

/**
 * Generate a collection of JSDoc metadata for props on a component
 * @param properties the component's property metadata to derive JSDoc metadata from
 * @returns the derived metadata
 */
const getRealProperties = (properties: d.ComponentCompilerProperty[]): d.JsonDocsProp[] => {
  return properties
    .filter((member) => !member.internal)
    .map((member) => ({
      name: member.name,
      type: member.complexType.resolved,
      complexType: member.complexType,
      mutable: member.mutable,
      attr: member.attribute,
      reflectToAttr: !!member.reflect,
      docs: member.docs.text,
      docsTags: member.docs.tags,
      default: member.defaultValue,
      deprecation: getDocsDeprecationText(member.docs.tags),
      values: parseTypeIntoValues(member.complexType.resolved),

      optional: member.optional,
      required: member.required,

      getter: member.getter,
      setter: member.setter,
    }));
};

/**
 * Generate a collection of JSDoc metadata for props on a component
 * @param virtualProps the component's virtual property metadata to derive JSDoc metadata from
 * @returns the derived metadata
 */
const getVirtualProperties = (virtualProps: d.ComponentCompilerVirtualProperty[]): d.JsonDocsProp[] => {
  return virtualProps.map((member) => ({
    name: member.name,
    type: member.type,
    mutable: false,
    attr: member.name,
    reflectToAttr: false,
    docs: member.docs,
    docsTags: [],
    default: undefined,
    deprecation: undefined,
    values: parseTypeIntoValues(member.type),

    optional: true,
    required: false,

    getter: undefined,
    setter: undefined,
  }));
};

const parseTypeIntoValues = (type: string): d.JsonDocsValue[] => {
  if (typeof type === 'string') {
    const unions = type.split('|').map((u) => u.trim());
    const parsedUnions: JsonDocsValue[] = [];
    unions.forEach((u) => {
      if (u === 'true') {
        parsedUnions.push({
          value: 'true',
          type: 'boolean',
        });
        return;
      }
      if (u === 'false') {
        parsedUnions.push({
          value: 'false',
          type: 'boolean',
        });
        return;
      }
      if (!Number.isNaN(parseFloat(u))) {
        // union is a number
        parsedUnions.push({
          value: u,
          type: 'number',
        });
        return;
      }
      if (/^("|').+("|')$/gm.test(u)) {
        // ionic is a string
        parsedUnions.push({
          value: u.slice(1, -1),
          type: 'string',
        });
        return;
      }
      parsedUnions.push({
        type: u,
      });
    });
    return parsedUnions;
  }
  return [];
};

const getDocsMethods = (methods: d.ComponentCompilerMethod[]): d.JsonDocsMethod[] => {
  return sortBy(methods, (member) => member.name)
    .filter((member) => !member.internal)
    .map(
      (member) =>
        <d.JsonDocsMethod>{
          name: member.name,
          returns: {
            type: member.complexType.return,
            docs: member.docs.tags
              .filter((t) => t.name === 'return' || t.name === 'returns')
              .map((t) => t.text)
              .join('\n'),
          },
          complexType: member.complexType,
          signature: `${member.name}${member.complexType.signature}`,
          parameters: member.complexType.parameters,
          docs: member.docs.text,
          docsTags: member.docs.tags,
          deprecation: getDocsDeprecationText(member.docs.tags),
        },
    );
};

const getDocsEvents = (events: d.ComponentCompilerEvent[]): d.JsonDocsEvent[] => {
  return sortBy(events, (eventMeta) => eventMeta.name.toLowerCase())
    .filter((eventMeta) => !eventMeta.internal)
    .map((eventMeta) => ({
      event: eventMeta.name,
      detail: eventMeta.complexType.resolved,
      bubbles: eventMeta.bubbles,
      complexType: eventMeta.complexType,
      cancelable: eventMeta.cancelable,
      composed: eventMeta.composed,
      docs: eventMeta.docs.text,
      docsTags: eventMeta.docs.tags,
      deprecation: getDocsDeprecationText(eventMeta.docs.tags),
    }));
};

/**
 * Transforms the {@link d.CompilerStyleDoc} metadata for a component into a {@link d.JsonDocsStyle}, providing sensible
 * defaults where needed.
 * @param cmpMeta the metadata for a single Stencil component, which contains the compiler style metadata
 * @returns a new series containing a {@link d.JsonDocsStyle} entry for each {@link d.CompilerStyleDoc} entry.
 */
export const getDocsStyles = (cmpMeta: d.ComponentCompilerMeta): d.JsonDocsStyle[] => {
  if (!cmpMeta.styleDocs) {
    return [];
  }

  return sortBy(
    cmpMeta.styleDocs,
    (compilerStyleDoc) => `${compilerStyleDoc.name.toLowerCase()},${compilerStyleDoc.mode.toLowerCase()}}`,
  ).map((compilerStyleDoc) => {
    return {
      name: compilerStyleDoc.name,
      annotation: compilerStyleDoc.annotation || '',
      docs: compilerStyleDoc.docs || '',
      mode: compilerStyleDoc.mode && compilerStyleDoc.mode !== DEFAULT_STYLE_MODE ? compilerStyleDoc.mode : undefined,
    };
  });
};

const getDocsListeners = (listeners: d.ComponentCompilerListener[]): d.JsonDocsListener[] => {
  return listeners.map((listener) => ({
    event: listener.name,
    target: listener.target,
    capture: listener.capture,
    passive: listener.passive,
  }));
};

/**
 * Get the text associated with a `@deprecated` tag, if one exists
 * @param tags the tags associated with a JSDoc block on a node in the AST
 * @returns the text associated with the first found `@deprecated` tag. If a `@deprecated` tag exists but does not
 * have associated text, an empty string is returned. If no such tag is found, return `undefined`
 */
const getDocsDeprecationText = (tags: d.JsonDocsTag[]): string | undefined => {
  const deprecation = tags.find((t) => t.name === 'deprecated');
  if (deprecation) {
    return deprecation.text || '';
  }
  return undefined;
};

const getDocsSlots = (tags: d.JsonDocsTag[]): d.JsonDocsSlot[] => {
  return sortBy(
    getNameText('slot', tags).map(([name, docs]) => ({ name, docs })),
    (a) => a.name,
  );
};

const getDocsParts = (vdom: string[], tags: d.JsonDocsTag[]): d.JsonDocsSlot[] => {
  const docsParts = getNameText('part', tags).map(([name, docs]) => ({ name, docs }));
  const vdomParts = vdom.map((name) => ({ name, docs: '' }));
  return sortBy(
    unique([...docsParts, ...vdomParts], (p) => p.name),
    (p) => p.name,
  );
};

export const getNameText = (name: string, tags: d.JsonDocsTag[]) => {
  return tags
    .filter((tag) => tag.name === name && tag.text)
    .map(({ text }) => {
      const [namePart, ...rest] = (' ' + text).split(' - ');
      return [namePart.trim(), rest.join(' - ').trim()];
    });
};

/**
 * Attempts to read a pre-existing README.md file from disk, returning any content generated by the user.
 *
 * For simplicity's sake, it is assumed that all user-generated content will fall before {@link AUTO_GENERATE_COMMENT}
 *
 * @param compilerCtx the current compiler context
 * @param readmePath the path to the README file to read
 * @returns the user generated content that occurs before {@link AUTO_GENERATE_COMMENT}. If no user generated content
 * exists, or if there was an issue reading the file, return `undefined`
 */
export const getUserReadmeContent = async (
  compilerCtx: d.CompilerCtx,
  readmePath: string,
): Promise<string | undefined> => {
  try {
    const existingContent = await compilerCtx.fs.readFile(readmePath);
    // subtract one to get everything up to, but not including the auto generated comment
    const userContentIndex = existingContent.indexOf(AUTO_GENERATE_COMMENT) - 1;
    if (userContentIndex >= 0) {
      return existingContent.substring(0, userContentIndex);
    }
  } catch (e) {}
  return undefined;
};

/**
 * Generate documentation for a given component based on the provided JSDoc and README contents
 * @param readme the contents of a component's README file, without any autogenerated contents
 * @param jsdoc the JSDoc associated with the component's declaration
 * @returns the generated documentation
 */
const generateDocs = (readme: string | undefined, jsdoc: d.CompilerJsDoc): string => {
  const docs = jsdoc.text;
  if (docs !== '' || !readme) {
    // just return the existing docs if they exist. these would have been captured earlier in the compilation process.
    // if they don't exist, and there's no README to process, return an empty string.
    return docs;
  }

  /**
   * Parse the README, storing the first section of content.
   * Content is defined as the area between two non-consecutive lines that start with a '#':
   * ```
   * # Header 1
   * This is some content
   * # Header 2
   * This is more content
   * # Header 3
   * Again, content
   * ```
   * In the example above, this chunk of code is designed to capture "This is some content"
   */
  let isContent = false;
  const lines = readme.split('\n');
  const contentLines = [];
  for (const line of lines) {
    const isHeader = line.startsWith('#');
    if (isHeader && isContent) {
      // we were actively parsing content, but found a new header, break out
      break;
    }
    if (!isHeader && !isContent) {
      // we've found content for the first time, set this sentinel to `true`
      isContent = true;
    }
    if (isContent) {
      // we're actively parsing the first found block of content, add it to our list for later
      contentLines.push(line);
    }
  }
  return contentLines.join('\n').trim();
};

/**
 * This function is responsible for reading the contents of all markdown files in a provided `usage` directory and
 * returning their contents
 * @param compilerCtx the current compiler context
 * @param usagesDir the directory to read usage markdown files from
 * @returns an object that maps the filename containing the usage example, to the file's contents. If an error occurs,
 * an empty object is returned.
 */
const generateUsages = async (compilerCtx: d.CompilerCtx, usagesDir: string): Promise<d.JsonDocsUsage> => {
  const rtn: d.JsonDocsUsage = {};

  try {
    const usageFilePaths = await compilerCtx.fs.readdir(usagesDir);

    const usages: d.JsonDocsUsage = {};

    await Promise.all(
      usageFilePaths.map(async (f) => {
        if (!f.isFile) {
          return;
        }

        const fileName = basename(f.relPath);
        if (!fileName.toLowerCase().endsWith('.md')) {
          return;
        }

        const parts = fileName.split('.');
        parts.pop();
        const key = parts.join('.');

        usages[key] = await compilerCtx.fs.readFile(f.absPath);
      }),
    );

    Object.keys(usages)
      .sort()
      .forEach((key) => {
        rtn[key] = usages[key];
      });
  } catch (e) {}

  return rtn;
};
