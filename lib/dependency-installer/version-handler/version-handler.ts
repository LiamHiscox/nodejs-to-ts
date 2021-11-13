import {ScriptRunner} from "../../script-runner/script-runner";
import {PackageVersion, PackageVersionModel} from "../../models/package.model";


export class VersionHandler {
    /**
     * @param packageName the package to get the available version of
     * @returns Array<PackageVersion> a list of all the available version of the given package
     */
    static packageVersions = (packageName: string): Array<PackageVersion> => {
        try {
            return ScriptRunner.runParsed<Array<PackageVersion>>(`npm view ${packageName} versions --json`);
        } catch (e) {
            return [];
        }
    }

    /**
     * @param packageName the name of the installed package
     * @returns PackageVersion the installed version of the given package
     */
    static packageVersion = (packageName: string): PackageVersion => {
        return ScriptRunner
            .runParsed<PackageVersionModel>(`npm ls ${packageName} --json --depth=0`)
            .dependencies[packageName]
            .version;
    }

    /**
     * @returns PackageVersion the installed version of Node.js
     */
    static nodeVersion = (): PackageVersion => {
        return ScriptRunner.runPipe('node --version').substring(1).trim();
    }

    /**
     * @returns PackageVersion the installed version of Node.js as a number array
     */
    static parsedNodeVersion = (): number[] => {
        return VersionHandler.nodeVersion().split('.').map(v => +v);
    }
}
