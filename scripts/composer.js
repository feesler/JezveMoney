import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import shell from 'shelljs';

/* eslint-disable no-console */

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

const composerConfig = [
    'composer.json',
    'composer.lock',
];

const option = (process.argv.length > 2) ? process.argv[2] : null;
const install = option?.toLowerCase() === 'install';
const update = option?.toLowerCase() === 'update';

const projectDir = resolve(currentDir, '..').replace(/\\/g, '/');
const destDir = resolve(currentDir, '../dist/app').replace(/\\/g, '/');

// Create 'dist' directory if not exists
if (!shell.test('-d', destDir)) {
    shell.mkdir('-p', destDir);
}

// Copy config files from sources to destination directory
composerConfig.forEach((path) => {
    const source = resolve(projectDir, path);
    const dest = resolve(destDir, path);

    shell.cp('-f', source, dest);
});

// Change directory and run composer commands
shell.pushd('-q', destDir);

if (install) {
    shell.exec('composer install --no-dev');
} else if (update) {
    shell.exec('composer update --no-dev');
    shell.exec('composer bump');
}

shell.exec('composer dump-autoload -a --no-dev');

shell.popd('-q');

// Move files back to sources or remove it from destination directory
composerConfig.forEach((path) => {
    const source = resolve(destDir, path);
    const dest = resolve(projectDir, path);

    if (update) {
        shell.mv('-f', source, dest);
    } else {
        shell.rm('-f', source);
    }
});
