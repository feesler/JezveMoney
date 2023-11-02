import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import shell from 'shelljs';

/* eslint-disable no-console */

const currentDir = dirname(fileURLToPath(import.meta.url));

const HTACCESS_FILE = '.htaccess';
const ROOT_HTACCESS_FILE = 'root.htaccess';

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
const destRootDir = resolve(currentDir, '../dist').replace(/\\/g, '/');
const destAppDir = resolve(currentDir, '../dist/app').replace(/\\/g, '/');

serverFilter.forEach((path) => {
    const source = resolve(srcDir, path);
    const dest = resolve(destAppDir, path);

    if (clean) {
        shell.rm('-rf', dest);
    }

    shell.cp('-rf', source, dest);
    if (!silent) {
        console.log('Uploaded path: ', path);
    }
});

// Copy root .htaccess file
shell.cp(
    '-rf',
    resolve(srcDir, ROOT_HTACCESS_FILE),
    resolve(destRootDir, HTACCESS_FILE),
);

createDirs.forEach((path) => {
    const dir = resolve(destAppDir, path);
    shell.mkdir('-p', dir);
    if (!silent) {
        console.log('Created directory: ', path);
    }
});
