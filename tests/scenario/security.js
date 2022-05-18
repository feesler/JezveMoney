import * as SecurityTests from '../run/security.js';
import { setBlock } from '../env.js';

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
