import { setBlock } from 'jezve-test';
import { api } from '../../model/api.js';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

const noAccounts = async () => {
    setBlock('Import view with no accounts', 2);

    const accountIds = App.state.accounts.getIds();
    if (accountIds.length) {
        await api.account.del(accountIds);
    }

    await ImportTests.checkInitialState();
};

export const importTests = {
    async prepare() {
        await App.scenario.prepareTestUser();

        await api.profile.resetData({
            accounts: true,
            persons: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });
        await App.state.fetch();

        await App.scenario.createCsvFiles();
        await App.scenario.createAccounts();
        await App.scenario.createPersons();
    },

    async clean() {
        await App.scenario.removeCsvFiles();
    },

    /** Run import view tests */
    async run() {
        setBlock('Import', 1);

        await this.prepare();

        await ImportTests.checkInitialState();
        await importTemplateTests.run();
        await importRuleTests.run();
        await importItemsTests.run();

        await importRuleTests.runNoPersonsTest();
        await noAccounts();

        await this.clean();
    },
};
