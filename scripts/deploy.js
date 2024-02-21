import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { deploy, getFirstPathPart } from '@jezvejs/release-tools';

/* eslint-disable no-console */

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const { APP_DIR, DEPLOY_DIR } = process.env;
const HTACCESS_FILE = '.htaccess';

// Source paths to skip on partial upload
const skipList = ['vendor'];

const createDirs = ['system/logs', 'system/uploads', 'admin/view/tests'];
const removeSkipList = [APP_DIR, HTACCESS_FILE];

const option = (process.argv.length > 2) ? process.argv[2] : null;
const isFullDeploy = option?.toLowerCase() === 'full';

const run = async () => {
    const processRes = await deploy({
        clientConfig: {
            host: process.env.SFTP_SERVER,
            username: process.env.SFTP_USER,
            password: process.env.SFTP_PASSWORD,
            port: process.env.SFTP_PORT,
        },
        sourceDir: join(currentDir, '..', 'dist'),
        destDir: process.env.DEPLOY_PATH,
        appDir: process.env.APP_DIR,
        createDirs,
        deployDir: (isFullDeploy) ? DEPLOY_DIR : APP_DIR,
        uploadSymLinks: true,
        fullDeploy: isFullDeploy,
        removeSkipList,
        cleanAll: true,
        extraUpload: [HTACCESS_FILE],
        filterFiles: (source) => {
            const firstPart = getFirstPathPart(source);
            return (isFullDeploy || !skipList.includes(firstPart));
        },
        afterUpload: async () => {
            const response = await fetch(process.env.DB_VERSION_URL);
            const apiRes = await response.json();
            if (apiRes?.result !== 'ok' || apiRes.data.current !== apiRes.data.latest) {
                throw new Error('Version check failed');
            }
        },
    });

    process.exit(processRes);
};

run();
