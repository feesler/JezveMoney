import { release } from '@jezvejs/release-tools';

/* eslint-disable no-console */

if (process.argv.length < 2) {
    console.log('Usage: release.js <newversion>');
    process.exit(1);
}

const newVersion = process.argv[2];

release({
    newVersion,
    beforeCommit: [
        'npm run update-composer',
    ],
    deployCommand: 'npm run deploy full',
    publish: false,
});
