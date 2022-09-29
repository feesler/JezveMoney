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

/** Login as admin and upload CSV files  */
const prepareFiles = async () => {
    await ApiTests.loginTest(App.config.testAdminUser);

    await putCardCSV();
    await putAccountCSV();

    await ApiTests.loginTest(App.config.testUser);
};

const prepareAccounts = async () => {
    const { RUB, USD, EUR } = App.scenario;

    const accList = [{
        name: 'ACC_3',
        curr_id: RUB,
        initbalance: '500.99',
        icon_id: 2,
        flags: 0,
    }, {
        name: 'ACC_RUB',
        curr_id: RUB,
        initbalance: '500.99',
        icon_id: 5,
        flags: 0,
    }, {
        name: 'ACC_USD',
        curr_id: USD,
        initbalance: '500.99',
        icon_id: 4,
        flags: 0,
    }, {
        name: 'ACC_EUR',
        curr_id: EUR,
        initbalance: '10000.99',
        icon_id: 3,
        flags: 0,
    }];

    for (const data of accList) {
        let account = App.state.accounts.findByName(data.name);
        if (!account) {
            account = await api.account.create(data);
        }
        App.scenario[data.name] = account.id;
    }
};

const preparePersons = async () => {
    const personsList = [
        { name: 'MARIA', flags: 0 },
        { name: 'ALEX', flags: 0 },
    ];

    for (const data of personsList) {
        let person = App.state.persons.findByName(data.name);
        if (!person) {
            person = await api.person.create(data);
        }
        App.scenario[data.name] = person.id;
    }
};

/** Login as admin and remove previously uploaded files */
const removeFiles = async () => {
    await ApiTests.loginTest(App.config.testAdminUser);

    await ImportTests.removeFile(cardUploadFilename);
    cardUploadFilename = null;
    await ImportTests.removeFile(accountUploadFilename);
    accountUploadFilename = null;

    await ApiTests.loginTest(App.config.testUser);
};

export const importTests = {
    async prepare() {
        await api.profile.resetData({
            transactions: true,
            importtpl: true,
            importrules: true,
        });
        await App.state.fetch();

        await prepareFiles();
        await prepareAccounts();
        await preparePersons();
        await App.state.fetch();
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

        setBlock('Upload CSV with invalid account', 2);
        await ImportTests.uploadFile({
            filename: cardUploadFilename,
            data: cardStatement,
        });
        await ImportTests.submitUploaded({
            data: cardStatement,
            account: App.scenario.ACC_USD,
        });

        setBlock('Check main account is updated after select it at upload dialog', 2);
        await ImportTests.changeMainAccount(App.scenario.ACC_RUB);

        setBlock('Convert transactions', 2);
        await ImportTests.uploadFile({
            filename: cardUploadFilename,
            data: cardStatement,
        });
        await ImportTests.submitUploaded({
            data: cardStatement,
        });
        setBlock('Check pagination', 2);
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
