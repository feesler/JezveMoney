import { assert } from '@jezvejs/assert';
import { asArray } from '@jezvejs/types';
import {
    test,
    baseUrl,
    httpReq,
    setBlock,
} from 'jezve-test';
import { App } from '../../../Application.js';
import { ImportView } from '../../../view/ImportView.js';
import { Reminder } from '../../../model/Reminder.js';

/** Reexport import templates and import rules runners */
export * from './templates.js';
export * from './rules.js';

/** Navigate to transactions list page */
const checkNavigation = async () => {
    if (App.view instanceof ImportView) {
        return;
    }

    await App.view.navigateToImport();
};

/** Navigate to specified state of import view */
const checkViewState = async (targetState) => {
    const { state } = App.view.model;

    if (state === targetState) {
        return;
    }

    if (state === 'upload') {
        await App.view.closeUploadDialog();
    }
    if (state === 'rules') {
        await App.view.closeRulesDialog();
    }
    if (targetState === 'upload') {
        await App.view.launchUploadDialog();
    }
    if (targetState === 'rules') {
        await App.view.launchRulesDialog();
    }
};

/** Check initial state of import view */
export const checkInitialState = async () => {
    await checkNavigation();

    App.view.expectedState = App.view.getExpectedState(App.view.model);
    await test('Initial state of import view', () => App.view.checkState());
};

const parseCSV = (data) => {
    const content = data.toString().trim();
    const rows = content.split('\n');
    return rows.map((row) => row.trim().split(';').map((val) => {
        const start = val.startsWith('"') ? 1 : 0;
        const length = val.length - (val.endsWith('"') ? 1 : 0);
        return val.substring(start, length);
    }));
};

/** Open import upload dialog */
export const openUploadDialog = () => (
    test('Open upload dialog', () => (
        App.view.launchUploadDialog()
    ))
);

/** Close import upload dialog */
export const closeUploadDialog = () => (
    test('Close upload dialog', () => (
        App.view.closeUploadDialog()
    ))
);

/* eslint-disable no-console */
/** Admin access required */
export const putFile = async (data) => {
    const baseURL = baseUrl();
    const uploadURL = `${baseURL}admin/tests/upload`;
    const defErrorMessage = 'Request failed';

    try {
        const response = await httpReq(
            'POST',
            uploadURL,
            data.toString(),
        );

        if (!response || response.status !== 200 || !response.body) {
            console.log(response);
            throw new Error('Invalid response');
        }

        const res = JSON.parse(response.body);
        assert(
            res?.result === 'ok' && res?.data,
            (res.msg) ? res.msg : defErrorMessage,
        );

        return { filename: res.data.filename, data };
    } catch (e) {
        console.log(e.message);
        return null;
    }
};

/** Admin access required */
export const removeFile = async (filename) => {
    const baseURL = baseUrl();
    const removeURL = `${baseURL}admin/tests/remove`;
    const defErrorMessage = 'Request failed';

    if (!filename) {
        return true;
    }

    try {
        const data = { filename };

        const response = await httpReq(
            'POST',
            removeURL,
            data,
        );

        if (!response || response.status !== 200 || !response.body) {
            console.log(response);
            throw new Error('Invalid response');
        }

        const res = JSON.parse(response.body);
        assert(res?.result === 'ok', (res.msg) ? res.msg : defErrorMessage);
    } catch (e) {
        console.log(e.message);
        return false;
    }

    return true;
};
/* eslint-enable no-console */

