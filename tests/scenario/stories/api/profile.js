import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { SORT_BY_CREATEDATE_ASC, SORT_BY_CREATEDATE_DESC, SORT_BY_NAME_ASC } from '../../../common.js';
import * as ApiTests from '../../../actions/api/index.js';

const runTests = async () => {
    setBlock('Profile', 2);

    const resetAllOptions = {
        accounts: true,
        persons: true,
        transactions: true,
        importtpl: true,
        importrules: true,
    };

    await ApiTests.resetData({ accounts: true });
    await ApiTests.resetData(resetAllOptions);
    await ApiTests.loginTest(App.config.apiTestUser);
    await ApiTests.resetData(resetAllOptions);

    await ApiTests.changeName('');
    await ApiTests.changeName('App tester');

    await ApiTests.updateSettings({ sort_accounts: SORT_BY_NAME_ASC });
    await ApiTests.updateSettings({ sort_persons: SORT_BY_NAME_ASC });
    await ApiTests.updateSettings({ sort_categories: SORT_BY_NAME_ASC });
    await ApiTests.updateSettings({
        sort_accounts: SORT_BY_CREATEDATE_DESC,
        sort_persons: SORT_BY_CREATEDATE_DESC,
        sort_categories: SORT_BY_CREATEDATE_DESC,
    });
    await ApiTests.updateSettings({
        sort_accounts: SORT_BY_CREATEDATE_ASC,
        sort_persons: SORT_BY_CREATEDATE_ASC,
        sort_categories: SORT_BY_CREATEDATE_ASC,
    });
    await ApiTests.updateSettings({ sort_accounts: null });
    await ApiTests.updateSettings({ sort_persons: '123' });
    await ApiTests.updateSettings({ sort_categories: 100 });

    await ApiTests.changePassword({ user: App.config.apiTestUser, newPassword: '54321' });
    await ApiTests.deleteProfile();
};

export const apiProfileTests = {
    async run() {
        await runTests();
    },
};
