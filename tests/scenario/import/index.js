import { setBlock, assert } from 'jezve-test';
import { generateAccountCSV, generateCardCSV } from '../../model/import.js';
import { api } from '../../model/api.js';
import * as ApiTests from '../../run/api/index.js';
import * as ImportTests from '../../run/import/index.js';
import { App } from '../../Application.js';
import { importItemsTests } from './items.js';
import { importRuleTests } from './rules.js';
import { importTemplateTests } from './templates.js';

let cardFile = null;
let accountFile = null;
const files = [];

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
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        template: 0,
    });
    await ImportTests.enableItems({
        index: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        value: false,
    });
    await ImportTests.submit();
};

const runCheckSimilarTests = async () => {
    setBlock('Enable/disable check similar transactions', 1);
    // Check option change is correctly update already uploaded transactions
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        account: App.scenario.ACC_RUB,
    });
    await ImportTests.enableCheckSimilar(false);
    await ImportTests.enableCheckSimilar(true);
    await ImportTests.enableCheckSimilar(false);
    // Check option change is correctly affect on new uploaded transactions
    await ImportTests.deleteAllItems();
    await ImportTests.uploadFile(cardFile);
    await ImportTests.submitUploaded({
        ...cardFile,
        account: App.scenario.ACC_RUB,
    });
    await ImportTests.enableCheckSimilar(true);
    await ImportTests.deleteAllItems();
};

const putFile = async (data) => {
    const filename = await ImportTests.putFile(data);
    assert(filename, 'Fail to put file');

    return { data, filename };
};

const putCardCSV = async () => {
    const now = new Date();
    const data = generateCardCSV([
        [now, 'MOBILE', 'MOSKVA', 'RU', 'RUB', '-500.00'],
        [now, 'SALON', 'SANKT-PETERBU', 'RU', 'RUB', '-80.00'],
        [now, 'OOO SIGMA', 'MOSKVA', 'RU', 'RUB', '-128.00'],
        [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-188.00'],
        [now, 'TAXI', 'MOSKVA', 'RU', 'RUB', '-306.00'],
        [now, 'MAGAZIN', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
        [now, 'BAR', 'SANKT-PETERBU', 'RU', 'RUB', '-443.00'],
        [now, 'DOSTAVKA', 'SANKT-PETERBU', 'RU', 'RUB', '-688.00'],
        [now, 'PRODUCTY', 'SANKT-PETERBU', 'RU', 'RUB', '-550.5'],
        [now, 'BOOKING', 'AMSTERDAM', 'NL', 'EUR', '-500.00', 'RUB', '-50 750.35'],
        [now, 'SALARY', 'MOSKVA', 'RU', 'RUB', '100 000.00'],
        [now, 'INTEREST', 'SANKT-PETERBU', 'RU', 'RUB', '23.16'],
        [now, 'RBA R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-5 000.00'],
        [now, 'C2C R-BANK', 'SANKT-PETERBU', 'RU', 'RUB', '-10 000.00'],
    ]);

    return putFile(data);
};

const putAccountCSV = async () => {
    const now = new Date();
    const data = generateAccountCSV([
        [now, 'MOBILE', 'RUB', '-500.00'],
        [now, 'SALON', 'RUB', '-80.00'],
        [now, 'OOO SIGMA', 'RUB', '-128.00'],
        [now, 'TAXI', 'RUB', '-188.00'],
        [now, 'TAXI', 'RUB', '-306.00'],
        [now, 'MAGAZIN', 'RUB', '-443.00'],
        [now, 'BAR', 'RUB', '-443.00'],
        [now, 'DOSTAVKA', 'RUB', '-688.00'],
        [now, 'PRODUCTY', 'RUB', '-550.5'],
        [now, 'BOOKING', 'EUR', '-500.00', 'RUB', '-50 750.35'],
        [now, 'SALARY', 'RUB', '100 000.00'],
        [now, 'CASHBACK', 'PLN', '136.50', 'RUB', '4 257.11'],
        [now, 'INTEREST', 'RUB', '23.16'],
        [now, 'RBA R-BANK', 'RUB', '-5 000.00'],
        [now, 'C2C R-BANK', 'RUB', '-10 000.00'],
    ]);

    return putFile(data);
};

/** Login as admin and upload CSV files  */
const prepareFiles = async () => {
    await ApiTests.loginTest(App.config.testAdminUser);

    cardFile = await putCardCSV();
    accountFile = await putAccountCSV();
    files.push(cardFile, accountFile);

    await ApiTests.loginTest(App.config.testUser);
};

/** Login as admin and remove previously uploaded files */
const removeFiles = async () => {
    await ApiTests.loginTest(App.config.testAdminUser);

    await ImportTests.removeFile(cardFile.filename);
    cardFile = null;
    await ImportTests.removeFile(accountFile.filename);
    accountFile = null;
    files.length = 0;

    await ApiTests.loginTest(App.config.testUser);
};

export const importTests = {
    async prepare() {
        await api.profile.resetData({
            accounts: true,
            persons: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });
        await App.state.fetch();

        await prepareFiles();
        await App.scenario.createAccounts();
        await App.scenario.createPersons();
    },

    async clean() {
        await removeFiles();
    },

    /** Run import view tests */
    async run() {
        setBlock('Import', 1);

        await this.prepare();

        await ImportTests.checkInitialState();
        await importRuleTests.run();
        await importItemsTests.createTests();

        await importTemplateTests.run({ files });

        // Obtain card template
        const template = App.state.templates.getItemByIndex(0);
        assert(template?.id, 'Template not found');
        await importRuleTests.createTemplateRule(template.id);

        setBlock('Upload CSV with invalid account', 2);
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded({
            ...cardFile,
            account: App.scenario.ACC_USD,
        });

        setBlock('Check main account is updated after select it at upload dialog', 2);
        await ImportTests.changeMainAccount(App.scenario.ACC_RUB);

        setBlock('Convert transactions', 2);
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        setBlock('Check pagination', 2);
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.addItem();
        await ImportTests.goToPrevPage();
        await ImportTests.submit();

        // Delete all
        setBlock('Delete all items', 2);
        await ImportTests.deleteAllItems();

        await runCheckSimilarTests();

        // Enable/disable rules
        setBlock('Enable/disable rules', 1);
        // Upload again
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded({
            ...cardFile,
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
