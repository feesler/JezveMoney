import { readFileSync } from 'fs';
import { resolve } from 'path';
import shell from 'shelljs';
import * as dotenv from 'dotenv';

/* eslint-disable no-console */

dotenv.config();

const dirPath = (str) => (
    resolve(str.toString()).replace(/\\/g, '/')
);

const getPackageVersion = (fileName) => {
    const content = readFileSync(fileName);
    const json = JSON.parse(content);
    return json.version;
};

const versionFiles = [
    'package.json',
    'package-lock.json',
    'composer.json',
    'composer.lock',
];

if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

const gitDir = dirPath(process.env.PROJECT_GIT_DIR);
const currentDir = dirPath(shell.pwd());

// If git directory is different from current(working) directory
// then copy files with package version updates to git directory
if (gitDir.toLowerCase() !== currentDir.toLowerCase()) {
    const sources = versionFiles.map((file) => resolve(currentDir, file));
    shell.cp('-f', ...sources, gitDir);
}

const version = getPackageVersion('./package.json');

shell.pushd('-q', gitDir);

shell.exec(`git commit -a -m "Updated version to ${version}"`);
shell.exec('git checkout release --');
shell.exec('git pull -v --no-rebase "origin"');
shell.exec(`git merge --no-ff -m "Version ${version}" master`);
shell.exec(`git tag -a v.${version} -m "Version ${version}"`);
shell.exec('git checkout master --');

shell.popd('-q');
