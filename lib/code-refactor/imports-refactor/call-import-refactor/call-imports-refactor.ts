import {CallExpression, SourceFile} from "ts-morph";
import {VariableNameGenerator} from "../helpers/variable-name-generator";
import {ImportCreator} from "../helpers/import-creator";

export class CallImportsRefactor {
  static addCallExpressionImport(
    callExpression: CallExpression,
    importId: string,
    sourceFile: SourceFile,
  ) {
    const moduleVariableName = VariableNameGenerator.variableNameFromImportId(importId);
    const variableName = VariableNameGenerator.getUsableVariableName(moduleVariableName, sourceFile);
    const defaultImport = ImportCreator.addSimpleImport(variableName, importId, sourceFile);
    callExpression.replaceWithText(defaultImport);
  }
}