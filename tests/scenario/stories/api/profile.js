import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { SORT_BY_CREATEDATE_ASC, SORT_BY_CREATEDATE_DESC, SORT_BY_NAME_ASC } from '../../../common.js';
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

    const tasks = [
        { action: ApiTests.resetData, data: { accounts: true } },
        { action: ApiTests.resetData, data: resetAllOptions },
        { action: ApiTests.loginTest, data: App.config.apiTestUser },
        { action: ApiTests.resetData, data: resetAllOptions },
        { action: ApiTests.changeName, data: '' },
        { action: ApiTests.changeName, data: 'App tester' },
        { action: ApiTests.updateSettings, data: { sort_accounts: SORT_BY_NAME_ASC } },
        { action: ApiTests.updateSettings, data: { sort_persons: SORT_BY_NAME_ASC } },
        { action: ApiTests.updateSettings, data: { sort_categories: SORT_BY_NAME_ASC } },
        {
            action: ApiTests.updateSettings,
            data: {
                sort_accounts: SORT_BY_CREATEDATE_DESC,
                sort_persons: SORT_BY_CREATEDATE_DESC,
                sort_categories: SORT_BY_CREATEDATE_DESC,
            },
        },
        {
            action: ApiTests.updateSettings,
            data: {
                sort_accounts: SORT_BY_CREATEDATE_ASC,
                sort_persons: SORT_BY_CREATEDATE_ASC,
                sort_categories: SORT_BY_CREATEDATE_ASC,
            },
        },
        { action: ApiTests.updateSettings, data: { sort_accounts: null } },
        { action: ApiTests.updateSettings, data: { sort_persons: '123' } },
        { action: ApiTests.updateSettings, data: { sort_categories: 100 } },
        {
            action: ApiTests.changePassword,
            data: { user: App.config.apiTestUser, newPassword: '54321' },
        },
        { action: ApiTests.deleteProfile },
    ];

    return App.scenario.runner.runTasks(tasks);
};

export const apiProfileTests = {
    async run() {
        await runTests();
    },
};
