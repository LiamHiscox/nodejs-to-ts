import {ScriptRunner} from "../script-runner/script-runner";
import {VersionHandler} from "./version-handler/version-handler";
import {VersionCalculator} from "./version-calculator/version-calculator";
import {DependencyHandler} from "./dependency-handler/dependency-handler";
import {existsSync} from "fs";
import {Logger} from "../logger/logger";

export class DependencyInstaller {
  /**
  * @description installs type definitions of package if necessary and possible
  */
  static installTypeDependencies = () => {
    Logger.info('Installing additional type definitions');
    const installedPackages = DependencyHandler.installedPackages();
    Object.entries(installedPackages).map(([packageName, {version}]) => {
      DependencyInstaller.installTypes(packageName, version);
    });
  }

  /**
   * @description installs all the base dependencies needed for a node typescript project
   */
  static installBaseDependencies = () => {
    Logger.info('Installing base dependencies');
    DependencyInstaller.installNodeTypes();
    DependencyInstaller.install('typescript');
    DependencyInstaller.install('ts-node');
  }

  /**
   * @description adds a basic package.json file if none exists
   */
  static addPackageJson = () => {
    if (!existsSync('package.json')) {
      ScriptRunner.runIgnore('npm init -y');
      Logger.info('package.json file added');
    }
  };

  private static install = (packageName: string, version?: string) => {
    Logger.info(`Installing ${packageName} ${version || ''}`);
    const fullPackage = version ? `${packageName}@${version}` : packageName;
    ScriptRunner.runIgnore(`npm install ${fullPackage}`);
    Logger.success(`${packageName} installed!`);
  }

  private static installNodeTypes = () => {
    const typesVersions = VersionHandler.packageVersions('@types/node');
    const closestTypesVersion = VersionCalculator.closestVersion(VersionHandler.nodeVersion(), typesVersions);
    DependencyInstaller.install('@types/node', closestTypesVersion);
  }

  private static installTypes = (packageName: string, packageVersion: string) => {
    if (!DependencyHandler.isTypeDefinition(packageName) && !DependencyHandler.packageHasTypes(packageName)) {
      const typesName = DependencyHandler.packageToTypesFormat(packageName);
      const typesVersions = VersionHandler.packageVersions(typesName);
      const closestTypesVersion = VersionCalculator.closestVersion(packageVersion, typesVersions);
      DependencyInstaller.install(typesName, closestTypesVersion);
    }
  }
}
