import {
    test,
    copyObject,
    assert,
    baseUrl,
    httpReq,
    setBlock,
} from 'jezve-test';
import { App } from '../../Application.js';
import { findSimilarTransaction } from '../../model/import.js';
import { ImportTransaction } from '../../model/ImportTransaction.js';
import { ImportList } from '../../view/component/Import/ImportList.js';
import { ImportView } from '../../view/ImportView.js';

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

function parseCSV(data) {
    const content = data.toString().trim();

    const rows = content.split('\n');
    const res = rows.map((row) => row.trim().split(';').map((val) => {
        const start = val.startsWith('"') ? 1 : 0;
        const length = val.length - start - (val.endsWith('"') ? 1 : 0);
        return val.substr(start, length);
    }));

    return res;
}

/** Open import upload dialog */
export const openUploadDialog = async () => {
    await test('Open upload dialog', async () => {
        await checkNavigation();

        return App.view.launchUploadDialog();
    });
};

/** Close import upload dialog */
export const closeUploadDialog = async () => {
    await test('Close upload dialog', async () => {
        await checkNavigation();

        return App.view.closeUploadDialog();
    });
};

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

/** Test manual add new import item */
export const addItem = async () => {
    await test('Add import item', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.addItem();
    });
};

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

/** Change main account */
export const changeMainAccount = async (accountId) => {
    const userAccounts = App.state.accounts.getUserVisible();
    const account = userAccounts.getItem(accountId);
    assert(account, `Invalid account id ${accountId}`);

    await test(`Change main account to '${account.name}'`, async () => {
        await checkNavigation();
        await checkViewState('main');

        const skipList = [];
        App.view.items.forEach((_, ind) => {
            const item = App.view.items[ind];

            if (!item.original || !App.view.rulesEnabled) {
                item.setMainAccount(accountId);
                return;
            }

            // Reapply rules
            item.restoreOriginal();
            item.setMainAccount(accountId);
            App.state.rules.applyTo(item);

            const tr = findSimilarTransaction(item, skipList);
            if (tr) {
                skipList.push(tr.id);
            }
            item.setSimilarTransaction(tr);
        });

        App.view.model.mainAccount = account.id;
        App.view.model.totalCount = App.view.items.length;
        const enabledItems = App.view.items.filter((item) => item.enabled);
        App.view.model.enabledCount = enabledItems.length;

        App.view.expectedState = App.view.getExpectedState();
        const expectedList = App.view.getExpectedList();
        App.view.expectedState.itemsList.items = expectedList.items;

        await App.view.selectMainAccount(accountId);

        return App.view.checkState();
    });
};

export const enableRules = async (value = true) => {
    const enable = !!value;
    const descr = enable ? 'Enable rules' : 'Disable rules';

    await test(descr, async () => {
        await checkNavigation();
        await checkViewState('main');

        assert(
            enable !== App.view.rulesEnabled,
            `Import rules already ${enable ? 'enabled' : 'disabled'}`,
        );

        // Apply rules or restore original import data according to enable flag
        // and convert to expected state of ImportTransactionForm component
        const itemsData = App.view.content.itemsList.content.items.map((item) => {
            let model;

            if (item.model.original) {
                if (enable) {
                    const expTrans = item.getExpectedTransaction(item.model);
                    const origMainAccount = App.state.accounts.findByName(
                        item.model.original.mainAccount,
                    );
                    const importTrans = new ImportTransaction({
                        ...expTrans,
                        enabled: item.model.enabled,
                        mainAccount: origMainAccount,
                        type: item.model.type,
                        original: {
                            ...item.model.original,
                            mainAccount: origMainAccount,
                        },
                    });

                    App.state.rules.applyTo(importTrans);

                    const imported = ImportList.render(
                        [importTrans],
                        App.state,
                        (item.model.isForm) ? 0 : -1,
                    );
                    return copyObject(imported.items[0]);
                }

                model = item.restoreOriginal();
                if (App.view.model.mainAccount !== model.mainAccount.id) {
                    model = item.onChangeMainAccount(model, App.view.model.mainAccount);
                }
            } else {
                model = item.model;
            }

            const result = item.getExpectedState(model);
            return copyObject(result);
        });

        await App.view.enableRules(enable);

        App.view.expectedState = {
            itemsList: {
                items: itemsData,
            },
        };

        return App.view.checkState();
    });
};

/** Enable/disable check similar transactions option */
export const enableCheckSimilar = async (value = true) => {
    const enable = !!value;
    const act = enable ? 'Enable' : 'Disable';

    await test(`${act} check similar transactions`, async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.enableCheckSimilar(enable);
    });
};

/** Enable/disable items */
export const enableItems = async ({ index, value = true }) => {
    const enable = !!value;
    const descr = enable ? 'Enable items' : 'Disable items';

    await test(`${descr} [${index}]`, async () => {
        await checkNavigation();

        return App.view.enableItems(index, enable);
    });
};

/** Set list mode */
export const setListMode = async () => {
    await test('Set list mode', async () => {
        await checkNavigation();
        return App.view.setListMode();
    });
};

/** Set select mode */
export const setSelectMode = async () => {
    await test('Set select mode', async () => {
        await checkNavigation();
        return App.view.setSelectMode();
    });
};

