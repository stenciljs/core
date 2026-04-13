import { isAbsolute } from 'path';
import type * as d from '@stencil/core';

import {
  buildError,
  DOCS_JSON,
  DOCS_README,
  isBoolean,
  isFunction,
  isOutputTargetDocsCustom,
  isOutputTargetDocsCustomElementsManifest,
  isOutputTargetDocsJson,
  isOutputTargetDocsReadme,
  isOutputTargetDocsVscode,
  isString,
  join,
} from '../../../utils';
import { NOTE } from '../../docs/constants';

export const validateDocs = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  userOutputs: d.OutputTarget[],
) => {
  const docsOutputs: d.OutputTarget[] = [];

  // json docs from --docsJson flag (set via config.docsJsonPath)
  if (isString(config.docsJsonPath)) {
    docsOutputs.push(
      validateJsonDocsOutputTarget(config, diagnostics, {
        type: DOCS_JSON,
        file: config.docsJsonPath,
      }),
    );
  }

  // json docs
  const jsonDocsOutputs = userOutputs.filter(isOutputTargetDocsJson);
  jsonDocsOutputs.forEach((jsonDocsOutput) => {
    docsOutputs.push(validateJsonDocsOutputTarget(config, diagnostics, jsonDocsOutput));
  });

  // Auto-add docs-readme in production mode, or when --docs flag is used
  // (In dev mode without --docs flag, user must explicitly configure docs-readme)
  if (!config.devMode || config._docsFlag) {
    if (!userOutputs.some(isOutputTargetDocsReadme)) {
      // didn't provide a docs config, so let's add one
      docsOutputs.push(validateReadmeOutputTarget(config, { type: DOCS_README }));
    }
  }

  // readme docs
  const readmeDocsOutputs = userOutputs.filter(isOutputTargetDocsReadme);
  readmeDocsOutputs.forEach((readmeDocsOutput) => {
    docsOutputs.push(validateReadmeOutputTarget(config, readmeDocsOutput));
  });

  // custom docs
  const customDocsOutputs = userOutputs.filter(isOutputTargetDocsCustom);
  customDocsOutputs.forEach((jsonDocsOutput) => {
    docsOutputs.push(validateCustomDocsOutputTarget(config, diagnostics, jsonDocsOutput));
  });

  // vscode docs
  const vscodeDocsOutputs = userOutputs.filter(isOutputTargetDocsVscode);
  vscodeDocsOutputs.forEach((vscodeDocsOutput) => {
    docsOutputs.push(validateVScodeDocsOutputTarget(config, diagnostics, vscodeDocsOutput));
  });

  // custom elements manifest docs
  const customElementsManifestOutputs = userOutputs.filter(
    isOutputTargetDocsCustomElementsManifest,
  );
  customElementsManifestOutputs.forEach((cemOutput) => {
    docsOutputs.push(validateCustomElementsManifestOutputTarget(config, cemOutput));
  });

  return docsOutputs;
};

const validateReadmeOutputTarget = (
  config: d.ValidatedConfig,
  outputTarget: d.OutputTargetDocsReadme,
) => {
  if (!isString(outputTarget.dir)) {
    outputTarget.dir = config.srcDir;
  }

  if (!isAbsolute(outputTarget.dir)) {
    outputTarget.dir = join(config.rootDir, outputTarget.dir);
  }

  if (outputTarget.footer == null) {
    outputTarget.footer = NOTE;
  }
  outputTarget.strict = !!outputTarget.strict;
  // docs targets skip in dev by default, unless --docs flag was used
  if (!isBoolean(outputTarget.skipInDev)) {
    outputTarget.skipInDev = !config._docsFlag;
  }
  return outputTarget;
};

const validateJsonDocsOutputTarget = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  outputTarget: d.OutputTargetDocsJson,
) => {
  if (!isString(outputTarget.file)) {
    const err = buildError(diagnostics);
    err.messageText = `docs-json outputTarget missing the "file" option`;
  }

  if (!isAbsolute(outputTarget.file)) {
    outputTarget.file = join(config.rootDir, outputTarget.file);
  }
  if (isString(outputTarget.typesFile) && !isAbsolute(outputTarget.typesFile)) {
    outputTarget.typesFile = join(config.rootDir, outputTarget.typesFile);
  } else if (outputTarget.typesFile !== null && outputTarget.file.endsWith('.json')) {
    outputTarget.typesFile = outputTarget.file.replace(/\.json$/, '.d.ts');
  }
  outputTarget.strict = !!outputTarget.strict;
  // docs targets skip in dev by default, unless --docs flag was used
  if (!isBoolean(outputTarget.skipInDev)) {
    outputTarget.skipInDev = !config._docsFlag;
  }
  return outputTarget;
};

const validateCustomDocsOutputTarget = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  outputTarget: d.OutputTargetDocsCustom,
) => {
  if (!isFunction(outputTarget.generator)) {
    const err = buildError(diagnostics);
    err.messageText = `docs-custom outputTarget missing the "generator" function`;
  }

  outputTarget.strict = !!outputTarget.strict;
  // docs targets skip in dev by default, unless --docs flag was used
  if (!isBoolean(outputTarget.skipInDev)) {
    outputTarget.skipInDev = !config._docsFlag;
  }
  return outputTarget;
};

const validateVScodeDocsOutputTarget = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  outputTarget: d.OutputTargetDocsVscode,
) => {
  if (!isString(outputTarget.file)) {
    const err = buildError(diagnostics);
    err.messageText = `docs-vscode outputTarget missing the "file" path`;
  }
  // docs targets skip in dev by default, unless --docs flag was used
  if (!isBoolean(outputTarget.skipInDev)) {
    outputTarget.skipInDev = !config._docsFlag;
  }
  return outputTarget;
};

const validateCustomElementsManifestOutputTarget = (
  config: d.ValidatedConfig,
  outputTarget: d.OutputTargetDocsCustomElementsManifest,
) => {
  if (!isString(outputTarget.file)) {
    outputTarget.file = 'custom-elements.json';
  }
  if (!isAbsolute(outputTarget.file)) {
    outputTarget.file = join(config.rootDir, outputTarget.file);
  }
  outputTarget.strict = !!outputTarget.strict;
  // docs targets skip in dev by default, unless --docs flag was used
  if (!isBoolean(outputTarget.skipInDev)) {
    outputTarget.skipInDev = !config._docsFlag;
  }
  return outputTarget;
};
