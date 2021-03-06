import { Project } from 'ts-morph';
import ImportsRefactor from '../../lib/code-refactor/imports-refactor/imports-refactor';
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

test('should refactor imports with no default export', () => {
  project.createSourceFile('exports.ts', 'export const item = 12', { overwrite: true });
  const sourceFile2 = project.createSourceFile('imports.ts', 'import exports from "./exports";', { overwrite: true });
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import * as exports from "./exports";');
});

test('should refactor named imports with no matching named export', () => {
  project.createSourceFile('exports.ts', 'const item = 12; export { item };', { overwrite: true });
  const sourceFile2 = project.createSourceFile('imports.ts', 'import {item, missing} from "./exports";', { overwrite: true });
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import _exports, {item} from "./exports";\n\nconst { missing } = _exports;\n');
});

test('should refactor named imports with no matching named export and existing default import', () => {
  project.createSourceFile('exports.ts', 'const item = 12; export { item }; export default "asd"', { overwrite: true });
  const sourceFile2 = project.createSourceFile('imports.ts', 'import _exports, {item, missing} from "./exports";', { overwrite: true });
  ImportsRefactor.refactorImportClauses(sourceFile2);
  expect(sourceFile2.getText()).toEqual('import _exports, {item} from "./exports";\n\nconst { missing } = _exports;\n');
});
