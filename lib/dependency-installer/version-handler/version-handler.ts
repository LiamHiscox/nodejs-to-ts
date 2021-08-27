import {ScriptRunner} from "../../script-runner/script-runner";

export type PackageVersion = string;

interface PackageVersionModel {
    dependencies: {
        [packageName: string]: {
            version: PackageVersion
        }
    }
}

export class VersionHandler {
    /**
     * @param packageName the package to get the available version of
     * @returns Array<PackageVersion> a list of all the available version of the given package
     */
    static packageVersions = (packageName: string): Array<PackageVersion> => {
        return ScriptRunner.runParsed<Array<PackageVersion>>(`npm view ${packageName} versions --json`);
    }

    /**
     * @param packageName the name of the installed package
     * @returns PackageVersion the installed version of the given package
     */
    static packageVersion = (packageName: string): PackageVersion => {
        return ScriptRunner
            .runParsed<PackageVersionModel>(`npm ls ${packageName} --json --depth`)
            .dependencies[packageName]
            .version;
    }

    /**
     * @returns PackageVersion the installed version of Node.js
     */
    static nodeVersion = (): PackageVersion => {
        return ScriptRunner.runPipe('node --version').substring(1);
    }
}