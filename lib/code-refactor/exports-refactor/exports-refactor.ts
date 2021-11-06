import {
  BinaryExpression,
  ElementAccessExpression,
  PropertyAccessExpression,
  SourceFile,
  SyntaxKind
} from "ts-morph";
import {ExportValidator} from "./helpers/export-validator";
import {ExportParser} from "./helpers/export-parser";
import {ExportedVariableModel} from "../../models/exported-variable.model";
import {UsedVariables} from "../helpers/used-variables/used-variables";
import {TopLevelRefactor} from "./top-level-refactor/top-level-refactor";
import {NestedRefactor} from "./nested-refactor/nested-refactor";

export class ExportsRefactor {
  static moduleExportsToExport(sourceFile: SourceFile) {
    const usedVariables = UsedVariables.getDeclaredVariables(sourceFile);

    sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression).reduce((exportedVariables, node) => {
      if (!node.wasForgotten()) {
        return this.refactorExport(node, exportedVariables, usedVariables, sourceFile);
      }
      return exportedVariables;
    }, new Array<ExportedVariableModel>());

    /*
    * actually export created variables
    * */
  }

  private static refactorExport(
    binary: BinaryExpression,
    exportedVariables: ExportedVariableModel[],
    usedVariables: string[],
    sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const identifiers = ExportValidator.isExportAssigment(binary);
    if (!identifiers) {
      return exportedVariables;
    }
    const filtered = ExportParser.filterExportIdentifiers(identifiers);
    const accessExpression = ExportParser.getBaseExport(filtered);
    switch (filtered.length) {
      case 0:
        // export default or assignment of multiple exports
        return exportedVariables;
      case 1:
      default:
        return this.refactorPropertyAccessExport(filtered[0].getText(), binary, accessExpression, exportedVariables, usedVariables, sourceFile);
    }
  }

  private static refactorPropertyAccessExport(
    exportName: string,
    binary: BinaryExpression,
    accessExpression: PropertyAccessExpression | ElementAccessExpression,
    exportedVariables: ExportedVariableModel[],
    usedVariables: string[],
    sourceFile: SourceFile
  ): ExportedVariableModel[] {
    const parent = binary.getParent()?.asKind(SyntaxKind.ExpressionStatement);
    const grandParent = binary.getParent()?.getParent()?.asKind(SyntaxKind.SourceFile);
    if (parent && grandParent) {
      return TopLevelRefactor.refactorTopLevelExport(exportName, binary, parent, accessExpression, exportedVariables, usedVariables, sourceFile);
    } else {
      return NestedRefactor.refactorNestedExport(exportName, binary, accessExpression, exportedVariables, usedVariables, sourceFile);
    }
  }
}