/** Test file upload */
export const uploadFile = async (params) => {
    await test('Upload file', async () => {
        assert(params && params.data && params.filename, 'Invalid parameters');

        await checkNavigation();
        await checkViewState('main');

        await App.state.fetch();

        const importData = parseCSV(params.data);

        // Perform actions on view
        assert(params.filename, 'Invalid file name');

        await App.view.launchUploadDialog();

        if (params.encode) {
            await App.view.selectUploadEncoding(params.encode);
        }
        await App.view.setUploadFile(params.filename, importData);
        await App.view.upload();

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
};

/** Submit uploaded file with current options */
export const submitUploaded = async (params) => {
    await test('Submit file', async () => {
        assert.instanceOf(App.view, ImportView, 'Invalid view instance');

        App.view.checkUploadState();

        const importData = parseCSV(params.data);

        if (params.template) {
            await App.view.selectUploadTemplate(params.template);
        }
        if (params.account) {
            await App.view.selectUploadAccount(params.account);
        }

        return App.view.submitUploaded(importData);
    });
};

/** Change main account at upload dialog */
export const selectUploadAccount = async (accountId) => {
    const userAccounts = App.state.getUserAccounts();
    const account = userAccounts.getItem(accountId);
    assert(account, `Invalid account id ${accountId}`);

    await test(`Change main account at upload dialog to '${account.name}'`, () => (
        App.view.selectUploadAccount(accountId)
    ));
};

/** Change main account */
export const changeMainAccount = async (accountId) => {
    const userAccounts = App.state.accounts.getUserVisible();
    const account = userAccounts.getItem(accountId);
    assert(account, `Invalid account id ${accountId}`);

    await test(`Change main account to '${account.name}'`, () => (
        App.view.selectMainAccount(accountId)
    ));
};

export const enableRules = async (value = true) => {
    const enable = !!value;
    const descr = enable ? 'Enable rules' : 'Disable rules';

    await test(descr, () => (
        App.view.enableRules(enable)
    ));
};

/** Enable/disable 'Check similar transactions' option */
export const enableCheckSimilar = async (value = true) => {
    const enable = !!value;
    const act = enable ? 'Enable' : 'Disable';

    await test(`${act} check similar transactions`, () => (
        App.view.enableCheckSimilar(enable)
    ));
};

/** Enable/disable 'Check suitable reminders' option */
export const enableCheckReminders = async (value = true) => {
    const enable = !!value;
    const act = enable ? 'Enable' : 'Disable';

    await test(`${act} check suitable reminders`, () => (
        App.view.enableCheckReminders(enable)
    ));
};

/** Enable/disable items */
export const enableItems = async ({ index, value = true }) => {
    const enable = !!value;
    const descr = enable ? 'Enable items' : 'Disable items';

    await test(`${descr} [${index}]`, () => (
        App.view.enableItems(index, enable)
    ));
};

/** Set list mode */
export const setListMode = () => (
    test('Set list mode', () => (
        App.view.setListMode()
    ))
);

/** Set select mode */
export const setSelectMode = () => (
    test('Set select mode', () => (
        App.view.setSelectMode()
    ))
);

/** Set sort mode */
export const setSortMode = () => (
    test('Set sort mode', () => (
        App.view.setSortMode()
    ))
);

/** Toggle select items */
export const toggleSelectItems = (index) => (
    test(`Toggle select items [${index}]`, () => (
        App.view.toggleSelectItems(index)
    ))
);

/** Select all items */
export const selectAllItems = () => (
    test('Select all items', () => (
        App.view.selectAllItems()
    ))
);

/** Deselect all items */
export const deselectAllItems = () => (
    test('Deselect all items', () => (
        App.view.deselectAllItems()
    ))
);

/** Select enabled items */
export const selectEnabledItems = () => (
    test('Select enabled items', () => (
        App.view.selectEnabledItems()
    ))
);

/** Select disabled items */
export const selectDisabledItems = () => (
    test('Select disabled items', () => (
        App.view.selectDisabledItems()
    ))
);

/** Enable/disable selected items */
export const enableSelectedItems = async (value) => {
    const enable = !!value;
    const descr = enable ? 'Enable selected items' : 'Disable selected items';

    await test(descr, () => (
        App.view.enableSelectedItems(value)
    ));
};

/** Enable/disable selected items */
export const deleteSelectedItems = () => (
    test('Delete selected items', () => (
        App.view.deleteSelectedItems()
    ))
);

export const runFormAction = async (action) => {
    const actDescr = {
        changeType: 'Change transaction type',
        changeTransferAccount: 'Change transfer account',
        changePerson: 'Change person',
        inputSourceAmount: 'Input source amount',
        inputDestAmount: 'Input destination amount',
        changeSourceCurrency: 'Change source currency',
        changeDestCurrency: 'Change destination currency',
        inputDate: 'Input date',
        changeCategory: 'Change category',
        inputComment: 'Input comment',
        toggleOriginalData: 'Toggle expand/collapse original data',
        openReminderDialog: 'Open \'Select reminder\' dialog',
        closeReminderDialog: 'Close \'Select reminder\' dialog',
        selectReminderByIndex: 'Close \'Select reminder\' dialog',
        removeReminder: 'Remove reminder',
        clearAllRemindersFilters: 'Clear all filters',
        clearRemindersStartDateFilter: 'Clear reminders start date filter',
        clearRemindersEndDateFilter: 'Clear reminders end date filter',
        goToRemindersFirstPage: 'Navigate to reminders first page',
        goToRemindersLastPage: 'Navigate to reminders last page',
        goToRemindersPrevPage: 'Navigate to reminders previous page',
        goToRemindersNextPage: 'Navigate to reminders next page',
        showMoreReminders: 'Show more reminders',
        setRemindersClassicMode: 'Set reminders list classic mode',
        setRemindersDetailsMode: 'Set reminders list details mode',
    };

    let descr;
    if (action.action === 'changeSourceCurrency' || action.action === 'changeDestCurrency') {
        const currency = App.currency.getItem(action.data);
        assert(currency, `Currency (${action.data}) not found`);

        descr = `${actDescr[action.action]} to '${currency.code}'`;
    } else if (action.action === 'changeTransferAccount') {
        const userAccounts = App.state.getUserAccounts();
        const account = userAccounts.getItem(action.data);
        assert(account, `Account (${action.data}) not found`);

        descr = `${actDescr[action.action]} to '${account.name}'`;
    } else if (action.action === 'changePerson') {
        const person = App.state.persons.getItem(action.data);
        assert(person, `Person (${action.data}) not found`);

        descr = `${actDescr[action.action]} to '${person.name}'`;
    } else if (action.action === 'changeCategory') {
        const category = App.state.categories.getItem(action.data);
        assert(category, `Category (${action.data}) not found`);

        descr = `${actDescr[action.action]} to '${category.name}'`;
    } else if (action.action === 'selectReminderByIndex') {
        descr = `Select reminder by index [${action.data}]`;
    } else if (action.action === 'filterRemindersByState') {
        const stateType = parseInt(action.data, 10);
        const stateName = Reminder.stateNames[stateType];
        assert(stateName, 'Invalid reminder state');

        descr = `Filter reminders by state '${stateName}'`;
    } else if (action.action === 'selectRemindersStartDateFilter') {
        const dateFmt = App.reformatDate(action.data);
        descr = `Select reminders start date filter (${dateFmt})`;
    } else if (action.action === 'selectRemindersEndDateFilter') {
        const dateFmt = App.reformatDate(action.data);
        descr = `Select reminders end date filter (${dateFmt})`;
    } else if (typeof action.data !== 'undefined') {
        descr = `${actDescr[action.action]} '${action.data}'`;
    } else {
        descr = `${actDescr[action.action]}`;
    }

    await test(descr, () => App.view.runFormAction(action));
};

export const runFormActions = async (actions) => {
    for (const action of asArray(actions)) {
        await runFormAction(action);
    }
};

/** Test manual add new import item */
export const addItem = async (actions) => {
    await test('Add import item', () => (
        App.view.addItem()
    ));

    await runFormActions(actions);
};

/** Update item */
export const updateItem = async (params) => {
    assert(params && ('pos' in params), 'Invalid parameters');

    setBlock(`Update item [${params.pos}]`, 2);

    await checkNavigation();

    await App.view.updateItemByPos(params.pos);

    await runFormActions(params.action);
};

/** Duplicate item */
export const duplicateItem = async (params) => {
    assert(params && ('pos' in params), 'Invalid parameters');

    await test(`Duplicate item [${params.pos}]`, () => (
        App.view.duplicateItemByPos(params.pos)
    ));

    await runFormActions(params.action);
};

/** Save current import transaction form */
export const saveItem = () => (
    test('Save import form', () => (
        App.view.saveItem()
    ))
);

/** Cancel edit current import transaction form */
export const cancelItem = () => (
    test('Cancel import form', () => (
        App.view.cancelItem()
    ))
);

/** Create item and save */
export const createItemAndSave = async (action) => {
    await addItem(action);
    await saveItem();
};

/** Update item and save */
export const updateItemAndSave = async (params) => {
    await updateItem(params);
    await saveItem();
};

/** Duplicate item and save */
export const duplicateItemAndSave = async (params) => {
    await duplicateItem(params);
    await saveItem();
};

/** Restore original data of imported transaction */
export const restoreItems = (indexes) => (
    test(`Cancel changes of selected item(s) [${asArray(indexes).join()}]`, () => (
        App.view.restoreItems(indexes)
    ))
);

/** Restore original data of imported transaction(s) using context menu */
export const restoreItemsFromContextMenu = (indexes) => (
    test(`Cancel changes of item(s) from context menu [${asArray(indexes).join()}]`, () => (
        App.view.restoreItemsFromContextMenu(indexes)
    ))
);

/**
 * Click by delete button of items specified by indexes
 * @param {number|number[]} indexes - index or array of indexes of items to delete
 */
export const deleteItems = async (indexes) => {
    const itemInds = asArray(indexes);

    await test(`Delete import item(s) [${itemInds.join()}]`, () => (
        App.view.deleteItem(itemInds)
    ));
};

/**
 * Click by delete all items button test
 */
export const deleteAllItems = () => (
    test('Delete all import items', () => (
        App.view.deleteAllItems()
    ))
);

/** Submit */
export const submit = () => (
    test('Submit items', () => (
        App.view.submit()
    ))
);

/** Navigate to first page */
export const goToFirstPage = () => (
    test('Navigate to first page', () => (
        App.view.goToFirstPage()
    ))
);

/** Navigate to next page */
export const goToNextPage = () => (
    test('Navigate to next page', () => (
        App.view.goToNextPage()
    ))
);

/** Navigate to previous page */
export const goToPrevPage = () => (
    test('Navigate to previous page', () => (
        App.view.goToPrevPage()
    ))
);

/** Show more items */
export const showMore = () => (
    test('Show more items', () => (
        App.view.showMore()
    ))
);
