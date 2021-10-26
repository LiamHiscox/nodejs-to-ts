import {Node, Project, SourceFile} from "ts-morph";
import {Dirent, readdirSync} from "fs";
import ignore, {Ignore} from "ignore";
import {join} from "path";
import {ImportsRefactor} from "./imports-refactor/imports-refactor";

export class CodeRefactor {
  static convertToTypescript = (sourceFile: SourceFile) => {
    const children = sourceFile.getChildSyntaxList()?.getChildren();
    if (children) {
      this.refactor(children, sourceFile);
    }
  }

  private static refactor = (nodes: Node[], sourceFile: SourceFile) => {
    nodes.forEach(node => {
      if (!node.wasForgotten() && !ImportsRefactor.requireToImport(node, sourceFile)) {
        this.refactor(node.getChildren(), sourceFile);
      }
    });
  }

  static addSourceFiles = (project: Project, ignores: string[], path: string): Project => {
    const ig = ignore().add(ignores);
    this.readDirectory(project, path || '.', ig);
    return project;
  }

  private static readDirectory = (project: Project, path: string, ig: Ignore): Project => {
    readdirSync(path, {withFileTypes: true})
      .forEach(item => this.checkDirectoryEntry(project, item, path, ig));
    return project;
  }

  private static checkDirectoryEntry = (project: Project, item: Dirent, path: string, ig: Ignore): Project => {
    const fullPath = join(path, item.name);
    const ignores = ig.ignores(fullPath);

    if (!ignores && item.isFile() && fullPath.endsWith('.ts')) {
      project.addSourceFileAtPath(fullPath);
    }
    if (!ignores && item.isDirectory()) {
      this.readDirectory(project, fullPath, ig);
    }
    return project;
  }
}
