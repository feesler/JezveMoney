import * as dotenv from 'dotenv';
import Client from 'ssh2-sftp-client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const skipDirectories = [
    'vendor',
];

let res = 1;
try {
    console.log(`Deploy from: ${src} to: ${dest}`);

    await client.connect(config);
    client.on('upload', (info) => {
        console.log(`Uploaded ${info.source}`);
    });

    await client.uploadDir(src, dest, {
        filter: (source, isDir) => {
            const relPath = source.startsWith(src) ? source.substring(src.length + 1) : source;
            return (!isDir || !skipDirectories.includes(relPath));
        },
    });

    console.log('Done');

    res = 0;
} catch (e) {
    console.log('Error: ', e.message);
} finally {
    client.end();
    process.exit(res);
}
