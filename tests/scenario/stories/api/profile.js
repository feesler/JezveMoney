import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as ApiTests from '../../../run/api/index.js';

const runTests = async () => {
    setBlock('Profile', 2);

    const resetAllOptions = {
        accounts: true,
        persons: true,
        transactions: true,
        importtpl: true,
        importrules: true,
    };

    const tasks = [{
        action: ApiTests.resetData, data: { accounts: true },
    }, {
        action: ApiTests.resetData,
        data: resetAllOptions,
    }, {
        action: ApiTests.loginTest,
        data: App.config.apiTestUser,
    }, {
        action: ApiTests.resetData,
        data: resetAllOptions,
    }, {
        action: ApiTests.changeName,
        data: '',
    }, {
        action: ApiTests.changeName,
        data: 'App tester',
    }, {
        action: ApiTests.changePassword,
        data: { user: App.config.apiTestUser, newPassword: '54321' },
    }, {
        action: ApiTests.deleteProfile,
    }];

    return App.scenario.runner.runTasks(tasks);
};

export const apiProfileTests = {
    async run() {
        await runTests();
    },
};
