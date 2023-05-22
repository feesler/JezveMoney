import { setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import { SORT_BY_CREATEDATE_ASC, SORT_BY_CREATEDATE_DESC, SORT_BY_NAME_ASC } from '../../../common.js';
import * as Actions from '../../../actions/api/index.js';

const runTests = async () => {
    setBlock('Profile', 2);

    const resetAllOptions = {
        accounts: true,
        persons: true,
        transactions: true,
        schedule: true,
        importtpl: true,
        importrules: true,
    };

    await Actions.resetData({ accounts: true });
    await Actions.resetData(resetAllOptions);
    await Actions.loginTest(App.config.apiTestUser);
    await Actions.resetData(resetAllOptions);

    await Actions.changeName('');
    await Actions.changeName('App tester');

    await Actions.updateSettings({ sort_accounts: SORT_BY_NAME_ASC });
    await Actions.updateSettings({ sort_persons: SORT_BY_NAME_ASC });
    await Actions.updateSettings({ sort_categories: SORT_BY_NAME_ASC });
    await Actions.updateSettings({
        sort_accounts: SORT_BY_CREATEDATE_DESC,
        sort_persons: SORT_BY_CREATEDATE_DESC,
        sort_categories: SORT_BY_CREATEDATE_DESC,
    });
    await Actions.updateSettings({
        sort_accounts: SORT_BY_CREATEDATE_ASC,
        sort_persons: SORT_BY_CREATEDATE_ASC,
        sort_categories: SORT_BY_CREATEDATE_ASC,
    });
    await Actions.updateSettings({ sort_accounts: null });
    await Actions.updateSettings({ sort_persons: '123' });
    await Actions.updateSettings({ sort_categories: 100 });

    await Actions.changePassword({ user: App.config.apiTestUser, newPassword: '54321' });
    await Actions.deleteProfile();
};

export const apiProfileTests = {
    async run() {
        await runTests();
    },
};
