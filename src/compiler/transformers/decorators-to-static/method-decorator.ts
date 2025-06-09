import { augmentDiagnosticWithNode, buildError, buildWarn } from '@utils';
import ts from 'typescript';

import type * as d from '../../../declarations';
import { validatePublicName } from '../reserved-public-members';
import {
  convertValueToLiteral,
  createStaticGetter,
  getAttributeTypeInfo,
  isMemberPrivate,
  mapJSDocTagInfo,
  retrieveTsDecorators,
  retrieveTsModifiers,
  typeToString,
} from '../transform-utils';
import { isDecoratorNamed } from './decorator-utils';

export const methodDecoratorsToStatic = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  cmpNode: ts.ClassDeclaration,
  decoratedProps: ts.ClassElement[],
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  newMembers: ts.ClassElement[],
  decoratorName: string,
) => {
  const tsSourceFile = cmpNode.getSourceFile();
  const methods = decoratedProps
    .filter(ts.isMethodDeclaration)
    .map((method) =>
      parseMethodDecorator(config, diagnostics, tsSourceFile, typeChecker, program, method, decoratorName),
    )
    .filter((method) => !!method);

  if (methods.length > 0) {
    newMembers.push(createStaticGetter('methods', ts.factory.createObjectLiteralExpression(methods, true)));
  }
};

const parseMethodDecorator = (
  config: d.ValidatedConfig,
  diagnostics: d.Diagnostic[],
  tsSourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  program: ts.Program,
  method: ts.MethodDeclaration,
  decoratorName: string,
): ts.PropertyAssignment | null => {
  const methodDecorator = retrieveTsDecorators(method)?.find(isDecoratorNamed(decoratorName));
  if (methodDecorator == null) {
    return null;
  }

  const methodName = method.name.getText();
  const flags = ts.TypeFormatFlags.WriteArrowStyleSignature | ts.TypeFormatFlags.NoTruncation;
  const signature = typeChecker.getSignatureFromDeclaration(method);
  const returnType = typeChecker.getReturnTypeOfSignature(signature);
  const returnTypeNode = typeChecker.typeToTypeNode(
    returnType,
    method,
    ts.NodeBuilderFlags.NoTruncation | ts.NodeBuilderFlags.NoTypeReduction,
  );
  let returnString = typeToString(typeChecker, returnType);
  let signatureString = typeChecker.signatureToString(signature, method, flags, ts.SignatureKind.Call);

  if (!config._isTesting) {
    if (returnString === 'void') {
      const warn = buildWarn(diagnostics);
      warn.header = '@Method requires async';
      warn.messageText = `External @Method() ${methodName}() must return a Promise.\n\n Consider prefixing the method with async, such as @Method() async ${methodName}().`;
      augmentDiagnosticWithNode(warn, method.name);

      returnString = 'Promise<void>';
      signatureString = signatureString.replace(/=> void$/, '=> Promise<void>');
    } else if (!isTypePromise(returnString)) {
      const err = buildError(diagnostics);
      err.header = '@Method requires async';
      err.messageText = `External @Method() ${methodName}() must return a Promise.\n\n Consider prefixing the method with async, such as @Method() async ${methodName}().`;
      augmentDiagnosticWithNode(err, method.name);
    }
  }

  if (isMemberPrivate(method)) {
    const err = buildError(diagnostics);
    err.messageText =
      'Methods decorated with the @Method() decorator cannot be "private" nor "protected". More info: https://stenciljs.com/docs/methods';
    augmentDiagnosticWithNode(err, retrieveTsModifiers(method)![0]);
  }

  // Validate if the method name does not conflict with existing public names
  validatePublicName(diagnostics, methodName, '@Method()', 'method', method.name);

  const methodMeta: d.ComponentCompilerStaticMethod = {
    complexType: {
      signature: signatureString,
      parameters: signature.parameters.map((symbol) => ({
        name: symbol.getName(),
        type: typeToString(typeChecker, typeChecker.getTypeOfSymbolAtLocation(symbol, method)),
        docs: ts.displayPartsToString(symbol.getDocumentationComment(typeChecker)),
      })),
      references: {
        ...getAttributeTypeInfo(returnTypeNode, tsSourceFile, typeChecker, program),
        ...getAttributeTypeInfo(method, tsSourceFile, typeChecker, program),
      },
      return: returnString,
    },
    docs: {
      text: ts.displayPartsToString(signature.getDocumentationComment(typeChecker)),
      tags: mapJSDocTagInfo(signature.getJsDocTags()),
    },
  };

  const staticProp = ts.factory.createPropertyAssignment(
    ts.factory.createStringLiteral(methodName),
    convertValueToLiteral(methodMeta),
  );

  return staticProp;
};

const isTypePromise = (typeStr: string) => {
  return /^Promise<.+>$/.test(typeStr);
};

export const validateMethods = (diagnostics: d.Diagnostic[], members: ts.NodeArray<ts.ClassElement>) => {
  members.filter(ts.isMethodDeclaration).map((method) => {
    if (method.name.getText() === 'componentDidUnload') {
      const err = buildError(diagnostics);
      err.header = `Replace "componentDidUnload()" with "disconnectedCallback()"`;
      err.messageText = `The "componentDidUnload()" method was removed in Stencil 2. Please use the "disconnectedCallback()" method instead.`;
      augmentDiagnosticWithNode(err, method.name);
    }
  });
};