/** Set sort mode */
export const setSortMode = async () => {
    await test('Set sort mode', async () => {
        await checkNavigation();
        return App.view.setSortMode();
    });
};

/** Toggle select items */
export const toggleSelectItems = async (index) => {
    await test(`Toggle select items [${index}]`, async () => {
        await checkNavigation();
        return App.view.toggleSelectItems(index);
    });
};

/** Select all items */
export const selectAllItems = async () => {
    await test('Select all items', async () => {
        await checkNavigation();
        return App.view.selectAllItems();
    });
};

/** Deselect all items */
export const deselectAllItems = async () => {
    await test('Deselect all items', async () => {
        await checkNavigation();
        return App.view.deselectAllItems();
    });
};

/** Enable/disable selected items */
export const enableSelectedItems = async (value) => {
    const enable = !!value;
    const descr = enable ? 'Enable selected items' : 'Disable selected items';

    await test(descr, async () => {
        await checkNavigation();
        return App.view.enableSelectedItems(value);
    });
};

/** Enable/disable selected items */
export const deleteSelectedItems = async () => {
    await test('Delete selected items', async () => {
        await checkNavigation();
        return App.view.deleteSelectedItems();
    });
};

/** Update item */
export const updateItem = async (params) => {
    assert(params && ('pos' in params), 'Invalid parameters');

    setBlock(`Update item [${params.pos}]`, 2);

    await checkNavigation();
    await checkViewState('main');

    const actDescr = {
        changeType: 'Change transaction type',
        changeTransferAccount: 'Change transfer account',
        changePerson: 'Change person',
        inputSourceAmount: 'Input source amount',
        inputDestAmount: 'Input destination amount',
        changeSourceCurrency: 'Change source currency',
        changeDestCurrency: 'Change destination currency',
        inputDate: 'Input date',
        inputComment: 'Input comment',
    };

    await App.view.updateItemByPos(params.pos);

    const actions = Array.isArray(params.action) ? params.action : [params.action];
    for (const action of actions) {
        let descr;

        if (action.action === 'changeSourceCurrency' || action.action === 'changeDestCurrency') {
            const currency = App.currency.getItem(action.data);
            assert(currency, `Currency (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${currency.name}'`;
        } else if (action.action === 'changeTransferAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            assert(account, `Account (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changePerson') {
            const persons = App.state.persons.getVisible();
            const person = persons.getItem(action.data);
            assert(person, `Person (${action.data}) not found`);

            descr = `${actDescr[action.action]} to '${person.name}'`;
        } else {
            descr = `${actDescr[action.action]} '${action.data}'`;
        }

        await test(descr, () => App.view.runItemAction(params.pos, action));
    }

    /**
     * Set expected state here as array of expected states of items
     * because ImportList.render() method use transaction data objects
     */
    App.view.expectedState = {
        itemsList: App.view.content.itemsList.getExpectedState(),
    };
    await test('View state', () => App.view.checkState());
};

/** Save current import transaction form */
export const saveItem = async () => {
    await test('Save import form', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.saveItem();
    });
};

/** Cancel edit current import transaction form */
export const cancelItem = async () => {
    await test('Cancel import form', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.cancelItem();
    });
};

/**
 * Click by delete button of items specified by indexes
 * @param {number|number[]} indexes - index or array of indexes of items to delete
 */
export const deleteItems = async (indexes) => {
    const itemInds = Array.isArray(indexes) ? indexes : [indexes];

    await test(`Delete import item(s) [${itemInds.join()}]`, async () => {
        await checkNavigation();
        await checkViewState('main');

        const itemsList = App.view.content.itemsList.getExpectedState();
        const expected = copyObject(itemsList.items);
        let removed = 0;
        itemInds.sort();
        for (const ind of itemInds) {
            const index = parseInt(ind, 10);
            assert.arrayIndex(itemsList.items, index);

            expected.splice(ind - removed, 1);
            removed += 1;
        }

        await App.view.deleteItem(itemInds);

        App.view.expectedState = {
            itemsList: { items: expected },
        };

        return App.view.checkState();
    });
};

/**
 * Click by delete all items button test
 */
export const deleteAllItems = async () => {
    await test('Delete all import items', async () => {
        await checkNavigation();
        await checkViewState('main');

        await App.view.deleteAllItems();

        App.view.expectedState = {
            itemsList: { items: [] },
        };

        return App.view.checkState();
    });
};

/** Submit */
export const submit = async () => {
    await test('Submit items', async () => {
        await checkNavigation();
        await checkViewState('main');

        await App.state.fetch();

        await App.view.submit();

        return App.state.fetchAndTest();
    });
};

/** Navigate to first page */
export const goToFirstPage = async () => {
    await test('Navigate to first page', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.goToFirstPage();
    });
};

/** Navigate to next page */
export const goToNextPage = async () => {
    await test('Navigate to next page', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.goToNextPage();
    });
};

/** Navigate to previous page */
export const goToPrevPage = async () => {
    await test('Navigate to previous page', async () => {
        await checkNavigation();
        await checkViewState('main');

        return App.view.goToPrevPage();
    });
};
