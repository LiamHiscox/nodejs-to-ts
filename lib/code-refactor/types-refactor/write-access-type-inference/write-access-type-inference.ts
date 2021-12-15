import {
  BinaryExpression,
  Identifier,
  Node,
  Project,
  PropertyDeclaration,
  ReferencedSymbol,
  SyntaxKind,
  TypedNode,
  VariableDeclaration,
  VariableDeclarationKind
} from "ts-morph";
import {findReferences} from "../../helpers/reference-finder/reference-finder";
import {TypeHandler} from "../type-handler/type-handler";
import {isWriteAccess} from "../../helpers/expression-handler/expression-handler";
import {TypeSimplifier} from "../helpers/type-simplifier/type-simplifier";
import {InterfaceHandler} from "../interface-handler/interface-handler";
import {TypeChecker} from "../helpers/type-checker/type-checker";

export class WriteAccessTypeInference {
  static inferTypeByWriteAccess = (declaration: VariableDeclaration | PropertyDeclaration, project: Project) => {
    const nameNode = declaration.getNameNode();
    const isConstant = this.isConstantDeclaration(declaration);
    if (!isConstant && !Node.isObjectBindingPattern(nameNode) && !Node.isArrayBindingPattern(nameNode)) {
      const newTypes = this.checkReferenceSymbols(declaration);
      const newDeclaration = TypeHandler.addTypes(declaration, ...newTypes);
      this.simplifyTypeNode(newDeclaration);
      if (TypeChecker.isNullOrUndefined(TypeHandler.getType(newDeclaration)))
        TypeHandler.setTypeFiltered(newDeclaration, 'any');
      else
        InterfaceHandler.createInterfaceFromObjectLiterals(newDeclaration, project);
      // DeepTypeInference.propagatePrimitiveType(newDeclaration);
    } else {
      this.simplifyTypeNode(declaration);
      InterfaceHandler.createInterfaceFromObjectLiterals(declaration, project);
      // DeepTypeInference.propagatePrimitiveType(declaration);
    }
  }

  private static simplifyTypeNode = (declaration: TypedNode & Node) => {
    const typeNode = declaration.getTypeNode();
    if (typeNode) {
      const simplified = TypeSimplifier.simplifyTypeNode(typeNode);
      simplified && TypeHandler.setTypeFiltered(declaration, simplified);
    } else {
      const newTypeNode = TypeHandler.getTypeNode(declaration);
      const newTypeNodeText = newTypeNode.getText();
      const simplified = TypeSimplifier.simplifyTypeNode(newTypeNode);
      if (simplified) {
        TypeHandler.setTypeFiltered(declaration, simplified);
        const simplifiedTypeNode = TypeHandler.getTypeNode(declaration);
        simplifiedTypeNode.getText() === newTypeNodeText && declaration.removeType();
      } else {
        declaration.removeType();
      }
    }
  }

  private static checkReferenceSymbols = (declaration: VariableDeclaration | PropertyDeclaration | Identifier): string[] => {
    return findReferences(declaration).reduce((types, ref) => types.concat(...this.checkReferences(ref)), new Array<string>());
  }

  private static checkReferences = (referencedSymbol: ReferencedSymbol): string[] => {
    return referencedSymbol.getReferences().reduce((types, reference) => {
      const node = reference.getNode();
      const writeAccess = reference.isWriteAccess() || isWriteAccess(node);
      if (!reference.isDefinition() && writeAccess) {
        const newType = this.checkWriteAccess(node);
        return newType ? types.concat(newType) : types;
      }
      return types;
    }, new Array<string>())
  }

  private static isConstantDeclaration = (node: Node): boolean => {
    return Node.isVariableDeclaration(node) && node.getVariableStatement()?.getDeclarationKind() === VariableDeclarationKind.Const;
  }

  private static checkWriteAccess = (node: Node): string | undefined => {
    const writeAccess = this.getWriteAccessAncestor(node);
    if (writeAccess) {
      const type = writeAccess.getRight().getType().getBaseTypeOfLiteralType();
      return !type.isAny() ? type.getText() : undefined;
    }
    return;
  }

  private static getWriteAccessAncestor = (node: Node): BinaryExpression | undefined => {
    return node.getFirstAncestorByKind(SyntaxKind.BinaryExpression);
  }
}
