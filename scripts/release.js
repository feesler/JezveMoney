import runAll from 'npm-run-all';

/* eslint-disable no-console */

const runCommand = async (command) => {
    const options = {
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
    };

    try {
        const [result] = await runAll([command], options);
        if (result.code !== 0) {
            console.log('Command failed');
            process.exit(result.code);
        }
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }
};

if (process.argv.length < 2) {
    console.log('Usage: release.js <newversion>');
    process.exit(1);
}

const newVersion = process.argv[2];

const run = async () => {
    await runCommand('all');
    await runCommand(`p-version -- ${newVersion}`);
    await runCommand('p-install');
    await runCommand('p-update -- --save');

    await runCommand('build');
    await runCommand('update-composer');

    await runCommand('commit-version');

    await runCommand('deploy-full');
};

run();
