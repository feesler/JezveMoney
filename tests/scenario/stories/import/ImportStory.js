import { setBlock } from 'jezve-test';
import { TestStory } from '../../TestStory.js';
import { api } from '../../../model/api.js';
import * as ImportTests from '../../../run/import/index.js';
import { App } from '../../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

export class ImportStory extends TestStory {
    async beforeRun() {
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
    }

    async afterRun() {
        await App.scenario.removeCsvFiles();
    }

    async run() {
        setBlock('Import', 1);

        await ImportTests.checkInitialState();
        await importTemplateTests.run();
        await importRuleTests.run();
        await importItemsTests.run();

        await importRuleTests.runNoPersonsTest();
        await this.noAccounts();
    }

    async noAccounts() {
        setBlock('Import view with no accounts', 2);

        const accountIds = App.state.accounts.getIds();
        if (accountIds.length) {
            await api.account.del(accountIds);
        }

        await ImportTests.checkInitialState();
    }
}
