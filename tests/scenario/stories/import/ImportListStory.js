import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../../actions/import/index.js';
import { App } from '../../../Application.js';
import { api } from '../../../model/api.js';
import { testLocales } from '../../actions/locale.js';
import { testDateLocales, testDecimalLocales } from '../../actions/settings.js';
import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
} from '../../../model/Reminder.js';

export class ImportListStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            transactions: true,
            schedule: true,
            importtpl: true,
            importrules: true,
        });

        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
        await App.scenario.createTransactions();
        await App.scenario.createScheduledTransactions();
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

        await Actions.checkInitialState();

        await this.create();
        await this.uploadAccount();
        await this.convert();
        await this.pagination();
        await this.listModes();
        await this.duplicate();
        await this.checkSimilar();
        await this.reminders();
        await this.enableDisableRules();
        await this.del();
        await this.submit();
        await this.formOrigDataCollapsible();
        await this.stateLoop();
        await this.locales();
        await this.currencyPrecision();

        await this.submitError();
        await this.noAccounts();
    }

    async create() {
        setBlock('Add item', 2);

        const { TRANSPORT_CATEGORY } = App.scenario;

        await Actions.addItem([
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeCategory', data: TRANSPORT_CATEGORY },
        ]);

        setBlock('Save item', 2);
        await Actions.saveItem();

        setBlock('Cancel item edit', 2);
        await Actions.updateItem({
            pos: 0,
            action: { action: 'inputDestAmount', data: '2' },
        });
        await Actions.cancelItem();
    }

    async uploadAccount() {
        setBlock('Upload CSV with invalid account', 2);

        const { cardFile, ACC_USD, ACC_RUB } = App.scenario;

        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_USD,
        });

        setBlock('Check convert feedback is hidden on open template form', 2);
        await Actions.createTemplate();
        await Actions.cancelTemplate();

        setBlock('Check main account is updated after select it at upload dialog', 2);
        await Actions.selectUploadAccount(ACC_RUB);
    }

    async convert() {
        setBlock('Convert transactions', 2);

        const { cardFile, ACC_3 } = App.scenario;

        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_3,
        });

        setBlock('Cancel changes', 2);
        await Actions.updateItemAndSave({
            pos: 8,
            action: { action: 'inputDestAmount', data: '100' },
        });
        await Actions.restoreItems(8);

        await Actions.deleteAllItems();
    }

    async pagination() {
        setBlock('Pagination', 1);

        const { largeFile, ACC_RUB } = App.scenario;
        const itemsOnPage = App.config.importTransactionsOnPage;

        await Actions.changeMainAccount(ACC_RUB);

        await Actions.uploadFile(largeFile);
        await Actions.submitUploaded(largeFile);
        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '1' },
        ]);
        await Actions.goToPrevPage(); // page 2

        setBlock('Update item on 2nd page', 2);
        await Actions.updateItemAndSave({
            pos: itemsOnPage + 1,
            action: { action: 'inputComment', data: `Item ${itemsOnPage + 1}` },
        });
        await Actions.showMore(); // pages 2-3

        setBlock('Update item on 3rd page while showing pages 2-3', 2);
        await Actions.updateItemAndSave({
            pos: (itemsOnPage * 2) + 1,
            action: { action: 'inputComment', data: `Item ${(itemsOnPage * 2) + 1}` },
        });

        await Actions.goToPrevPage(); // page 2
        await Actions.goToFirstPage(); // page 1
        await Actions.showMore(); // pages 1-2
        await Actions.showMore(); // pages 1-3
        await Actions.goToFirstPage(); // page 1
        await Actions.goToNextPage(); // page 2

        await Actions.toggleSelectItems([21, 22]);
        await Actions.goToPrevPage(); // page 1
        await Actions.toggleSelectItems([11, 12]);
        await Actions.deleteSelectedItems();

        await Actions.deleteAllItems();
    }

    async listModes() {
        setBlock('List modes', 1);

        const { cardFile } = App.scenario;
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded(cardFile);

        setBlock('Check selection is cleared on change list mode', 2);
        await Actions.toggleSelectItems([0, 1]);
        await Actions.setListMode();

        setBlock('List items select', 2);
        await Actions.toggleSelectItems([0, 1]);
        await Actions.toggleSelectItems([0, 1]);
        await Actions.selectAllItems();
        await Actions.deselectAllItems();
        await Actions.toggleSelectItems([0, 1, 2]);
        await Actions.enableSelectedItems(false);
        await Actions.enableSelectedItems(true);
        await Actions.deleteSelectedItems();
        await Actions.setListMode();
        await Actions.setSortMode();
        await Actions.setListMode();

        await Actions.deleteAllItems();
    }

    async duplicate() {
        setBlock('Duplicate import transactions', 1);

        const { cardFile } = App.scenario;
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded(cardFile);

        await Actions.duplicateItemAndSave({
            pos: 0,
            action: [
                { action: 'inputComment', data: 'Duplicate' },
            ],
        });

        await Actions.deleteAllItems();
    }

    async checkSimilar() {
        setBlock('Enable/disable check similar transactions', 1);

        const { cardFile, ACC_RUB } = App.scenario;

        // Check option change is correctly update already uploaded transactions
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_RUB,
        });
        await Actions.enableCheckSimilar(false);
        await Actions.enableCheckSimilar(true);
        await Actions.enableCheckSimilar(false);
        // Check option change is correctly affect on new uploaded transactions
        await Actions.deleteAllItems();
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_RUB,
        });
        await Actions.enableCheckSimilar(true);
        await Actions.deleteAllItems();
    }

    async enableDisableRules() {
        setBlock('Enable/disable rules', 1);

        const { cardFile, ACC_RUB } = App.scenario;

        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_RUB,
        });

        await Actions.enableRules(false);
        await Actions.enableRules(true);
    }

    async del() {
        setBlock('Delete import items', 2);

        await Actions.deleteItems([3, 5]);
    }

    async submit() {
        setBlock('Submit import transactions', 1);

        const { cardFile, USD } = App.scenario;

        // Disable all items except 0 and 1 and submit
        // As result two first transactions will be found as similar
        await Actions.selectAllItems();
        await Actions.toggleSelectItems([0, 1]);
        await Actions.enableSelectedItems(false);
        await Actions.submit();
        // Verify submit is disabled for empty list
        setBlock('Verify submit is disabled for empty list', 2);
        await Actions.submit();

        setBlock('Verify validation is resetted after close dialog', 2);
        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '' },
            { action: 'inputDate', data: '' },
        ]);
        await Actions.cancelItem();
        await Actions.addItem();
        await Actions.cancelItem();

        setBlock('Verify invalid items are not submitted', 2);
        // Empty amount
        await Actions.createItemAndSave();

        // Zero amount
        await Actions.runFormActions(
            { action: 'inputDestAmount', data: '0' },
        );
        await Actions.saveItem();

        // Valid amount, different currencies and empty source amount
        await Actions.runFormActions([
            { action: 'inputDestAmount', data: '1' },
            { action: 'changeDestCurrency', data: USD },
            { action: 'inputSourceAmount', data: '' },
        ]);
        await Actions.saveItem();

        // Empty date
        await Actions.runFormActions([
            { action: 'inputSourceAmount', data: '2' },
            { action: 'inputDate', data: '' },
        ]);
        await Actions.saveItem();

        // Correct date
        await Actions.runFormActions(
            { action: 'inputDate', data: App.formatInputDate(App.dates.now) },
        );
        await Actions.saveItem();
        await Actions.submit();

        // Verify submit is disabled for list with no enabled items
        setBlock('Verify submit is disabled for list with no enabled items', 2);
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            template: 0,
        });
        await Actions.selectAllItems();
        await Actions.enableSelectedItems(false);
        await Actions.submit();
    }

    async reminders() {
        setBlock('Reminders', 1);

        await this.checkReminders();
        await this.selectReminder();
        await this.updateReminder();
        await this.removeReminder();
        await this.remindersDialogPagination();
        await this.remindersDialogFilters();
    }

    async resetTransactions() {
        await App.scenario.resetData({ transactions: true });
        await App.view.navigateToImport();
    }

    async checkReminders() {
        setBlock('Check suitable reminders', 1);

        const { accountFile } = App.scenario;

        setBlock('Upload with enabled option', 2);
        await Actions.uploadFile(accountFile);
        await Actions.submitUploaded(accountFile);
        await Actions.submit();
        await this.resetTransactions();

        setBlock('Upload with disabled option', 2);
        await Actions.enableCheckReminders(false);
        await Actions.uploadFile(accountFile);
        await Actions.submitUploaded(accountFile);
        await Actions.submit();
        await this.resetTransactions();

        setBlock('Enable option after upload', 2);
        await Actions.uploadFile(accountFile);
        await Actions.submitUploaded(accountFile);
        await Actions.enableCheckReminders(false);
        await Actions.submit();
        await this.resetTransactions();
    }

    async selectReminder() {
        setBlock('Select reminder to confirm', 1);

        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '100' },
            { action: 'openReminderDialog' },
            { action: 'selectReminderByIndex', data: 0 },
        ]);
        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '101' },
            { action: 'openReminderDialog' },
            { action: 'selectReminderByIndex', data: 0 },
        ]);
        await Actions.submit();
    }

    async updateReminder() {
        setBlock('Update reminder', 1);

        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '200' },
            { action: 'openReminderDialog' },
            { action: 'selectReminderByIndex', data: 0 },
        ]);
        await Actions.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'openReminderDialog' },
                { action: 'selectReminderByIndex', data: 1 },
            ],
        });
        await Actions.submit();
    }

    async removeReminder() {
        setBlock('Remove reminder', 1);

        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '300' },
            { action: 'openReminderDialog' },
            { action: 'selectReminderByIndex', data: 0 },
            { action: 'removeReminder' },
        ]);
        await Actions.submit();
    }

    async remindersDialogPagination() {
        setBlock('\'Select reminder\' dialog pagination', 1);

        await Actions.addItem([
            { action: 'openReminderDialog' },
            { action: 'goToRemindersLastPage' },
            { action: 'goToRemindersPrevPage' },
            { action: 'goToRemindersNextPage' },
            { action: 'goToRemindersFirstPage' },
            { action: 'showMoreReminders' },
            { action: 'goToRemindersFirstPage' },
            { action: 'showMoreReminders' },
        ]);
        await Actions.cancelItem();
    }

    async remindersDialogFilters() {
        setBlock('\'Select reminder\' dialog filters', 1);

        await Actions.addItem([
            { action: 'openReminderDialog' },
            { action: 'filterRemindersByState', data: REMINDER_CONFIRMED },
            { action: 'filterRemindersByState', data: REMINDER_UPCOMING },
            { action: 'filterRemindersByState', data: REMINDER_CANCELLED },
            { action: 'filterRemindersByState', data: REMINDER_SCHEDULED },
            { action: 'selectRemindersEndDateFilter', data: App.dates.monthAfter },
            { action: 'selectRemindersStartDateFilter', data: App.dates.weekAfter },
            { action: 'clearRemindersEndDateFilter' },
            { action: 'clearRemindersStartDateFilter' },
            { action: 'selectRemindersStartDateFilter', data: App.dates.monthAgo },
            { action: 'selectRemindersEndDateFilter', data: App.dates.tomorrow },
            { action: 'clearAllRemindersFilters' },
        ]);
        await Actions.cancelItem();
    }

    async formOrigDataCollapsible() {
        setBlock('Form original data collapsible', 2);

        await Actions.updateItemAndSave({
            pos: 2,
            action: [
                { action: 'toggleOriginalData' },
                { action: 'toggleOriginalData' },
            ],
        });
        await Actions.updateItemAndSave({ pos: 0 });
        await Actions.updateItemAndSave({
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
            EUR,
            ACC_RUB,
            ACC_3,
            ACC_USD,
            ACC_EUR,
            CREDIT_CARD,
            IVAN,
            MARIA,
            TRANSPORT_CATEGORY,
        } = App.scenario;

        setBlock('Import item state loop', 1);

        await Actions.changeMainAccount(ACC_3);

        await Actions.updateItemAndSave({
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
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'changeType', data: 'expense' }, // 6-1
                { action: 'changeType', data: 'transfer_out' }, // 1-5
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'changeType', data: 'income' }, // 6-3
                { action: 'changeType', data: 'transfer_out' }, // 3-5
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'changeTransferAccount', data: ACC_RUB }, // 6-5
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'changeType', data: 'transfer_in' }, // 6-8
                { action: 'changeType', data: 'expense' }, // 8-1
                { action: 'changeType', data: 'transfer_in' }, // 1-7
                { action: 'changeTransferAccount', data: ACC_USD }, // 7-8
                { action: 'changeType', data: 'income' }, // 8-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'transfer_in' }, // 4-7
                { action: 'changeTransferAccount', data: ACC_USD }, // 7-8
                { action: 'inputSourceAmount', data: '100' },
                { action: 'inputDestAmount', data: '6000' },
            ],
        });

        /** Prepare items of all states */
        await Actions.updateItemAndSave({
            pos: 1,
            action: [
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'inputDestAmount', data: '50.03' },
                { action: 'inputSourceAmount', data: '100' },
            ],
        });

        await Actions.updateItemAndSave({
            pos: 2,
            action: { action: 'changeType', data: 'income' }, // 1-3
        });

        await Actions.updateItemAndSave({
            pos: 3,
            action: [
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'income' }, // 2-4
                { action: 'inputDestAmount', data: '500' },
                { action: 'inputSourceAmount', data: '9' },
            ],
        });

        await Actions.updateItemAndSave({
            pos: 4,
            action: { action: 'changeType', data: 'transfer_out' }, // 1-5
        });

        await Actions.updateItemAndSave({
            pos: 5,
            action: [
                { action: 'changeType', data: 'transfer_out' }, // 1-5
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'inputDestAmount', data: '0.9' },
                { action: 'inputSourceAmount', data: '50.03' },
            ],
        });

        await Actions.updateItemAndSave({
            pos: 6,
            action: { action: 'changeType', data: 'transfer_in' }, // 1-7
        });

        await Actions.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debt_out' }, // 1-9
                { action: 'changePerson', data: IVAN },
            ],
        });

        await Actions.updateItemAndSave({
            pos: 8,
            action: { action: 'changeType', data: 'debt_in' }, // 1-10
        });

        await Actions.changeMainAccount(ACC_EUR);

        await Actions.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeTransferAccount', data: ACC_3 }, // 8-8
            ],
        });

        await Actions.changeMainAccount(ACC_3); // for item 0: 8-8

        await Actions.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeTransferAccount', data: ACC_USD }, // 7-8
                { action: 'changeType', data: 'transfer_out' }, // 8-6
                { action: 'changeType', data: 'debt_out' }, // 6-9
                { action: 'changeType', data: 'debt_in' }, // 9-10
                { action: 'changeType', data: 'transfer_in' }, // 10-7
                { action: 'changeTransferAccount', data: ACC_USD }, // 7-8
                { action: 'changeType', data: 'debt_out' }, // 8-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debt_out' }, // 4-9
                { action: 'changeType', data: 'income' }, // 9-3
                { action: 'changeSourceCurrency', data: USD }, // 3-4
                { action: 'changeType', data: 'debt_in' }, // 4-10
                { action: 'changeType', data: 'debt_out' }, // 10-9
                { action: 'changeType', data: 'transfer_out' }, // 9-5
                { action: 'changeTransferAccount', data: ACC_USD }, // 5-6
                { action: 'changeType', data: 'debt_in' }, // 6-10
                { action: 'changeType', data: 'transfer_in' }, // 10-7
                { action: 'changeTransferAccount', data: ACC_USD }, // 7-8
                { action: 'changeType', data: 'debt_in' }, // 8-10
                { action: 'changeType', data: 'expense' }, // 10-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debt_out' }, // 2-9
                { action: 'changeType', data: 'expense' }, // 9-1
                { action: 'changeDestCurrency', data: USD }, // 1-2
                { action: 'changeType', data: 'debt_in' }, // 2-10
            ],
        });

        await Actions.updateItemAndSave({
            pos: 7,
            action: [
                { action: 'changeType', data: 'debt_in' },
                { action: 'changePerson', data: MARIA },
            ],
        });

        await Actions.changeMainAccount(CREDIT_CARD);

        await Actions.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeType', data: 'limit' }, // 10-11
                { action: 'changeType', data: 'expense' }, // 11-1
                { action: 'changeType', data: 'limit' }, // 1-11
                { action: 'changeType', data: 'expense' }, // 11-1
                { action: 'changeDestCurrency', data: EUR }, // 1-2
                { action: 'changeType', data: 'limit' }, // 2-11
                { action: 'changeType', data: 'income' }, // 11-3
                { action: 'changeType', data: 'limit' }, // 3-11
                { action: 'changeType', data: 'income' }, // 11-3
                { action: 'changeSourceCurrency', data: EUR }, // 3-4
                { action: 'changeType', data: 'limit' }, // 4-11
                { action: 'changeType', data: 'transfer_out' }, // 11-6
                { action: 'changeType', data: 'limit' }, // 6-11
                { action: 'changeType', data: 'transfer_out' }, // 11-6
                { action: 'changeTransferAccount', data: ACC_USD }, // 6-5
                { action: 'changeType', data: 'limit' }, // 5-11
                { action: 'changeType', data: 'transfer_in' }, // 11-8
                { action: 'changeType', data: 'limit' }, // 8-11
                { action: 'changeType', data: 'transfer_in' }, // 11-8
                { action: 'changeTransferAccount', data: ACC_USD }, // 8-7
                { action: 'changeType', data: 'limit' }, // 7-11
                { action: 'changeType', data: 'debt_out' }, // 11-9
                { action: 'changeType', data: 'limit' }, // 9-11
                { action: 'changeType', data: 'debt_in' }, // 11-10
            ],
        });

        await Actions.submit();
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
        await Actions.changeMainAccount(ACC_3);
        await Actions.createItemAndSave([
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
        await Actions.changeMainAccount(ACC_USD);
        await Actions.changeMainAccount(ACC_BTC);
        await Actions.changeMainAccount(ACC_3);

        setBlock('Update on change transfer account', 2);
        await Actions.updateItemAndSave({
            pos: 0,
            action: [
                { action: 'changeType', data: 'transfer_in' },
                { action: 'changeTransferAccount', data: ACC_BTC },
                { action: 'inputDestAmount', data: '0.12345678' },
                { action: 'changeTransferAccount', data: ACC_USD },
                { action: 'changeTransferAccount', data: ACC_RUB },
            ],
        });

        await Actions.deleteAllItems();
    }

    async locales() {
        setBlock('Import view locales', 1);

        const localeActions = () => this.checkLocale();

        await testLocales(localeActions);
        await testDateLocales(['es', 'ko'], localeActions);
        await testDecimalLocales(['es', 'hi'], localeActions);
    }

    async checkLocale() {
        const { cardFile, ACC_RUB } = App.scenario;

        setBlock('Create transaction', 2);
        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '100' },
            { action: 'inputDate', data: App.formatInputDate(App.dates.weekAgo) },
        ]);

        setBlock('Upload file', 2);
        await Actions.uploadFile(cardFile);
        await Actions.submitUploaded({
            ...cardFile,
            account: ACC_RUB,
        });
        await Actions.submit();
    }

    async submitError() {
        setBlock('Handling submit errors', 2);

        const { ACC_3 } = App.scenario;

        await Actions.changeMainAccount(ACC_3);
        await Actions.createItemAndSave([
            { action: 'inputDestAmount', data: '1' },
        ]);
        // Remove selected account
        await api.account.del({ id: ACC_3 });

        await Actions.submit();
    }

    async noAccounts() {
        setBlock('Import view with no accounts', 2);

        await App.scenario.resetData({
            accounts: true,
        });

        await App.goToMainView();
        await Actions.checkInitialState();
    }
}
