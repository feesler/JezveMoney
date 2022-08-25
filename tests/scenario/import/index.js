import { setBlock, assert } from 'jezve-test';
import { generateCSV } from '../../model/import.js';
import { api } from '../../model/api.js';
import * as ApiTests from '../../run/api/index.js';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

let csvStatement = null;
let uploadFilename = null;

const runSubmitImportTests = async () => {
    await ImportTests.submit();
    // Verify submit is disabled for empty list
    setBlock('Verify submit is disabled for empty list', 2);
    await ImportTests.submit();

    setBlock('Verify invalid items are not submitted', 2);
    // Empty amount
    await ImportTests.addItem();
    await ImportTests.submit();

    // Zero amount
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputAmount', data: '0' },
    });
    await ImportTests.submit();

    // Valid amount, different currencies and empty dest amount
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputAmount', data: '1' },
            { action: 'changeCurrency', data: App.scenario.USD },
        ],
    });
    await ImportTests.submit();

    // Empty date
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputDestAmount', data: '2' },
            { action: 'inputDate', data: '' },
        ],
    });
    await ImportTests.submit();

    // Invalid date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: '2.ssa' },
    });
    await ImportTests.submit();

    // Correct date
    await ImportTests.updateItem({
        pos: 0,
        action: { action: 'inputDate', data: App.dates.now },
    });
    await ImportTests.submit();

    // Verify submit is disabled for list with no enabled items
    setBlock('Verify submit is disabled for list with no enabled items', 2);
    await ImportTests.uploadFile({
        filename: uploadFilename,
        data: csvStatement,
    });
    await ImportTests.submitUploaded({
        data: csvStatement,
        template: 0,
    });
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        value: false,
    });
    await ImportTests.submit();
};

export const importTests = {
    /** Upload CSV file for import tests */
    async prepare() {
        // Login as admin to upload CSV file
        await ApiTests.loginTest(App.config.testAdminUser);

        const now = new Date();
        csvStatement = generateCSV([
            [now, 'MOBILE', 'MOSKVA', 'RU', 'RUB', '-500.00'],
            [now, 'SALON', 'SANKT-PETERBU', 'RU', 'RUB', '-80.00'],
            [now, 'OOO SIGMA', 'MOSKVA', 'RU', 'RUB', '-128.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-188.00'],
            [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-306.00'],
            [now, 'MAGAZIN', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'BAR', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
            [now, 'DOSTAVKA', 'SANKT-PETERBU', 'RU', 'RUB', '-688.00'],
            [now, 'PRODUCTY', 'SANKT-PETERBU', 'RU', 'RUB', '-550.5'],
            [now, 'BOOKING', 'AMSTERDAM', 'NL', 'EUR', '-500.00', 'RUB', '-50750.35'],
            [now, 'SALARY', 'MOSKVA', 'RU', 'RUB', '100000.00'],
            [now, 'INTEREST', 'SANKT-PETERBU', 'RU', 'RUB', '23.16'],
            [now, 'RBA R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-5000.00'],
            [now, 'C2C R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-10000.00'],
        ]);

        uploadFilename = await ImportTests.putFile(csvStatement);
        assert(uploadFilename, 'Fail to put file');

        await ApiTests.loginTest(App.config.testUser);
    },

    /** Remove previously uploaded file */
    async clean() {
        await ApiTests.loginTest(App.config.testAdminUser);
        await ImportTests.removeFile(uploadFilename);
        uploadFilename = null;
        await ApiTests.loginTest(App.config.testUser);
    },

    /** Run import view tests */
    async run() {
        setBlock('Import', 1);

        await this.prepare();

        const accIndexes = App.state.getAccountIndexesByNames([
            'acc_3', 'acc RUB', 'acc USD', 'acc EUR',
        ]);
        [
            App.scenario.ACC_3,
            App.scenario.ACC_RUB,
            App.scenario.ACC_USD,
            App.scenario.ACC_EUR,
        ] = App.state.getAccountsByIndexes(accIndexes, true);
        const personIndexes = App.state.getPersonIndexesByNames([
            'Maria', 'Alex',
        ]);
        [
            App.scenario.MARIA,
            App.scenario.ALEX,
        ] = App.state.getPersonsByIndexes(personIndexes, true);

        await ImportTests.checkInitialState();
        await importRuleTests.run();
        await importItemsTests.createTests();

        // Upload CSV file
        setBlock('Upload CSV', 2);
        await ImportTests.uploadFile({
            filename: uploadFilename,
            data: csvStatement,
        });

        await importTemplateTests.run();

        // Convert transactions with invalid main account
        await ImportTests.submitUploaded({
            data: csvStatement,
            account: App.scenario.ACC_USD,
        });

        // Change account to check it updated even after close upload dialog
        await ImportTests.changeMainAccount(App.scenario.ACC_RUB);

        // Convert transactions
        await ImportTests.uploadFile({
            filename: uploadFilename,
            data: csvStatement,
        });
        await ImportTests.submitUploaded({
            data: csvStatement,
        });
        // Delete all
        setBlock('Delete all items', 2);
        await ImportTests.deleteAllItems();

        // Enable/disable rules
        setBlock('Enable/disable rules', 2);
        // Upload again
        await ImportTests.uploadFile({
            filename: uploadFilename,
            data: csvStatement,
        });
        await ImportTests.submitUploaded({
            data: csvStatement,
            account: App.scenario.ACC_RUB,
        });

        await ImportTests.enableRules(false);
        await ImportTests.enableRules(true);

        // Disable all items except 0 and 1
        await ImportTests.enableItems({
            index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            value: false,
        });
        await importItemsTests.deleteTests();
        await runSubmitImportTests();
        await importItemsTests.stateLoopTests();

        await this.clean();
    },

    async runNoAccountsTest() {
        setBlock('Import view with no accounts', 2);

        const accountIds = App.state.accounts.getIds();
        if (accountIds.length) {
            await api.account.del(accountIds);
        }

        await ImportTests.checkInitialState();
    },

    async runNoPersonsTest() {
        await importRuleTests.runNoPersonsTest();
    },
};
