import { release } from '@jezvejs/release-tools';

/* eslint-disable no-console */

if (process.argv.length < 2) {
    console.log('Usage: release.js <newversion>');
    process.exit(1);
}

const newVersion = process.argv[2];

const run = async () => {
    await release({
        newVersion,
        beforeCommit: [
            'update-composer',
        ],
        deployCommand: 'deploy -- full',
        publish: false,
    });

    process.exit(0);
};

run();
