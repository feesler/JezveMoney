import { test, copyObject, assert } from 'jezve-test';
import { MainView } from '../view/MainView.js';
import { AccountsView } from '../view/AccountsView.js';
import { Transaction } from '../model/Transaction.js';
import { Currency } from '../model/Currency.js';
import { formatProps, createCSV, generateId } from '../common.js';
import { App } from '../Application.js';
import { setBlock, baseUrl, goTo } from '../env.js';
import { AccountView } from '../view/AccountView.js';

/** Navigate to accounts list page */
async function checkNavigation() {
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }
}

export async function stateLoop() {
    setBlock('View state loop', 2);

    // Navigate to create account view
    await checkNavigation();
    await App.view.goToCreateAccount();

    // Check initial state
    const expAccount = {
        name: '',
        initbalance: 0,
        balance: '0',
        curr_id: 1,
        icon_id: 0,
        flags: 0,
    };
    App.view.setExpectedAccount(expAccount);
    await test('Initial state of account view', () => App.view.checkState());

    // Check account name is 'New account' brefore input name
    await test('Change currency', () => App.view.changeCurrency(3));
    await test('Input balance (100.01)', () => App.view.inputBalance('100.01'));
    await test('Change icon', () => App.view.changeIcon(1));

    await test('Account name input', () => App.view.inputName('acc_1'));

    // Change currency to USD
    await test('Change currency', () => App.view.changeCurrency(2));

    await test('Input balance (100 000.01)', () => App.view.inputBalance('100000.01'));

    // Change currency back to RUB
    await test('Change currency back', () => App.view.changeCurrency(1));

    // Input empty value for initial balance
    await test('Input empty balance', () => App.view.inputBalance(''));
    await test('Input dot (.) balance', () => App.view.inputBalance('.'));
    await test('Input (.01) balance', () => App.view.inputBalance('.01'));
    await test('Input (10000000.01) balance', () => App.view.inputBalance('10000000.01'));

    // Change icon to safe
    await test('Change icon', () => App.view.changeIcon(2));
    await test('Input (1000.01) balance', () => App.view.inputBalance('1000.01'));

    await App.view.cancel();
}

export async function submitAccount(params) {
    if (!(App.view instanceof AccountView)) {
        throw new Error('Invalid view');
    }

    // Input account name
    if ('name' in params) {
        await App.view.inputName(params.name);
    }

    // Change currency
    if ('curr_id' in params) {
        await App.view.changeCurrency(params.curr_id);
    }

    // Input balance
    if ('initbalance' in params) {
        await App.view.inputBalance(params.initbalance);
    }

    // Change icon
    if ('icon_id' in params) {
        await App.view.changeIcon(params.icon_id);
    }

    const validInput = App.view.isValid();
    const res = (validInput) ? App.view.getExpectedAccount() : null;

    await App.view.submit();

    if (validInput && !(App.view instanceof AccountsView)) {
        throw new Error('Fail to submit account');
    }

    return res;
}

