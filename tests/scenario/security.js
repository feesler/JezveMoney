import { setBlock } from 'jezve-test';
import * as SecurityTests from '../run/security.js';

let scenario = null;

export const securityTests = {
    /** Initialize tests */
    init(scenarioInstance) {
        scenario = scenarioInstance;
    },

    /** Run security tests */
    async run() {
        setBlock('Security tests', 1);

        await scenario.runner.runGroup(SecurityTests.checkAccess, [
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

    /** Initialize and run tests */
    async initAndRun(scenarioInstance) {
        this.init(scenarioInstance);
        await this.run();
    },
};
