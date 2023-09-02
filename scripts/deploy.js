import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'node:fs/promises';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import Client from 'ssh2-sftp-client';
import ProgressBar from 'progress';

/* eslint-disable no-console */

const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

dotenv.config();

const config = {
    host: process.env.SFTP_SERVER,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASSWORD,
    port: process.env.SFTP_PORT,
};

const client = new Client();
const src = join(currentDir, '..', 'dist');
const dest = process.env.DEPLOY_PATH;

const skipList = [
    'vendor',
];

const createDirs = ['system/logs', 'system/uploads', 'admin/view/tests'];

const option = (process.argv.length > 2) ? process.argv[2] : null;
const isFullDeploy = option?.toLowerCase() === 'full';

let res = 1;
let progress = null;

const filterFiles = (source) => {
    if (isFullDeploy) {
        return true;
    }

    const relPath = source.startsWith(src) ? source.substring(src.length + 1) : source;
    const relPathParts = relPath.split(/[\\/]/);
    const firstPart = relPathParts[0].toLowerCase();

    return (!skipList.includes(firstPart));
};

try {
    // Obtain total count of files
    const files = await readdir(src, { withFileTypes: true, recursive: true });

    const total = files.reduce((prev, file) => {
        const fullName = join(file.path, file.name);
        const pass = filterFiles(fullName) && file.isFile();
        return (prev + (pass ? 1 : 0));
    }, 1);

    progress = new ProgressBar('[:bar] :percent :file', {
        total,
        width: 20,
    });

    await client.connect(config);
    client.on('upload', (info) => {
        progress.tick({
            file: info.source.substring(src.length + 1),
        });
    });

    if (isFullDeploy) {
        const list = await client.list(dest);
        for (const item of list) {
            const itemPath = [dest, item.name].join('/');

            console.log(`Removing ${itemPath}`);
            if (item.type === 'd') {
                await client.rmdir(itemPath, true);
            } else {
                await client.delete(itemPath, true);
            }
        }
    }

    console.log(`Deploy from: ${src} to: ${dest}`);

    await client.uploadDir(src, dest, {
        filter: filterFiles,
    });

    progress.tick({
        file: 'Done',
    });

    if (isFullDeploy) {
        for (const item of createDirs) {
            const itemPath = [dest, item].join('/');
            console.log(`Creating ${itemPath}`);

            await client.mkdir(itemPath, true);
            await client.chmod(itemPath, 0o0755);
        }
    }

    const response = await fetch(process.env.DB_VERSION_URL);
    const apiRes = await response.json();
    if (apiRes?.result !== 'ok' || apiRes.data.current !== apiRes.data.latest) {
        throw new Error('Version check failed');
    }

    res = 0;
} catch (e) {
    progress?.interrupt(`Upload error: ${e.message}`);
} finally {
    client.end();
    process.exit(res);
}
