import { setBlock, TestStory } from 'jezve-test';
import * as ImportTests from '../../../run/import/index.js';
import { App } from '../../../Application.js';
import { api } from '../../../model/api.js';

export class ImportListStory extends TestStory {
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
        await this.formOrigDataCollapsible();
        await this.stateLoop();
        await this.currencyPrecision();

        await this.submitError();
        await this.noAccounts();
    }

    async create() {
        setBlock('Add item', 2);

        await ImportTests.addItem([
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeCategory', data: App.scenario.TRANSPORT_CATEGORY },
        ]);

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
        await ImportTests.submitUploaded({
            ...cardFile,
            account: App.scenario.ACC_3,
        });

        setBlock('Cancel changes', 2);
        await ImportTests.updateItemAndSave({
            pos: 8,
            action: { action: 'inputDestAmount', data: '100' },
        });
        await ImportTests.restoreItems(8);

        await ImportTests.deleteAllItems();
    }

    async pagination() {
        setBlock('Pagination', 1);

        const { largeFile } = App.scenario;
        const itemsOnPage = App.config.importTransactionsOnPage;

        await ImportTests.changeMainAccount(App.scenario.ACC_RUB);

        await ImportTests.uploadFile(largeFile);
        await ImportTests.submitUploaded(largeFile);
        await ImportTests.createItemAndSave([
            { action: 'inputDestAmount', data: '1' },
        ]);
        await ImportTests.goToPrevPage(); // page 2

        setBlock('Update item on 2nd page', 2);
        await ImportTests.updateItemAndSave({
            pos: itemsOnPage + 1,
            action: { action: 'inputComment', data: `Item ${itemsOnPage + 1}` },
        });
        await ImportTests.showMore(); // pages 2-3

        setBlock('Update item on 3rd page while showing pages 2-3', 2);
        await ImportTests.updateItemAndSave({
            pos: (itemsOnPage * 2) + 1,
            action: { action: 'inputComment', data: `Item ${(itemsOnPage * 2) + 1}` },
        });

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
        setBlock('List modes', 1);

        const { cardFile } = App.scenario;
        await ImportTests.uploadFile(cardFile);
        await ImportTests.submitUploaded(cardFile);

        setBlock('Check selection is cleared on change list mode', 2);
        await ImportTests.toggleSelectItems([0, 1]);
        await ImportTests.setListMode();

        setBlock('List items select', 2);
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

        setBlock('Verify validation is resetted after close dialog', 2);
        await ImportTests.createItemAndSave([
            { action: 'inputDestAmount', data: '' },
            { action: 'inputDate', data: '' },
        ]);
        await ImportTests.cancelItem();
        await ImportTests.addItem();
        await ImportTests.cancelItem();

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
            { action: 'inputDate', data: App.datesFmt.now },
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

    async formOrigDataCollapsible() {
        setBlock('Form original data collapsible', 2);

        await ImportTests.updateItemAndSave({
            pos: 2,
            action: [
                { action: 'toggleOriginalData' },
                { action: 'toggleOriginalData' },
            ],
        });
        await ImportTests.updateItemAndSave({ pos: 0 });
        await ImportTests.updateItemAndSave({
            pos: 2,
            action: [
                { action: 'toggleOriginalData' },
                { action: 'toggleOriginalData' },
            ],
        });
    }

    async stateLoop() {
        const {
            RUB,
            USD,
            TRANSPORT_CATEGORY,
        } = App.scenario;

        setBlock('Import item state loop', 1);

        await ImportTests.changeMainAccount(App.scenario.ACC_3);

        await ImportTests.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeType', data: 'expense' }, // 3-1
                { action: 'changeCategory', data: TRANSPORT_CATEGORY },
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeDestCurrency', data: RUB }, // 2-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeType', data: 'expense' }, // 3-1
                { action: 'changeType', data: 'transfer_out' }, // 1-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeType', data: 'transfer_in' }, // 1-7
                { action: 'changeType', data: 'expense' }, // 7-1
                { action: 'changeType', data: 'debt_out' }, // 1-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeType', data: 'debt_in' }, // 1-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeType', data: 'income' }, // 1-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'changeSourceCurrency', data: RUB }, // 4-3
                { action: 'changeType', data: 'transfer_out' }, // 3-5
                { action: 'changeType', data: 'income' }, // 5-3
                { action: 'changeType', data: 'transfer_in' }, // 3-7
                { action: 'changeType', data: 'income' }, // 7-3
                { action: 'changeType', data: 'debt_out' }, // 3-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeType', data: 'debt_in' }, // 3-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'expense' }, // 4-2
                { action: 'changeType', data: 'transfer_out' }, // 2-5
                { action: 'changeType', data: 'transfer_in' }, // 5-7
                { action: 'changeType', data: 'transfer_out' }, // 7-5
                { action: 'changeType', data: 'debt_out' }, // 5-9
                { action: 'changeType', data: 'transfer_out' }, // 9-5
                { action: 'changeType', data: 'debt_in' }, // 5-10
                { action: 'changeType', data: 'transfer_out' }, // 10-5
                { action: 'changeType', data: 'expense' }, // 5-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'transfer_in' }, // 2-7
                { action: 'changeType', data: 'debt_out' }, // 7-9
                { action: 'changeType', data: 'transfer_in' }, // 9-7
                { action: 'changeType', data: 'debt_in' }, // 7-10
                { action: 'changeType', data: 'income' }, // 10-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transfer_out' }, // 4-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'expense' }, // 6-1
                { action: 'changeType', data: 'transfer_out' }, // 1-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'income' }, // 6-3
                { action: 'changeType', data: 'transfer_out' }, // 3-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeTransferAccount', data: App.scenario.ACC_RUB }, // 6-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'transfer_in' }, // 6-8
                { action: 'changeType', data: 'expense' }, // 8-1
                { action: 'changeType', data: 'transfer_in' }, // 1-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'income' }, // 8-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transfer_in' }, // 4-7
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
            action: { action: 'changeType', data: 'transfer_out' }, // 1-5
        });

        await ImportTests.updateItemAndSave({
            pos: 5,
            action: [
                { action: 'changeType', data: 'transfer_out' }, // 1-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'inputDestAmount', data: '0.9' },
                { action: 'inputSourceAmount', data: '50.03' },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 6,
            action: { action: 'changeType', data: 'transfer_in' }, // 1-7
        });

        await ImportTests.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debt_out' }, // 1-9
                { action: 'changePerson', data: App.scenario.IVAN },
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 8,
            action: { action: 'changeType', data: 'debt_in' }, // 1-10
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
                { action: 'changeType', data: 'transfer_out' }, // 8-6
                { action: 'changeType', data: 'debt_out' }, // 6-9
                { action: 'changeType', data: 'debt_in' }, // 9-10
                { action: 'changeType', data: 'transfer_in' }, // 10-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debt_out' }, // 8-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debt_out' }, // 4-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debt_in' }, // 4-10
                { action: 'changeType', data: 'debt_out' }, // 10-9
                { action: 'changeType', data: 'transfer_out' }, // 9-5
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 5-6
                { action: 'changeType', data: 'debt_in' }, // 6-10
                { action: 'changeType', data: 'transfer_in' }, // 10-7
                { action: 'changeTransferAccount', data: App.scenario.ACC_USD }, // 7-8
                { action: 'changeType', data: 'debt_in' }, // 8-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debt_out' }, // 2-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debt_in' }, // 2-10
            ],
        });

        await ImportTests.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debt_in' },
                { action: 'changePerson', data: App.scenario.MARIA },
            ],
        });

        await ImportTests.submit();
    }

    async currencyPrecision() {
        setBlock('Trim amount value according to precision of selected currency', 1);

        const {
            USD,
            BTC,
            ACC_3,
            ACC_RUB,
            ACC_USD,
            ACC_BTC,
        } = App.scenario;

        setBlock('Update on change currency', 2);
        await ImportTests.createItemAndSave([
            { action: 'changeDestCurrency', data: BTC },
            { action: 'inputDestAmount', data: '0.12345678' },
            { action: 'inputSourceAmount', data: '100' },
            { action: 'changeDestCurrency', data: USD },
            { action: 'inputSourceAmount', data: '200' },
            { action: 'changeDestCurrency', data: BTC },
            { action: 'inputSourceAmount', data: '300' },
            { action: 'inputDestAmount', data: '0.12345678' },
        ]);

        setBlock('Update on change main account', 2);
        await ImportTests.changeMainAccount(ACC_USD);
        await ImportTests.changeMainAccount(ACC_BTC);
        await ImportTests.changeMainAccount(ACC_3);

        setBlock('Update on change transfer account', 2);
        await ImportTests.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeType', data: 'transfer_in' },
                { action: 'changeTransferAccount', data: ACC_BTC },
                { action: 'inputDestAmount', data: '0.12345678' },
                { action: 'changeTransferAccount', data: ACC_USD },
                { action: 'changeTransferAccount', data: ACC_RUB },
            ],
        });

        await ImportTests.deleteAllItems();
    }

    async submitError() {
        setBlock('Handling submit errors', 2);

        const { ACC_3 } = App.scenario;

        await ImportTests.changeMainAccount(ACC_3);
        await ImportTests.createItemAndSave([
            { action: 'inputDestAmount', data: '1' },
        ]);
        // Remove selected account
        await api.account.del({ id: ACC_3 });

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
