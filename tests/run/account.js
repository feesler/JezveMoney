import {
    test,
    asArray,
    copyObject,
    assert,
    setBlock,
    baseUrl,
    goTo,
} from 'jezve-test';
import { MainView } from '../view/MainView.js';
import { AccountListView } from '../view/AccountListView.js';
import { Transaction } from '../model/Transaction.js';
import { createCSV, generateId } from '../common.js';
import { App } from '../Application.js';
import { AccountView } from '../view/AccountView.js';
import { __ } from '../model/locale.js';

/** Navigate to accounts list page */
const checkNavigation = async () => {
    if (!(App.view instanceof AccountListView)) {
        await App.view.navigateToAccounts();
    }
};

export const create = async () => {
    await test('Create account', async () => {
        await checkNavigation();
        await App.view.goToCreateAccount();

        await App.state.fetch();
        const expAccount = {
            name: '',
            owner_id: App.owner_id,
            initbalance: '',
            balance: 0,
            curr_id: 1,
            icon_id: 0,
            flags: 0,
        };
        App.view.setExpectedAccount(expAccount);
        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const update = async (pos) => {
    await App.state.fetch();

    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index), 'Position of account not specified');

    await test(`Update account [${index}]`, async () => {
        await checkNavigation();
        await App.view.goToUpdateAccount(index);

        const [expAccount] = App.state.getAccountsByIndexes(index);
        assert(expAccount, 'Can not find specified account');
        App.view.setExpectedAccount(expAccount);
        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const showDetails = async ({ index, directNavigate = false }) => {
    await App.state.fetch();

    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of account not specified');

    await test(`Show details of account [${index}]`, async () => {
        await checkNavigation();
        return App.view.showDetails(index, directNavigate);
    });
};

export const closeDetails = async (directNavigate = false) => {
    await test('Close account details', async () => {
        await checkNavigation();
        return App.view.closeDetails(directNavigate);
    });
};

export const inputName = async (value) => {
    await test(`Input name '${value}'`, () => App.view.inputName(value));
};

export const inputBalance = async (value) => {
    await test(`Input initial balance '${value}'`, () => App.view.inputBalance(value));
};

export const changeCurrency = async (value) => {
    const currency = App.currency.getItem(value);
    const name = (currency) ? currency.name : `(${value})`;

    await test(`Change currency to '${name}'`, () => App.view.changeCurrency(value));
};

export const changeIcon = async (value) => {
    const icon = App.icons.getItem(value);
    const name = (icon) ? __(icon.name, 'en') : `(${value})`;

    await test(`Change icon to '${name}'`, () => App.view.changeIcon(value));
};

export const submit = async () => {
    await test('Submit account', async () => {
        assert.instanceOf(App.view, AccountView, 'Invalid view');

        const validInput = App.view.isValid();
        const expAccount = (validInput) ? App.view.getExpectedAccount() : null;

        await App.view.submit();

        if (validInput) {
            assert.instanceOf(App.view, AccountListView, 'Fail to submit account');
        }

        if (expAccount) {
            if (expAccount.id) {
                App.state.updateAccount(expAccount);
            } else {
                App.state.createAccount(expAccount);
            }
        } else {
            await App.view.cancel();
        }

        App.view.expectedState = AccountListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const del = async (accounts) => {
    const indexes = Array.isArray(accounts) ? accounts : [accounts];

    await test(`Delete account(s) [${indexes.join()}]`, async () => {
        await checkNavigation();

        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(indexes, true);
        App.state.deleteAccounts(ids);

        await App.view.deleteAccounts(indexes);

        App.view.expectedState = AccountListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Invalid position of account specified');

    await test(`Delete account from update view [${ind}]`, async () => {
        await checkNavigation();
        await App.view.goToUpdateAccount(ind);
        await App.state.fetch();

        await App.view.deleteSelfItem();

        const ids = App.state.getAccountsByIndexes(ind, true);
        App.state.deleteAccounts(ids);

        App.view.expectedState = AccountListView.render(App.state);
        App.view.checkState();

        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const show = async (accounts, val = true) => {
    const itemIds = asArray(accounts);
    const actVerb = (val) ? 'Show' : 'Hide';

    await test(`${actVerb} account(s) [${itemIds.join()}]`, async () => {
        await checkNavigation();

        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(itemIds, true);
        App.state.showAccounts(ids, val);

        if (val) {
            await App.view.showAccounts(itemIds);
        } else {
            await App.view.hideAccounts(itemIds);
        }

        App.view.expectedState = AccountListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const hide = async (accounts) => show(accounts, false);

export const exportTest = async (accounts) => {
    const itemIds = asArray(accounts);

    await test(`Export accounts [${itemIds.join()}]`, async () => {
        await checkNavigation();

        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(itemIds, true);
        const trList = App.state.transactions.filterByAccounts(ids);
        const transactions = trList.sortAsc();

        const header = [
            'ID',
            'Type',
            'Source amount',
            'Destination amount',
            'Source result',
            'Destination result',
            'Date',
            'Comment',
        ];
        const data = transactions.map((transaction) => [
            transaction.id,
            Transaction.typeToString(transaction.type),
            App.currency.format(transaction.src_curr, transaction.src_amount),
            App.currency.format(transaction.dest_curr, transaction.dest_amount),
            App.currency.format(transaction.src_curr, transaction.src_result),
            App.currency.format(transaction.dest_curr, transaction.dest_result),
            Transaction.formatDate(transaction.date),
            transaction.comment,
        ]);

        const expectedContent = createCSV({ header, data });
        const content = await App.view.exportAccounts(itemIds);

        return assert.deepMeet(content.trim(), expectedContent.trim());
    });
};

export const toggleSelect = async (accounts) => {
    const itemInds = asArray(accounts);

    await test(`Toggle select items [${itemInds.join()}]`, async () => {
        await checkNavigation();

        const origItems = App.view.getItems();

        const indexes = [];
        for (const pos of itemInds) {
            const ind = parseInt(pos, 10);
            assert.arrayIndex(origItems, ind);

            indexes.push(ind);
        }

        let expectedItems = origItems.map((item, ind) => {
            const res = copyObject(item);
            if (indexes.includes(ind)) {
                res.isActive = !res.isActive;
            }

            return res;
        });

        await App.view.selectAccounts(indexes);
        let items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectAccounts(indexes);
        items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        return true;
    });
};

export const selectAll = async () => {
    await test('Select all accounts', async () => {
        await checkNavigation();
        return App.view.selectAll();
    });
};

export const deselectAll = async () => {
    await test('Deselect all accounts', async () => {
        await checkNavigation();
        return App.view.deselectAll();
    });
};

/** Check navigation to update not existing account */
export const securityTests = async () => {
    setBlock('Account security', 2);

    let accountId;

    do {
        accountId = generateId();
    } while (App.state.accounts.getItem(accountId) != null);

    const requestURL = `${baseUrl()}accounts/update/${accountId}`;

    await test('Access to not existing account', async () => {
        await goTo(requestURL);
        assert.instanceOf(App.view, AccountListView, 'Invalid view');

        App.view.expectedState = {
            msgPopup: { success: false, message: __('ERR_ACCOUNT_UPDATE', App.view.locale) },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};
