import {
  ArrowFunction,
  ClassDeclaration,
  ClassExpression,
  ElementAccessExpression,
  FunctionDeclaration,
  FunctionExpression,
  Identifier,
  InterfaceDeclaration,
  MethodDeclaration,
  Node,
  PropertyAccessExpression,
  PropertyAssignment,
  PropertyDeclaration,
  TypeLiteralNode,
  VariableDeclaration,
} from 'ts-morph';

export type ClassKind = ClassDeclaration | ClassExpression;
export type FunctionKind = FunctionDeclaration | MethodDeclaration | FunctionExpression | ArrowFunction;
export type FieldDeclarationKind = VariableDeclaration | PropertyAssignment | PropertyDeclaration;
export type AccessExpressionKind = Identifier | PropertyAccessExpression | ElementAccessExpression;
export type TypeMemberKind = InterfaceDeclaration | TypeLiteralNode;

export const isFieldDeclaration = (node: Node | undefined): node is FieldDeclarationKind => Node.isVariableDeclaration(node)
    || Node.isPropertyDeclaration(node)
    || Node.isPropertyAssignment(node);

export const isAccessExpression = (node: Node | undefined): node is AccessExpressionKind => Node.isElementAccessExpression(node)
    || Node.isPropertyAccessExpression(node)
    || Node.isIdentifier(node);
