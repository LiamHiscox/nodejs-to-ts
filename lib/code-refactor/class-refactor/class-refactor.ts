import {
  ClassDeclaration,
  ClassExpression,
  ClassStaticBlockDeclaration,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  PropertyDeclaration,
  Scope,
  SetAccessorDeclaration,
  SourceFile,
  SyntaxKind
} from "ts-morph";
import {MethodFunctionHandler} from "./method-function-handler/method-function-handler";

type NamedMember = MethodDeclaration | PropertyDeclaration | GetAccessorDeclaration | SetAccessorDeclaration | ClassStaticBlockDeclaration;

export class ClassRefactor {
  static toTypeScriptClasses(sourceFile: SourceFile) {
    this.getClassDescendants(sourceFile).forEach(_class => {
      this.addMissingProperties(_class);
      this.refactorClass(_class.getPos(), this.getClassKind(_class), sourceFile);
    });
  }

  private static getClassKind(node: Node): SyntaxKind.ClassExpression | SyntaxKind.ClassDeclaration {
    switch (node.getKind()) {
      case SyntaxKind.ClassDeclaration:
        return SyntaxKind.ClassDeclaration;
      case SyntaxKind.ClassExpression:
        return SyntaxKind.ClassExpression;
      default:
        throw new Error("Invalid class kind!");
    }
  }

  private static getClassDescendants(sourceFile: SourceFile): (ClassDeclaration | ClassExpression)[] {
    return sourceFile.getDescendants().reduce((classes, descendant) => {
      switch (descendant.getKind()) {
        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.ClassExpression:
          return classes.concat(descendant as ClassExpression | ClassDeclaration);
        default:
          return classes;
      }
    }, new Array<ClassDeclaration | ClassExpression>());
  }

  private static refactorClass(pos: number, type: SyntaxKind.ClassExpression | SyntaxKind.ClassDeclaration, sourceFile: SourceFile) {
    const _class = sourceFile.getDescendantAtPos(pos)?.getFirstAncestorByKind(type);
    const propertyNames = MethodFunctionHandler.getMethodFunctionNames(_class);
    if (_class && propertyNames) {
      propertyNames.forEach(propertyName => {
        const ancestor = sourceFile.getDescendantAtPos(pos)?.getFirstAncestorByKind(type);
        const property = MethodFunctionHandler.getMethodFunction(propertyName, ancestor);
        if (ancestor && property && property.getName().startsWith('#')) {
          property
            .setScope(Scope.Private)
            .rename(property.getName().substring(1));
        }
      });
    }
  }

  private static getDeclaredMembers(_class: ClassExpression | ClassDeclaration): string[] {
    return _class.getMembers().map((p) => {
      if (p.getKind() === SyntaxKind.Constructor) {
        return 'constructor';
      }
      return (p as NamedMember).getName();
    });

  }

  private static addMissingProperties(_class: ClassExpression | ClassDeclaration) {
    const declaredMemberNames = this.getDeclaredMembers(_class);
    _class
      .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
      .reduce((declared, propertyAccess) => {
        const name = propertyAccess.getName();
        if (!declared.includes(name)) {
          _class.insertProperty(0, {name});
          return declared.concat(name);
        }
        return declared;
      }, declaredMemberNames)
  }
}