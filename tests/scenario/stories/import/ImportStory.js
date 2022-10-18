import { setBlock, TestStory } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { App } from '../../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

export class ImportStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });

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

        await App.scenario.resetData({
            accounts: true,
        });

        await App.goToMainView();
        await ImportTests.checkInitialState();
    }
}
