import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import Client from 'ssh2-sftp-client';
import ProgressBar from 'progress';
import { readlink, stat } from 'fs/promises';

/* eslint-disable no-console */

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const config = {
    host: process.env.SFTP_SERVER,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASSWORD,
    port: process.env.SFTP_PORT,
};

const APP_DIR = 'app';
const DEPLOY_DIR = 'deploy';
const APP_BACKUP_DIR = 'backup';
const HTACCESS_FILE = '.htaccess';

const client = new Client();
const sources = join(currentDir, '..', 'src');
const distRoot = join(currentDir, '..', 'dist');
const src = join(currentDir, '..', 'dist', APP_DIR);
const dest = process.env.DEPLOY_PATH;

// Source paths to skip on partial upload
const skipList = ['vendor'];

const createDirs = ['system/logs', 'system/uploads', 'admin/view/tests'];
const removeSkipList = [APP_DIR, HTACCESS_FILE];

const option = (process.argv.length > 2) ? process.argv[2] : null;
const isFullDeploy = option?.toLowerCase() === 'full';

const getFirstPathPart = (path) => {
    const relPath = path.startsWith(src) ? path.substring(src.length + 1) : path;
    const parts = relPath.split(/[\\/]/);
    return parts[0].toLowerCase();
};

const filterFiles = (source) => {
    const firstPart = getFirstPathPart(source);
    return (isFullDeploy || !skipList.includes(firstPart));
};

const destPath = (...parts) => (
    `${dest}/${parts.join('/')}`
);

const removeByType = async (path, type) => {
    if (type === 'd') {
        await client.rmdir(path, true);
    } else if (type === '-') {
        await client.delete(path, true);
    }
};

const removeIfExists = async (path) => {
    const type = await client.exists(path);
    if (type !== false) {
        console.log(`Removing ${path}`);
    }

    return removeByType(path, type);
};

let processRes = 1;
let progress = null;
let backupPath = null;
const appPath = destPath(APP_DIR);
const deployDir = (isFullDeploy) ? DEPLOY_DIR : APP_DIR;
const deployPath = destPath(deployDir);

const restoreBackup = async () => {
    if (!backupPath) {
        return;
    }
    // Rename current app/ directory back to deploy/
    await client.rename(appPath, deployPath);
    // Rename backup/ directory to back app/
    await client.rename(backupPath, appPath);
};

const onError = async (e) => {
    console.log('Upload error: ', e.message);
    await restoreBackup();

    progress?.interrupt(`Upload error: ${e.message}`);
};

const getDirectoryFiles = async (directoryPath) => {
    const res = {
        files: [],
        links: [],
        linkTargets: [],
    };
    const files = await readdir(directoryPath, { withFileTypes: true, recursive: true });

    files.forEach((file) => {
        const fullName = join(file.path, file.name);
        if (!filterFiles(fullName)) {
            return;
        }

        if (file.isSymbolicLink()) {
            res.links.push(file);
        } else if (file.isFile()) {
            res.files.push(file);
        }
    });

    for (const item of res.links) {
        const fullName = join(item.path, item.name);
        const linkValue = await readlink(fullName);
        const linkTarget = await stat(linkValue);

        const extendedItem = {
            path: item.path,
            name: item.name,
            fullName,
            linkValue,
            linkTarget,
        };

        if (linkTarget.isDirectory()) {
            extendedItem.child = await getDirectoryFiles(linkValue);
            res.files.push(...extendedItem.child.files);
        }

        res.linkTargets.push(extendedItem);
    }

    return res;
};

try {
    client.on('error', onError);

    const srcDir = await getDirectoryFiles(src);

    progress = new ProgressBar('[:bar] :percent :file', {
        total: srcDir.files.length + 1,
        width: 20,
        complete: '█',
        incomplete: ' ',
    });

    await client.connect(config);
    client.on('upload', (info) => {
        progress.tick({
            file: info.source.substring(src.length + 1),
        });
    });

    // Prepare empty deploy directory
    if (isFullDeploy) {
        await removeIfExists(deployPath);
        await client.mkdir(deployPath, true);
    }

    console.log(`Deploy from: ${src} to: ${deployPath}`);

    await client.uploadDir(src, deployPath, {
        filter: filterFiles,
    });

    if (isFullDeploy) {
        for (const item of srcDir.linkTargets) {
            const srcPath = join(sources, item.name);
            const childDeployPath = destPath(deployDir, item.name);

            await client.mkdir(childDeployPath, true);
            await client.chmod(childDeployPath, 0o0755);

            await client.uploadDir(srcPath, childDeployPath);
        }
    }

    progress.tick({ file: 'Upload done' });

    if (isFullDeploy) {
        // Rename current app/ directory to backup/ if available
        const appDirType = await client.exists(appPath);
        if (appDirType === 'd') {
            backupPath = destPath(APP_BACKUP_DIR);
            await removeIfExists(backupPath);
            await client.rename(appPath, backupPath);
        }
        // Rename deploy/ directory to app/
        await client.rename(deployPath, appPath);

        // Upload root .htaccess file
        await client.put(
            join(distRoot, HTACCESS_FILE),
            destPath(HTACCESS_FILE),
        );

        // Create directories
        for (const item of createDirs) {
            const itemPath = [appPath, item].join('/');
            console.log(`Creating ${itemPath}`);

            await client.mkdir(itemPath, true);
            await client.chmod(itemPath, 0o0755);
        }

        // Check deploy status and update DB version if needed
        const response = await fetch(process.env.DB_VERSION_URL);
        const apiRes = await response.json();
        if (apiRes?.result !== 'ok' || apiRes.data.current !== apiRes.data.latest) {
            throw new Error('Version check failed');
        }

        // Remove all excess paths
        const list = await client.list(dest);
        for (const item of list) {
            const firstPart = getFirstPathPart(item.name);
            if (removeSkipList.includes(firstPart)) {
                continue;
            }

            const itemPath = destPath(item.name);

            console.log(`Removing ${itemPath}`);
            await removeByType(itemPath, item.type);
        }
    }

    processRes = 0;
} catch (e) {
    onError(e);
} finally {
    client.end();
    process.exit(processRes);
}
