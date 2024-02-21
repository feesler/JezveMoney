import * as dotenv from 'dotenv';
import { commitVersion } from '@jezvejs/release-tools';

dotenv.config();

const run = async () => {
    await commitVersion({
        versionFiles: [
            'package.json',
            'package-lock.json',
            'composer.json',
            'composer.lock',
        ],
        gitDir: process.env.PROJECT_GIT_DIR,
        mainBranch: 'master',
    });
};

run();
