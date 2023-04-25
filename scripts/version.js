import { readFileSync, writeFileSync } from 'fs';

/* eslint-disable no-console */

const getPackageVersion = (fileName) => {
    const content = readFileSync(fileName);
    const json = JSON.parse(content);
    return json.version;
};

const updateFile = (fileName, version) => {
    if (typeof version !== 'string' || version.length === 0) {
        throw new Error('Invalid version argument');
    }

    const content = readFileSync(fileName);
    const strContent = content.toString();
    const expr = /"version"\s*:\s*"(.*?)"/;

    const matches = strContent.match(expr);
    if (matches === null) {
        throw new Error('Version not found');
    }

    const [, currentVersion] = matches;
    if (currentVersion === version) {
        return;
    }

    const updatedContent = strContent.replace(expr, `"version": "${version}"`);

    console.log('Version updated: ', currentVersion, ' -> ', version);

    if (strContent === updatedContent) {
        throw new Error('Version not found');
    }

    writeFileSync(fileName, updatedContent);
};

let res = 1;

try {
    const version = getPackageVersion('./package.json');
    updateFile('composer.json', version);

    res = 0;
} catch (e) {
    console.log('Error: ', e.message);
} finally {
    process.exit(res);
}
