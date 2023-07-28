import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import Client from 'ssh2-sftp-client';

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

const createDirs = ['system/logs', 'system/uploads'];

const option = (process.argv.length > 2) ? process.argv[2] : null;
const isFullDeploy = option?.toLowerCase() === 'full';

let res = 1;
try {
    await client.connect(config);
    client.on('upload', (info) => {
        console.log(`Uploaded ${info.source}`);
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
        filter: (source, isDir) => {
            if (isFullDeploy) {
                return true;
            }

            const relPath = source.startsWith(src) ? source.substring(src.length + 1) : source;
            return (!isDir || !skipList.includes(relPath));
        },
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

    console.log('Done');

    res = 0;
} catch (e) {
    console.log('Error: ', e.message);
} finally {
    client.end();
    process.exit(res);
}
