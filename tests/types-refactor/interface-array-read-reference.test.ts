import { Project } from 'ts-morph';
import { getSourceFile } from '../../lib/code-refactor/types-refactor/interface-handler/interface-creator/interface-creator';
import TypesRefactor from '../../lib/code-refactor/types-refactor/types-refactor';
import TypeHandler from '../../lib/code-refactor/types-refactor/type-handler/type-handler';
import flatten from './helpers';
import fs, {existsSync} from "fs";

let project: Project;

beforeEach(() => {
  project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });
})

afterEach(() => {
  if (existsSync('ntts-generated-models.ts')) {
    fs.unlinkSync('ntts-generated-models.ts');
  }
})

test('should add properties to interface from array property access', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()}[] = [{}];\na[0].b = "asd";\na[0].c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; c?: number | undefined; }');
});

test('should not add properties to interface when they already exist in array', () => {
  const interfaceDeclaration = getSourceFile(project, '')
    .addInterface({ name: 'Empty', properties: [{ name: 'a', type: 'string' }, { name: 'b', type: 'number' }], isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()}[] = [{}];\na[0].a = false;\na[0]['b'] = false;`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { a: string | boolean; b: number | boolean; }');
});

test('should add properties to interface from array element access', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()}[] = [{}];\na[0]['b'] = "asd";\na[0][0] = 12\na[0][2+2] = true;`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { b?: string | undefined; 0?: number | undefined; [key: number]: boolean; }');
});

test('should not add property of array prototype method', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: ${TypeHandler.getType(interfaceDeclaration).getText()}[] = [{}];\na[0].hasOwnProperty("a");`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { }');
});

test('should add index signature in array', () => {
  const interfaceDeclaration = getSourceFile(project, '').addInterface({ name: 'Empty', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `const a: ${TypeHandler.getType(interfaceDeclaration).getText()}[] = [{}];\nconst b = "asd";\na[0][b] = 12;`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceDeclaration)).toEqual('export interface Empty { [key: string]: number; }');
});

test('should add properties to two interfaces from property access in union type in array', () => {
  const interfaceA = getSourceFile(project, '').addInterface({ name: 'A', isExported: true });
  const interfaceB = getSourceFile(project, '').addInterface({ name: 'B', isExported: true });
  const sourceFile = project.createSourceFile(
    'write-access.ts',
    `let a: (${TypeHandler.getType(interfaceA).getText()} | ${TypeHandler.getType(interfaceB).getText()})[] = [{}];\na[0].b = "asd";\na[0].c = 12;`,
    { overwrite: true },
  );
  TypesRefactor.inferInterfaceProperties(sourceFile, project, '');
  expect(flatten(interfaceA)).toEqual('export interface A { b?: string | undefined; c?: number | undefined; }');
  expect(flatten(interfaceB)).toEqual('export interface B { b?: string | undefined; c?: number | undefined; }');
});