export async function create(params) {
    if (!params) {
        throw new Error('No params specified');
    }

    await test(`Create account (${formatProps(params)})`, async () => {
        // Navigate to create account view
        await checkNavigation();
        await App.view.goToCreateAccount();
        // Check initial state of view
        await App.state.fetch();
        let expAccount = {
            name: '',
            owner_id: App.owner_id,
            initbalance: '0',
            balance: 0,
            curr_id: 1,
            icon_id: 0,
            flags: 0,
        };
        App.view.setExpectedAccount(expAccount);
        await App.view.checkState();
        // Perform actions on view
        expAccount = await submitAccount(params);
        if (expAccount) {
            App.state.createAccount(expAccount);
        } else {
            await App.view.cancel();
        }
        // Check state of accounts list view
        App.view.expectedState = AccountsView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function update(params) {
    if (!params) {
        throw new Error('No params specified');
    }
    const props = copyObject(params);

    // Check initial state
    await App.state.fetch();

    let pos;
    if ('id' in props) {
        pos = App.state.accounts.getIndexById(props.id);
    } else {
        pos = parseInt(props.pos, 10);
        if (Number.isNaN(pos)) {
            throw new Error('Position of account not specified');
        }
        delete props.pos;
    }

    await test(`Update account [${pos}] (${formatProps(props)})`, async () => {
        // Navigate to update account view
        await checkNavigation();
        await App.view.goToUpdateAccount(pos);
        // Prepare expected state
        const [accountId] = App.state.getAccountsByIndexes(pos);
        let expAccount = App.state.accounts.getItem(accountId);
        if (!expAccount) {
            throw new Error('Can not find specified account');
        }
        App.view.setExpectedAccount(expAccount);
        await App.view.checkState();

        expAccount = await submitAccount(props);
        if (expAccount) {
            App.state.updateAccount(expAccount);
        } else {
            await App.view.cancel();
        }

        App.view.expectedState = AccountsView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function del(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    await test(`Delete account(s) [${itemIds.join()}]`, async () => {
        // Navigate to accounts list view
        await checkNavigation();
        // Prepare expected state
        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(itemIds);
        App.state.deleteAccounts(ids);
        // Perform actions on view
        await App.view.deleteAccounts(itemIds);
        // Check state of view
        App.view.expectedState = AccountsView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function delFromUpdate(pos) {
    const ind = parseInt(pos, 10);
    if (Number.isNaN(ind) || ind < 0) {
        throw new Error('Invalid position of account specified');
    }

    await test(`Delete account from update view [${ind}]`, async () => {
        // Navigate to update account view
        await checkNavigation();
        await App.view.goToUpdateAccount(ind);
        // Prepare expected state
        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(ind);
        App.state.deleteAccounts(ids);
        // Perform actions on view
        await App.view.deleteSelfItem();
        // Check state of accounts list view
        App.view.expectedState = AccountsView.render(App.state);
        await App.view.checkState();
        // Check state of main view
        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function show(accounts, val = true) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];
    const actVerb = (val) ? 'Show' : 'Hide';

    await test(`${actVerb} account(s) [${itemIds.join()}]`, async () => {
        // Navigate to accounts list view
        await checkNavigation();
        // Prepare expected state
        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(itemIds);
        App.state.showAccounts(ids, val);
        // Perform actions on view
        if (val) {
            await App.view.showAccounts(itemIds);
        } else {
            await App.view.hideAccounts(itemIds);
        }
        // Check state of view
        App.view.expectedState = AccountsView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
}

export async function hide(accounts) {
    return show(accounts, false);
}

export async function exportTest(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    await test(`Export accounts [${itemIds.join()}]`, async () => {
        // Navigate to accounts list view
        await checkNavigation();

        // Prepare expected content
        await App.state.fetch();
        const ids = App.state.getAccountsByIndexes(itemIds);
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
            Currency.format(transaction.src_curr, transaction.src_amount),
            Currency.format(transaction.dest_curr, transaction.dest_amount),
            Currency.format(transaction.src_curr, transaction.src_result),
            Currency.format(transaction.dest_curr, transaction.dest_result),
            transaction.date,
            transaction.comment,
        ]);

        const expectedContent = createCSV({ header, data });
        const content = await App.view.exportAccounts(itemIds);

        return assert.deepMeet(content.trim(), expectedContent.trim());
    });
}

export async function toggleSelect(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
        // Navigate to accounts list view
        await checkNavigation();

        const origItems = App.view.getItems();
        // Check correctness of arguments
        const indexes = [];
        for (const pos of itemIds) {
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
}

/** Check navigation to update not existing account */
export async function securityTests() {
    setBlock('Account security', 2);

    let accountId;

    do {
        accountId = generateId();
    } while (App.state.accounts.getItem(accountId) != null);

    const requestURL = `${baseUrl()}accounts/update/${accountId}`;

    await test('Access to not existing account', async () => {
        await goTo(requestURL);
        if (!(App.view instanceof AccountsView)) {
            throw new Error('Invalid view');
        }

        App.view.expectedState = {
            msgPopup: { success: false, message: 'Fail to update account.' },
        };
        await App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
}
