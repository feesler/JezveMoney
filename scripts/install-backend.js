import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import shell from 'shelljs';

/* eslint-disable no-console */

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

const serverFilter = [
    'admin/Controller/',
    'admin/Template/',
    'admin/.htaccess',
    'admin/index.php',
    'Controller/',
    'Model/',
    'Template/',
    'lang/',
    'system/',
    'api/',
    'index.php',
    '.htaccess',
    'favicon.ico',
    'manifest.webmanifest',
];

const clean = true;
const silent = true;
const createDirs = ['system/logs', 'system/uploads', 'admin/view/tests'];

const srcDir = resolve(currentDir, '../src').replace(/\\/g, '/');
const destDir = resolve(currentDir, '../dist').replace(/\\/g, '/');

serverFilter.forEach((path) => {
    const source = resolve(srcDir, path);
    const dest = resolve(destDir, path);

    if (clean) {
        shell.rm('-rf', dest);
    }

    shell.cp('-rf', source, dest);
    if (!silent) {
        console.log('Uploaded path: ', path);
    }
});

createDirs.forEach((path) => {
    const dir = resolve(destDir, path);
    shell.mkdir('-p', dir);
    if (!silent) {
        console.log('Created directory: ', path);
    }
});
