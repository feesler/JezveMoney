import { test, copyObject } from 'jezve-test';
import { App } from '../Application.js';
import { baseUrl, httpReq, setBlock } from '../env.js';
import { Currency } from '../model/Currency.js';
import { ImportTemplate } from '../model/ImportTemplate.js';
import { ImportTransaction } from '../model/ImportTransaction.js';
import { ImportList } from '../view/component/Import/ImportList.js';
import { ImportListItem } from '../view/component/Import/ImportListItem.js';
import { ImportView } from '../view/ImportView.js';
import { TransactionsView } from '../view/TransactionsView.js';
import { ImportViewSubmitError } from '../error/ImportViewSubmitError.js';
import { assert } from '../assert.js';

/** Reexport import templates and import rules runners */
export * from './import/templates.js';
export * from './import/rules.js';

/** Navigate to transactions list page */
async function checkNavigation() {
    if (App.view instanceof ImportView) {
        return;
    }

    if (!(App.view instanceof TransactionsView)) {
        await App.goToMainView();
        await App.view.goToTransactions();
    }

    await App.view.goToImportView();
}

/** Check initial state of import view */
export async function checkInitialState() {
    await checkNavigation();

    App.view.expectedState = App.view.getExpectedState(App.view.model);
    await test('Initial state of import view', () => App.view.checkState());
}

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

/**
 * Check specified transaction have same proporties as reference
 * @param {Object} item - transaction object from API
 * @param {Object} reference - transaction item to compare
 */
function isSimilarTransaction(item, reference) {
    if (!item || !reference) {
        throw new Error('Invalid parameters');
    }

    // Check date, source and destination accounts
    if (item.src_id !== reference.src_id
        || item.dest_id !== reference.dest_id
        || item.date !== reference.date) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reference.src_amount);
    const refDestAmount = Math.abs(reference.dest_amount);
    if ((item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)) {
        return false;
    }

    return true;
}

function findSimilar(transaction, skipList) {
    if (
        !transaction
        || !transaction.mainAccount
        || !transaction.mainAccount.id
    ) {
        throw new Error('Invalid transaction');
    }

    const res = App.state.transactions.find((item) => (
        [item.src_id, item.dest_id].includes(transaction.mainAccount.id)
        && !skipList.includes(item.id)
        && isSimilarTransaction(item, transaction)
    ));

    return res;
}

/** Admin access required */
export async function putFile(data) {
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
        if (!res || res.result !== 'ok' || !res.data) {
            throw new Error((res.msg) ? res.msg : defErrorMessage);
        }

        return res.data.filename;
    } catch (e) {
        console.log(e.message);
        return null;
    }
}

/** Admin access required */
export async function removeFile(filename) {
    const baseURL = baseUrl();
    const removeURL = `${baseURL}admin/tests/remove`;
    const defErrorMessage = 'Request failed';

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
        if (!res || res.result !== 'ok') {
            throw new Error((res.msg) ? res.msg : defErrorMessage);
        }
    } catch (e) {
        console.log(e.message);
        return false;
    }

    return true;
}

/** Test manual add new import item */
export async function addItem() {
    await test('Add import item', async () => {
        await checkNavigation();

        const itemsList = App.view.content.itemsList.getExpectedState();
        const mainAccount = App.state.accounts.getItem(App.view.model.mainAccount);
        const expectedItem = {
            enabled: true,
            typeField: { value: 'expense', disabled: false },
            amountField: { value: '', disabled: false },
            destAmountField: { value: '', disabled: true },
            currencyField: { value: mainAccount.curr_id.toString(), disabled: false },
            destAccountField: { value: '0', disabled: true },
            dateField: { value: '', disabled: false },
            commentField: { value: '', disabled: false },
            personField: { value: '0', disabled: true },
        };

        itemsList.items.push(expectedItem);

        await App.view.addItem();

        App.view.expectedState = {
            values: { itemsList },
        };
        return App.view.checkState();
    });
}

/** Test file upload */
export async function uploadFile(params) {
    await test('Upload file', async () => {
        if (!params || !params.data || !params.filename) {
            throw new Error('Invalid parameters');
        }

        await checkNavigation();

        await App.state.fetch();

        const importData = parseCSV(params.data);

        // Perform actions on view
        if (!params.filename) {
            throw new Error('Invalid file name');
        }

        await App.view.launchUploadDialog();

        if (params.encode) {
            await App.view.selectUploadEncoding(params.encode);
        }
        await App.view.setUploadFile(params.filename, importData);
        await App.view.upload();

        App.view.expectedState = App.view.getExpectedState(App.view.model);

        return App.view.checkState();
    });
}

