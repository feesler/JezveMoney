import { setBlock } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { api } from '../../../model/api.js';
import { App } from '../../../Application.js';

// Create import template tests
const create = async () => {
    setBlock('Create import template', 2);
    // Select columns for template
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 2 },
    ]);

    setBlock('Verify template with empty name not submitted', 2);
    await ImportTests.submitTemplate();
    await ImportTests.inputTemplateName('Template_1');

    setBlock('Verify template with empty first row not submitted', 2);
    await ImportTests.inputTemplateFirstRow('');
    await ImportTests.submitTemplate();

    setBlock('Submit valid template', 2);
    await ImportTests.inputTemplateFirstRow(2);
    await ImportTests.toggleTemplateAccount();
    await ImportTests.selectTemplateAccountByIndex(1);
    await ImportTests.submitTemplate();

    setBlock('Create second template', 2);
    await ImportTests.createTemplate();
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_dup');
    await ImportTests.submitTemplate();
};

// Update import template tests
const update = async () => {
    setBlock('Update import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.updateTemplate();
    await ImportTests.inputTemplateName('Template_2');
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'transactionAmount', index: 11 },
        { column: 'transactionCurrency', index: 10 },
    ]);
    await ImportTests.toggleTemplateAccount();
    await ImportTests.submitTemplate();
};

// Delete import template tests
const del = async () => {
    setBlock('Delete import template', 2);

    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.deleteTemplate();
};

// Automatic select valid template
const autoSelect = async () => {
    setBlock('Automatically select valid template on upload', 2);

    const { cardFile, accountFile } = App.scenario;

    await ImportTests.uploadFile(accountFile);

    await ImportTests.createTemplate();
    // Select columns for template
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 6 },
        { column: 'transactionAmount', index: 4 },
        { column: 'accountCurrency', index: 5 },
        { column: 'transactionCurrency', index: 3 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 2 },
    ]);
    // Input template name, select account and save
    await ImportTests.inputTemplateName('Template_Account');
    await ImportTests.toggleTemplateAccount();
    await ImportTests.selectTemplateAccountByIndex(1);
    await ImportTests.submitTemplate();

    // Upload card file and check 1st template is selected
    await ImportTests.uploadFile(cardFile);
    // Upload accounts again and check 2nd template is selected
    await ImportTests.uploadFile(accountFile);

    await ImportTests.closeUploadDialog();
};

// Template first row option test
const firstRow = async () => {
    setBlock('Template first row option', 2);

    const { accountFile } = App.scenario;

    await ImportTests.uploadFile(accountFile);

    await ImportTests.selectTemplateByIndex(1);
    await ImportTests.updateTemplate();
    await ImportTests.inputTemplateFirstRow('');
    await ImportTests.increaseTemplateFirstRow();
    await ImportTests.inputTemplateFirstRow(4);
    await ImportTests.decreaseTemplateFirstRow();
    await ImportTests.submitTemplate();

    await ImportTests.submitUploaded(accountFile);
    await ImportTests.deleteAllItems();
};

// Template first row option test
const resetAccounts = async () => {
    setBlock('Check templates after delete and reset accounts', 2);

    const { RUB, cardFile } = App.scenario;

    const { id: account1 } = await api.account.create({
        name: 'Tpl Test Account 1',
        curr_id: RUB,
        initbalance: '1',
        icon_id: 1,
        flags: 0,
    });
    const { id: account2 } = await api.account.create({
        name: 'Tpl Test Account 2',
        curr_id: RUB,
        initbalance: '1',
        icon_id: 1,
        flags: 0,
    });
    // Remove all templates
    await App.scenario.resetData({
        importtpl: true,
    });

    await App.view.navigateToImport();
    await ImportTests.uploadFile(cardFile);

    // Create template with first account
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_Acc_1');
    await ImportTests.toggleTemplateAccount();
    await ImportTests.selectTemplateAccountById(account1);
    await ImportTests.submitTemplate();

    // Create template with second account
    await ImportTests.createTemplate();
    await App.scenario.runner.runGroup(ImportTests.selectTemplateColumn, [
        { column: 'accountAmount', index: 11 },
        { column: 'transactionAmount', index: 9 },
        { column: 'accountCurrency', index: 10 },
        { column: 'transactionCurrency', index: 8 },
        { column: 'date', index: 1 },
        { column: 'comment', index: 4 },
    ]);
    await ImportTests.inputTemplateName('Template_Acc_2');
    await ImportTests.toggleTemplateAccount();
    await ImportTests.selectTemplateAccountById(account2);
    await ImportTests.submitTemplate();

    // Check account changed on change template
    await ImportTests.selectTemplateByIndex(0);
    await ImportTests.selectTemplateByIndex(1);

    // Remove first account
    await api.account.del(account1);
    await App.state.fetch();
    // Reload page
    await App.view.navigateToImport();
    await ImportTests.uploadFile(cardFile);
    await ImportTests.deleteTemplate();

    // Reset accounts
    await App.scenario.resetData({
        accounts: true,
    });
    // Create account to load import view
    await api.account.create({
        name: 'Tpl Test Account 3',
        curr_id: RUB,
        initbalance: '1',
        icon_id: 1,
        flags: 0,
    });
    // Reload page
    await App.view.navigateToImport();
    await ImportTests.uploadFile(cardFile);
    await ImportTests.deleteTemplate();
};

export const importTemplateTests = {
    /** Run import template tests */
    async run() {
        setBlock('Import templates', 1);

        setBlock('Upload card CSV', 2);
        await ImportTests.uploadFile(App.scenario.cardFile);

        await create();
        await update();
        await del();

        await autoSelect();
        await firstRow();
    },

    async runResetAccountsTest() {
        await resetAccounts();
    },
};
