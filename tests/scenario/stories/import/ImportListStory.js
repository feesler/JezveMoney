import { setBlock, TestStory } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { App } from '../../../Application.js';

export class ImportListStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            transactions: true,
            importtpl: true,
            importrules: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCsvFiles();
        await App.scenario.createImportRules();
        await App.scenario.createImportTemplates();

        await App.view.navigateToImport();
    }

    async afterRun() {
        await App.scenario.removeCsvFiles();
    }

    async run() {
        setBlock('Import list', 1);

        await ImportTests.checkInitialState();

        await this.create();
        await this.uploadAccount();
        await this.convert();
        await this.pagination();
        await this.listModes();
        await this.checkSimilar();
        await this.enableDisableRules();
        await this.del();
        await this.submit();
        await this.stateLoop();

        await this.noAccounts();
    }

    async create() {
        setBlock('Add item', 2);

        await ImportTests.addItem(
            { action: 'inputDestAmount', data: '1' },
        );

        setBlock('Save item', 2);
        await ImportTests.saveItem();

        setBlock('Cancel item edit', 2);
        await ImportTests.updateItem({
            pos: 0,
            action: { action: 'inputDestAmount', data: '2' },
        });
        await ImportTests.cancelItem();
    }

    async uploadAccount() {
        setBlock('Upload CSV with invalid account', 2);

        await ImportTests.uploadFile(App.scenario.cardFile);
        await ImportTests.submitUploaded({
            ...App.scenario.cardFile,
            account: App.scenario.ACC_USD,
        });

        setBlock('Check main account is updated after select it at upload dialog', 2);
        await ImportTests.selectUploadAccount(App.scenario.ACC_RUB);
    }

    async convert() {
        setBlock('Convert transactions', 2);

        const { cardFile } = App.scenario;
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.deleteAllItems();
    }

    async pagination() {
        setBlock('Check pagination', 2);

        const { cardFile } = App.scenario;
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.createItemAndSave(
            { action: 'inputDestAmount', data: '1' },
        );
        await ImportTests.goToPrevPage(); // page 2
        await ImportTests.updateItemAndSave({
            pos: 21,
            action: { action: 'inputDestAmount', data: '2' },
        });
        await ImportTests.showMore(); // pages 2-3
        await ImportTests.goToPrevPage(); // page 2
        await ImportTests.goToFirstPage(); // page 1
        await ImportTests.showMore(); // pages 1-2
        await ImportTests.showMore(); // pages 1-3
        await ImportTests.goToFirstPage(); // page 1
        await ImportTests.goToNextPage(); // page 2

        await ImportTests.toggleSelectItems([21, 22]);
        await ImportTests.goToPrevPage(); // page 1
        await ImportTests.toggleSelectItems([11, 12]);
        await ImportTests.deleteSelectedItems();

        await ImportTests.deleteAllItems();
    }

    async listModes() {
        setBlock('List modes', 2);

        const { cardFile } = App.scenario;
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);
        await ImportTests.toggleSelectItems([0, 1]);
        await ImportTests.toggleSelectItems([0, 1]);
        await ImportTests.selectAllItems();
        await ImportTests.deselectAllItems();
        await ImportTests.toggleSelectItems([0, 1, 2]);
        await ImportTests.enableSelectedItems(false);
        await ImportTests.enableSelectedItems(true);
        await ImportTests.deleteSelectedItems();
        await ImportTests.setListMode();
        await ImportTests.setSortMode();
        await ImportTests.setListMode();

        await ImportTests.deleteAllItems();
    }

    async checkSimilar() {
        setBlock('Enable/disable check similar transactions', 1);

        const { cardFile } = App.scenario;

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
    }

    async enableDisableRules() {
        setBlock('Enable/disable rules', 1);

        const { cardFile } = App.scenario;

        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded({
            ...cardFile,
            account: App.scenario.ACC_RUB,
        });

        await ImportTests.enableRules(false);
        await ImportTests.enableRules(true);
    }

    async del() {
        setBlock('Delete import items', 2);

        await ImportTests.deleteItems([3, 5]);
    }

    async submit() {
        setBlock('Submit import transactions', 1);

        // Disable all items except 0 and 1 and submit
        // As result two first transactions will be found as similar
        await ImportTests.selectAllItems();
        await ImportTests.toggleSelectItems([0, 1]);
        await ImportTests.enableSelectedItems(false);
        await ImportTests.submit();
        // Verify submit is disabled for empty list
        setBlock('Verify submit is disabled for empty list', 2);
        await ImportTests.submit();

        setBlock('Verify invalid items are not submitted', 2);
        // Empty amount
        await ImportTests.createItemAndSave();

        // Zero amount
        await ImportTests.runFormActions(
            { action: 'inputDestAmount', data: '0' },
        );
        await ImportTests.saveItem();

        // Valid amount, different currencies and empty source amount
        await ImportTests.runFormActions([
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeDestCurrency', data: App.scenario.USD },
            { action: 'inputSourceAmount', data: '' },
        ]);
        await ImportTests.saveItem();

        // Empty date
        await ImportTests.runFormActions([
            { action: 'inputSourceAmount', data: '2' },
            { action: 'inputDate', data: '' },
        ]);
        await ImportTests.saveItem();

        // Correct date
        await ImportTests.runFormActions(
            { action: 'inputDate', data: App.dates.now },
        );
        await ImportTests.saveItem();
        await ImportTests.submit();

        // Verify submit is disabled for list with no enabled items
        setBlock('Verify submit is disabled for list with no enabled items', 2);
        await ImportTests.uploadFile(App.scenario.cardFile);
        await ImportTests.submitUploaded({
            ...App.scenario.cardFile,
            template: 0,
        });
        await ImportTests.selectAllItems();
        await ImportTests.enableSelectedItems(false);
        await ImportTests.submit();
    }

    async stateLoop() {
        const { RUB, USD } = App.scenario;

        setBlock('Import item state loop', 1);

        await ImportTests.changeMainAccount(App.scenario.ACC_3);

        await ImportTests.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeType', data: 'expense' }, // 3-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeDestCurrency', data: RUB }, // 2-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeType', data: 'expense' }, // 3-1
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeType', data: 'transferto' }, // 1-7
                { action: 'changeType', data: 'expense' }, // 7-1
                { action: 'changeType', data: 'debtfrom' }, // 1-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeType', data: 'debtto' }, // 1-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'changeSourceCurrency', data: RUB }, // 4-3
                { action: 'changeType', data: 'transferfrom' }, // 3-5
                { action: 'changeType', data: 'income' }, // 5-3
                { action: 'changeType', data: 'transferto' }, // 3-7
                { action: 'changeType', data: 'income' }, // 7-3
                { action: 'changeType', data: 'debtfrom' }, // 3-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeType', data: 'debtto' }, // 3-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'transferfrom' }, // 2-5
                { action: 'changeType', data: 'transferto' }, // 5-7
                { action: 'changeType', data: 'transferfrom' }, // 7-5
                { action: 'changeType', data: 'debtfrom' }, // 5-9
                { action: 'changeType', data: 'transferfrom' }, // 9-5
                { action: 'changeType', data: 'debtto' }, // 5-10
                { action: 'changeType', data: 'transferfrom' }, // 10-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'transferto' }, // 2-7
                { action: 'changeType', data: 'debtfrom' }, // 7-9
                { action: 'changeType', data: 'transferto' }, // 9-7
                { action: 'changeType', data: 'debtto' }, // 7-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transferfrom' }, // 4-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'expense' }, // 6-1
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'income' }, // 6-3
                { action: 'changeType', data: 'transferfrom' }, // 3-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeTransferAccount', data: App.scenario.ACC_RUB }, // 6-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'transferto' }, // 6-8
                { action: 'changeType', data: 'expense' }, // 8-1
                { action: 'changeType', data: 'transferto' }, // 1-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'income' }, // 8-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transferto' }, // 4-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'inputSourceAmount', data: '100' },
                { action: 'inputDestAmount', data: '6000' },
            ],
        });

        /** Prepare items of all states */
        await ImportTests.updateItemAndSave({
            pos: 1,
            action: [
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'inputDestAmount', data: '50.03' },
                { action: 'inputSourceAmount', data: '100' },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 2,
            action: { action: 'changeType', data: 'income' }, // 1-3
        });

        await ImportTests.updateItemAndSave({
            pos: 3,
            action: [
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'inputDestAmount', data: '500' },
                { action: 'inputSourceAmount', data: '9' },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 4,
            action: { action: 'changeType', data: 'transferfrom' }, // 1-5
        });

        await ImportTests.updateItemAndSave({
            pos: 5,
            action: [
                { action: 'changeType', data: 'transferfrom' }, // 1-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'inputDestAmount', data: '0.9' },
                { action: 'inputSourceAmount', data: '50.03' },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 6,
            action: { action: 'changeType', data: 'transferto' }, // 1-7
        });

        await ImportTests.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debtfrom' }, // 1-9
                { action: 'changePerson', data: App.scenario.IVAN },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 8,
            action: { action: 'changeType', data: 'debtto' }, // 1-10
        });

        await ImportTests.changeMainAccount(App.scenario.ACC_EUR);

        await ImportTests.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeTransferAccount', data: App.scenario.ACC_3 }, // 8-8
            ],
        });

        await ImportTests.changeMainAccount(App.scenario.ACC_3); // for item 0: 8-8

        await ImportTests.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'transferfrom' }, // 8-6
                { action: 'changeType', data: 'debtfrom' }, // 6-9
                { action: 'changeType', data: 'debtto' }, // 9-10
                { action: 'changeType', data: 'transferto' }, // 10-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debtfrom' }, // 8-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debtfrom' }, // 4-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debtto' }, // 4-10
                { action: 'changeType', data: 'debtfrom' }, // 10-9
                { action: 'changeType', data: 'transferfrom' }, // 9-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'debtto' }, // 6-10
                { action: 'changeType', data: 'transferto' }, // 10-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debtto' }, // 8-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debtfrom' }, // 2-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debtto' }, // 2-10
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debtto' },
                { action: 'changePerson', data: App.scenario.MARIA },
            ],
        });

        await ImportTests.submit();
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