/** Submit uploaded file with current options */
export async function submitUploaded(params) {
    await test('Submit file', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        App.view.checkUploadState();

        const importData = parseCSV(params.data);

        let mainAccountId;
        if (params.account) {
            mainAccountId = params.account;
        } else {
            mainAccountId = App.view.model.mainAccount;
        }
        const mainAccount = App.state.accounts.getItem(mainAccountId);
        if (!mainAccount) {
            throw new Error('Main account not found');
        }

        const templateData = (params.template)
            ? App.state.templates.getItemByIndex(params.template)
            : App.view.getExpectedTemplate();
        const template = new ImportTemplate(templateData);

        const importTransactions = template.applyTo(importData, mainAccount);
        if (App.view.isRulesEnabled()) {
            for (const item of importTransactions) {
                App.state.rules.applyTo(item);
            }
        }

        const skipList = [];
        for (const item of importTransactions) {
            const tr = findSimilar(item, skipList);
            if (tr) {
                skipList.push(tr.id);
                item.enabled = false;
            }
        }

        let itemsList;
        if (params.account) {
            itemsList = {};
            itemsList.items = App.view.content.itemsList.content.items.map(
                (item) => {
                    const model = item.onChangeMainAccount(item.model, params.account);
                    return copyObject(item.getExpectedState(model).values);
                },
            );
        } else {
            itemsList = App.view.content.itemsList.getExpectedState();
        }

        const importedItems = ImportList.render(importTransactions, App.state);
        itemsList.items = itemsList.items.concat(importedItems.items);

        if (params.template) {
            await App.view.selectUploadTemplate(params.template);
        }
        if (params.account) {
            await App.view.selectUploadAccount(params.account);
        }
        if (params.encode) {
            await App.view.selectUploadEncoding(params.encode);
        }

        await App.view.submitUploaded();

        App.view.expectedState = {
            values: { itemsList },
        };

        return App.view.checkState();
    });
}

/** Change main account */
export async function changeMainAccount(accountId) {
    const userAccounts = App.state.accounts.getUserVisible();
    const account = userAccounts.getItem(accountId);
    if (!account) {
        throw new Error(`Invalid account id ${accountId}`);
    }

    await test(`Change main account to '${account.name}'`, async () => {
        await checkNavigation();

        const skipList = [];
        const itemsData = App.view.content.itemsList.content.items.map((item) => {
            // Reapply rules
            if (item.model.original && App.view.isRulesEnabled()) {
                /* eslint-disable-next-line no-param-reassign */
                item.model = item.restoreOriginal();
                /* eslint-disable-next-line no-param-reassign */
                item.model = item.onChangeMainAccount(item.model, accountId);

                const expectedTransaction = item.getExpectedTransaction(item.model);

                const importTrans = new ImportTransaction({
                    ...expectedTransaction,
                    enabled: item.model.enabled,
                    mainAccount: account,
                    type: item.model.type,
                    original: {
                        ...item.model.original,
                        mainAccount: account,
                    },
                });

                App.state.rules.applyTo(importTrans);

                importTrans.enabled = true;
                const tr = findSimilar(importTrans, skipList);
                if (tr) {
                    skipList.push(tr.id);
                    importTrans.enabled = false;
                }

                const imported = ImportListItem.render(importTrans, App.state);
                return copyObject(imported);
            }

            /* eslint-disable-next-line no-param-reassign */
            item.model = item.onChangeMainAccount(item.model, accountId);

            return copyObject(item.getExpectedState(item.model).values);
        });

        await App.view.selectMainAccount(accountId);

        App.view.expectedState = {
            values: {
                itemsList: {
                    items: itemsData,
                },
            },
        };
        return App.view.checkState();
    });
}

