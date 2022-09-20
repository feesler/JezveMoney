import { setBlock, assert } from 'jezve-test';
import { generateAccountCSV, generateCardCSV } from '../../model/import.js';
import { api } from '../../model/api.js';
import * as ApiTests from '../../run/api/index.js';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

let cardStatement = null;
let cardUploadFilename = null;
let accountStatement = null;
let accountUploadFilename = null;

const runSubmitImportTests = async () => {
    setBlock('Submit import transactions', 1);
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
        action: { action: 'inputDestAmount', data: '0' },
    });
    await ImportTests.submit();

    // Valid amount, different currencies and empty source amount
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeDestCurrency', data: App.scenario.USD },
            { action: 'inputSourceAmount', data: '' },
        ],
    });
    await ImportTests.submit();

    // Empty date
    await ImportTests.updateItem({
        pos: 0,
        action: [
            { action: 'inputSourceAmount', data: '2' },
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
        filename: cardUploadFilename,
        data: cardStatement,
    });
    await ImportTests.submitUploaded({
        data: cardStatement,
        template: 0,
    });
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        value: false,
    });
    await ImportTests.submit();
};

const putCardCSV = async () => {
    const now = new Date();
    cardStatement = generateCardCSV([
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

    cardUploadFilename = await ImportTests.putFile(cardStatement);
    assert(cardUploadFilename, 'Fail to put file');
};

const putAccountCSV = async () => {
    const now = new Date();
    accountStatement = generateAccountCSV([
        [now, 'MOBILE', 'RUB', '-500.00'],
        [now, 'SALON', 'RUB', '-80.00'],
        [now, 'OOO SIGMA', 'RUB', '-128.00'],
        [now, 'TAXI', 'RUB', '-188.00'],
        [now, 'TAXI', 'RUB', '-306.00'],
        [now, 'MAGAZIN', 'RUB', '-443.00'],
        [now, 'BAR', 'RUB', '-443.00'],
        [now, 'DOSTAVKA', 'RUB', '-688.00'],
        [now, 'PRODUCTY', 'RUB', '-550.5'],
        [now, 'BOOKING', 'EUR', '-500.00', 'RUB', '-50750.35'],
        [now, 'SALARY', 'RUB', '100000.00'],
        [now, 'CASHBACK', 'PLN', '136.50', 'RUB', '4257.11'],
        [now, 'INTEREST', 'RUB', '23.16'],
        [now, 'RBA R-BANK', 'RUB', '-5000.00'],
        [now, 'C2C R-BANK', 'RUB', '-10000.00'],
    ]);

    accountUploadFilename = await ImportTests.putFile(accountStatement);
    assert(accountUploadFilename, 'Fail to put file');
};

export const importTests = {
    /** Upload CSV file for import tests */
    async prepare() {
        // Login as admin to upload CSV file
        await ApiTests.loginTest(App.config.testAdminUser);

        await putCardCSV();
        await putAccountCSV();

        await ApiTests.loginTest(App.config.testUser);
    },

    /** Remove previously uploaded file */
    async clean() {
        await ApiTests.loginTest(App.config.testAdminUser);

        await ImportTests.removeFile(cardUploadFilename);
        cardUploadFilename = null;
        await ImportTests.removeFile(accountUploadFilename);
        accountUploadFilename = null;

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

        await importTemplateTests.run({
            files: [{
                filename: cardUploadFilename,
                data: cardStatement,
            }, {
                filename: accountUploadFilename,
                data: accountStatement,
            }],
        });

        // Obtain card template
        const template = App.state.templates.getItemByIndex(0);
        assert(template?.id, 'Template not found');
        await importRuleTests.createTemplateRule(template.id);

        // Convert transactions with invalid main account
        setBlock('Upload CSV with invalid account', 2);
        await ImportTests.uploadFile({
            filename: cardUploadFilename,
            data: cardStatement,
        });
        await ImportTests.submitUploaded({
            data: cardStatement,
            account: App.scenario.ACC_USD,
        });

        // Change account to check it updated even after close upload dialog
        setBlock('Check main account is updated after select it at upload dialog', 2);
        await ImportTests.changeMainAccount(App.scenario.ACC_RUB);

        // Convert transactions
        await ImportTests.uploadFile({
            filename: cardUploadFilename,
            data: cardStatement,
        });
        await ImportTests.submitUploaded({
            data: cardStatement,
        });
        // Delete all
        setBlock('Delete all items', 2);
        await ImportTests.deleteAllItems();

        // Enable/disable rules
        setBlock('Enable/disable rules', 2);
        // Upload again
        await ImportTests.uploadFile({
            filename: cardUploadFilename,
            data: cardStatement,
        });
        await ImportTests.submitUploaded({
            data: cardStatement,
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
