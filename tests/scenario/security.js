import { setBlock } from 'jezve-test';
import * as SecurityTests from '../run/security.js';
import { App } from '../Application.js';

export const securityTests = {
    /** Run security tests */
    async run() {
        setBlock('Security tests', 1);

        await App.scenario.runner.runGroup(SecurityTests.checkAccess, [
            '.htaccess',
            'composer.json',
            'composer.lock',
            'manifest.webmanifest',
            'system',
            'system/logs/log.txt',
            'Model/',
            'Controller/',
            'view/',
            'api/',
            'admin/',
        ]);
    },
};
