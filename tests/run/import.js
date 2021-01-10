import { App } from '../app.js';
import { test, copyObject } from '../common.js';
import { api } from '../model/api.js';
import { Currency } from '../model/currency.js';
import { applyTemplate, applyRules } from '../model/import.js';
import { ImportList } from '../view/component/importlist.js';
import { ImportView } from '../view/import.js';
import { ImportViewSubmitError } from '../error/importviewsubmit.js';
import { CREATE_TPL_STATE } from '../view/component/importuploaddialog.js';

/** Navigate to transactions list page */
async function checkNavigation() {
    if (App.view instanceof ImportView) {
        return;
    }

    await App.view.goToImportView();
}

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
 *
 * @param {*} item - transaction object from API
 * @param {*} reference - transaction item to compare
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
    const res = App.state.transactions.data.find(
        (item) => !skipList.includes(item.id) && isSimilarTransaction(item, transaction),
    );

    return res;
}

/** Admin access required */
export async function putFile(data) {
    const baseURL = App.environment.baseUrl();
    const uploadURL = `${baseURL}admin/tests/upload`;
    const defErrorMessage = 'Request failed';

    try {
        const response = await App.environment.httpReq(
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
    const baseURL = App.environment.baseUrl();
    const removeURL = `${baseURL}admin/tests/remove`;
    const defErrorMessage = 'Request failed';

    try {
        const data = { filename };

        const response = await App.environment.httpReq(
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

export async function selectTemplateById(value) {
    await test(`Select upload template [${value}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectUploadTemplateById(value);
        return App.view.checkState();
    });
}

export async function selectTemplateByIndex(value) {
    await test(`Select upload template by index [${value}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectUploadTemplateByIndex(value);
        return App.view.checkState();
    });
}

export async function inputTemplateName(value) {
    await test(`Input template name (${value})`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.inputTemplateName(value);
        return App.view.checkState();
    });
}

export async function selectTemplateColumn({ column, index }) {
    await test(`Select template column [${column} => ${index}]`, async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.selectTemplateColumn(column, index);
        return App.view.checkState();
    });
}

export async function createTemplate() {
    await test('Create template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.createTemplate();
        return App.view.checkState();
    });
}

/** Update currently selected template */
export async function updateTemplate() {
    await test('Update template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.updateTemplate();
        return App.view.checkState();
    });
}

/** Delete currently selected template */
export async function deleteTemplate() {
    await test('Delete template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }
        // Prepare expected content
        await App.state.fetch();
        const expectedTpl = App.view.getExpectedTemplate();
        App.state.templates.deleteItems(expectedTpl.id);

        // Perform actions on view
        await App.view.deleteTemplate();
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
}

export async function submitTemplate() {
    await test('Submit template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        // Prepare expected content
        await App.state.fetch();

        const expectedTpl = App.view.getExpectedTemplate();
        const uploadState = App.view.getUploadState();
        if (uploadState === CREATE_TPL_STATE) {
            App.state.createTemplate(expectedTpl);
        } else {
            App.state.updateTemplate(expectedTpl);
        }

        await App.view.submitTemplate();
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function cancelTemplate() {
    await test('Cancel template', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        await App.state.fetch();
        await App.view.cancelTemplate();
        return App.view.checkState();
    });
}

export async function submitUploaded(params) {
    await test('Submit file', async () => {
        if (!(App.view instanceof ImportView)) {
            throw new Error('Invalid view instance');
        }

        if (!await App.view.isUploadState()) {
            throw new Error('Invalid state of view');
        }

        const importData = parseCSV(params.data);
        const importRules = await api.importrule.list();
        const importConditios = await api.importcondition.list();
        const importActions = await api.importaction.list();

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

        let importTpl;
        if (params.template) {
            importTpl = App.state.templates.getItemByIndex(params.template);
        } else {
            importTpl = App.view.getExpectedTemplate();
        }

        let importTransactions = applyTemplate(importData, importTpl, mainAccount);

        const skipList = [];
        importTransactions = importTransactions.map(
            (item) => {
                const res = applyRules(item, importRules, importConditios, importActions);
                const tr = findSimilar(res, skipList);

                if (tr) {
                    skipList.push(tr.id);
                    res.enabled = false;
                }

                return res;
            },
        );

        let itemsList;
        if (params.account) {
            itemsList = {};
            itemsList.items = App.view.content.itemsList.items.map(
                (item) => {
                    const model = item.onChangeMainAccount(params.account);
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

        const itemsData = App.view.content.itemsList.items.map(
            (item) => {
                const model = item.onChangeMainAccount(accountId);
                return copyObject(item.getExpectedState(model).values);
            },
        );

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

    App.view.setBlock(`Update item [${params.pos}]`, 2);

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
            if (Number.isNaN(index) || index < 0 || index > itemsList.items.length) {
                throw new Error(`Invalid item index: ${ind}`);
            }

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
        const failNotification = { success: false, message: 'Fail to import transactions' };

        try {
            await App.view.submit();

            App.view.expectedState = {
                msgPopup: ((isValid) ? okNotification : failNotification),
            };
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
