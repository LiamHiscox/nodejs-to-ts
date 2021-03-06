import * as fse from 'fs-extra';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import DependencyInstaller from '../lib/dependency-installer/dependency-installer';
import DependencyHandler from '../lib/dependency-installer/dependency-handler/dependency-handler';
import { NPM } from '../lib/models/package-manager';

const sampleCopy = 'tests/sample-copy';
const sample = 'tests/sample';
const cwd = process.cwd();
jest.setTimeout(40000);

fse.copySync(sample, sampleCopy);
process.chdir(sampleCopy);

beforeAll(async () => {
  await DependencyInstaller.installBaseDependencies(NPM);
  await DependencyInstaller.installTypeDependencies(NPM);
});

afterAll(() => {
  process.chdir(cwd);
  fse.rmSync(sampleCopy, { recursive: true, force: true });
});

test('should install base dependency dependency', async () => {
  const installed = await DependencyHandler.installedPackages();
  expect(installed).toHaveProperty('typescript');
  expect(installed).toHaveProperty('@types/node');
  expect(installed).toHaveProperty('ts-node');
});

test('should install type definitions', async () => {
  const installed = await DependencyHandler.installedPackages();
  expect(installed).not.toHaveProperty('@types/typescript');
  expect(installed).toHaveProperty('@types/yargs');
});

test('should keep package.json', () => {
  const content = readFileSync('package.json', { encoding: 'utf-8' });
  DependencyInstaller.addPackageJson(NPM);
  const contentNew = readFileSync('package.json', { encoding: 'utf-8' });
  expect(content).toEqual(contentNew);
});

test('should add package.json', () => {
  unlinkSync('package.json');
  expect(existsSync('package.json')).toBeFalsy();
  DependencyInstaller.addPackageJson(NPM);
  expect(existsSync('package.json')).toBeTruthy();
});
