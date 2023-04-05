import { setBlock, TestStory } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { api } from '../../../model/api.js';
import { App } from '../../../Application.js';

export class ImportTemplateStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
        await App.scenario.createCsvFiles();
        await App.scenario.createImportRules();

        await App.view.navigateToImport();
    }

    async afterRun() {
        await App.scenario.removeCsvFiles();
    }

    /** Run import template tests */
    async run() {
        setBlock('Import templates', 1);

        setBlock('Upload card CSV', 2);
        await ImportTests.uploadFile(App.scenario.cardFile);

        await this.create();
        await this.update();
        await this.del();

        await this.autoSelect();
        await this.firstRow();

        await this.resetAccounts();
    }

    // Create import template tests
    async create() {
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

        setBlock('Cancel template create', 2);
        await ImportTests.createTemplate();
        await ImportTests.cancelTemplate();

        setBlock('Create second template', 2);
        await ImportTests.addTemplate({
            name: 'Template_dup',
            accountAmount: 11,
            transactionAmount: 9,
            accountCurrency: 10,
            transactionCurrency: 8,
            date: 1,
            comment: 4,
        });

        setBlock('Create third template', 2);
        await ImportTests.addTemplate({
            name: 'Template_1_2',
            accountAmount: 11,
            transactionAmount: 9,
            accountCurrency: 10,
            transactionCurrency: 8,
            date: 1,
            comment: 4,
            account_id: App.scenario.CARD_RUB,
        });

        setBlock('Check main account changed on change template', 2);
        await ImportTests.selectTemplateByIndex(0);
        await ImportTests.selectTemplateByIndex(1);
        await ImportTests.selectTemplateByIndex(2);
    }

    // Update import template tests
    async update() {
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
    }

    // Delete import template tests
    async del() {
        setBlock('Delete import template', 2);

        await ImportTests.selectTemplateByIndex(0);
        await ImportTests.deleteTemplate();
        await ImportTests.selectTemplateByIndex(1);
        await ImportTests.deleteTemplate();
    }

    // Automatic select valid template
    async autoSelect() {
        setBlock('Automatically select valid template on upload', 2);

        const { cardFile, accountFile } = App.scenario;

        await api.importtemplate.create({
            name: 'Template_Account',
            type_id: 0,
            first_row: 2,
            account_id: App.scenario.ACC_RUB,
            account_amount_col: 6,
            account_curr_col: 5,
            trans_amount_col: 4,
            trans_curr_col: 3,
            date_col: 1,
            comment_col: 2,
        });
        await App.state.fetch();

        await App.view.navigateToImport();

        // Upload card file and check 1st template is selected
        await ImportTests.uploadFile(cardFile);
        // Upload accounts file and check 2nd template is selected
        await ImportTests.uploadFile(accountFile);

        await ImportTests.closeUploadDialog();
    }

    // Template first row option test
    async firstRow() {
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
    }

    // Template first row option test
    async resetAccounts() {
        setBlock('Check templates after delete and reset accounts', 2);

        const { RUB, cardFile } = App.scenario;

        const { id: account1 } = await api.account.create({
            type: 0,
            name: 'Tpl Test Account 1',
            curr_id: RUB,
            initbalance: '1',
            limit: 0,
            icon_id: 1,
            flags: 0,
        });
        const { id: account2 } = await api.account.create({
            type: 0,
            name: 'Tpl Test Account 2',
            curr_id: RUB,
            initbalance: '1',
            limit: 0,
            icon_id: 1,
            flags: 0,
        });
        // Remove all templates
        await App.scenario.resetData({
            importtpl: true,
        });

        // Create template with first account
        await api.importtemplate.create({
            name: 'Template_Acc_1',
            type_id: 0,
            first_row: 2,
            account_id: account1,
            account_amount_col: 11,
            account_curr_col: 10,
            trans_amount_col: 9,
            trans_curr_col: 8,
            date_col: 1,
            comment_col: 4,
        });
        // Create template with second account
        await api.importtemplate.create({
            name: 'Template_Acc_2',
            type_id: 0,
            first_row: 2,
            account_id: account2,
            account_amount_col: 11,
            account_curr_col: 10,
            trans_amount_col: 9,
            trans_curr_col: 8,
            date_col: 1,
            comment_col: 4,
        });
        // Remove first account
        await api.account.del({ id: account1 });
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
            type: 0,
            name: 'Tpl Test Account 3',
            curr_id: RUB,
            initbalance: '1',
            limit: 0,
            icon_id: 1,
            flags: 0,
        });
        // Reload page
        await App.view.navigateToImport();
        await ImportTests.uploadFile(cardFile);
        await ImportTests.deleteTemplate();
    }
}