export async function enableRules(value = true) {
    const enable = !!value;
    const descr = enable ? 'Enable rules' : 'Disable rules';

    await test(`${descr}`, async () => {
        await checkNavigation();

        if (enable === App.view.isRulesEnabled()) {
            throw new Error(`Import rules already ${enable ? 'enabled' : 'disabled'}`);
        }

        // Apply rules or restore original import data according to enable flag
        // and convert to expected state of ImportListItem component
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

                    const imported = ImportList.render([importTrans], App.state);
                    return copyObject(imported.items[0]);
                }

                model = item.restoreOriginal();
                if (App.view.model.mainAccount !== model.mainAccount.id) {
                    model = item.onChangeMainAccount(model, App.view.model.mainAccount);
                }
            } else {
                model = item.model;
            }

            const result = item.getExpectedState(model).values;
            return copyObject(result);
        });

        await App.view.enableRules(enable);

        App.view.expectedState = {
            values: {
                itemsList: {
                    items: itemsData,
                },
            },
        };

        return App.view.checkState();
    });
}

/** Enable/disable items */
export async function enableItems({ index, value = true }) {
    const enable = !!value;
    const descr = enable ? 'Enable items' : 'Disable items';

    await test(`${descr} [${index}]`, async () => {
        if (!Array.isArray(index)) {
            throw new Error('Invalid parameters');
        }

        await checkNavigation();

        await App.view.enableItems(index, enable);

        App.view.expectedState = {
            values: {
                itemsList: App.view.content.itemsList.getExpectedState(),
            },
        };

        return App.view.checkState();
    });
}

/** Update item */
export async function updateItem(params) {
    if (!params || !('pos' in params)) {
        throw new Error('Invalid parameters');
    }

    setBlock(`Update item [${params.pos}]`, 2);

    await checkNavigation();

    const actDescr = {
        changeType: 'Change transaction type',
        changeDestAccount: 'Change second account',
        changePerson: 'Change person',
        inputAmount: 'Input amount',
        inputDestAmount: 'Input second amount',
        changeCurrency: 'Change currency',
        inputDate: 'Input date',
        inputComment: 'Input comment',
    };

    const actions = Array.isArray(params.action) ? params.action : [params.action];
    for (const action of actions) {
        let descr;

        if (action.action === 'changeCurrency') {
            const currency = Currency.getById(action.data);
            if (!currency) {
                throw new Error(`Currency (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${currency.name}'`;
        } else if (action.action === 'changeDestAccount') {
            const userAccounts = App.state.accounts.getUserVisible();
            const account = userAccounts.getItem(action.data);
            if (!account) {
                throw new Error(`Account (${action.data}) not found`);
            }

            descr = `${actDescr[action.action]} to '${account.name}'`;
        } else if (action.action === 'changePerson') {
            const persons = App.state.persons.getVisible();
            const person = persons.getItem(action.data);
            if (!person) {
                throw new Error(`Person (${action.data}) not found`);
            }

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
        values: {
            itemsList: App.view.content.itemsList.getExpectedState(),
        },
    };
    await test('View state', () => App.view.checkState());
}

/**
 * Click by delete button of items specified by indexes
 * @param {number|number[]} indexes - index or array of indexes of items to delete
 */
export async function deleteItems(indexes) {
    const itemInds = Array.isArray(indexes) ? indexes : [indexes];

    await test(`Delete import item(s) [${itemInds.join()}]`, async () => {
        await checkNavigation();

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
            values: { itemsList: { items: expected } },
        };

        return App.view.checkState();
    });
}

/**
 * Click by delete all items button test
 */
export async function deleteAllItems() {
    await test('Delete all import items', async () => {
        await checkNavigation();

        await App.view.deleteAllItems();

        App.view.expectedState = {
            values: { itemsList: { items: [] } },
        };

        return App.view.checkState();
    });
}

/** Submit */
export async function submit() {
    await test('Submit items', async () => {
        await checkNavigation();

        await App.state.fetch();

        const enabledItems = App.view.content.itemsList.getEnabledItems();
        let isValid = (enabledItems.length > 0);
        for (const item of enabledItems) {
            const expectedTransaction = item.getExpectedTransaction(item.model);
            const createRes = App.state.createTransaction(expectedTransaction);
            if (!createRes) {
                isValid = false;
            }
        }

        const okNotification = { success: true, message: 'All transactions have been successfully imported' };

        try {
            await App.view.submit();

            if (isValid) {
                App.view.expectedState = {
                    msgPopup: okNotification,
                    values: {
                        itemsList: { items: [] },
                    },
                };
            } else {
                App.view.expectedState = {
                    values: {
                        itemsList: App.view.content.itemsList.getExpectedState(),
                    },
                };
            }
            await App.view.checkState();
            await App.view.closeNotification();
        } catch (e) {
            if (!(e instanceof ImportViewSubmitError) || isValid) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });
}
