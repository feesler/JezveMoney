import { MainView } from '../view/main.js';
import { AccountsView } from '../view/accounts.js';
import { Transaction } from '../model/transaction.js';
import { Currency } from '../model/currency.js';
import {
    test,
    formatProps,
    copyObject,
    checkObjValue,
    createCSV,
} from '../common.js';
import { App } from '../app.js';
import { AccountView } from '../view/account.js';

export async function stateLoop() {
    App.view.setBlock('View state loop', 2);

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }
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
        await test(`Input name (${params.name})`, () => App.view.inputName(params.name));
    }

    // Change currency
    if ('curr_id' in params) {
        await test(`Select currency ${params.curr_id}`, () => App.view.changeCurrency(params.curr_id));
    }

    // Input balance
    if ('initbalance' in params) {
        await test('Input initial balance', () => App.view.inputBalance(params.initbalance));
    }

    // Change icon
    if ('icon_id' in params) {
        await test('Tile icon update', () => App.view.changeIcon(params.icon_id));
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

    const title = formatProps(params);
    App.view.setBlock(`Create account (${title})`, 2);

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }
    await App.view.goToCreateAccount();

    // Check initial state
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
    await test('Initial state of account view', () => App.view.checkState());

    expAccount = await submitAccount(params);
    if (expAccount) {
        App.state.createAccount(expAccount);
    } else {
        await App.view.cancel();
    }

    App.view.expectedState = AccountsView.render(App.state);
    await test('Create account', () => App.view.checkState());
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
        pos = App.state.accounts.getIndexOf(props.id);
    } else {
        pos = parseInt(props.pos, 10);
        if (Number.isNaN(pos)) {
            throw new Error('Position of account not specified');
        }
        delete props.pos;
    }

    const title = formatProps(props);
    App.view.setBlock(`Update account [${pos}] (${title})`, 2);

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }
    await App.view.goToUpdateAccount(pos);

    const ids = App.state.getAccountsByIndexes(pos);
    let expAccount = App.state.accounts.getItem(ids[0]);
    if (!expAccount) {
        throw new Error('Can not find specified account');
    }
    App.view.setExpectedAccount(expAccount);
    await test('Initial state of account view', () => App.view.checkState());

    expAccount = await submitAccount(props);
    if (expAccount) {
        App.state.updateAccount(expAccount);
    } else {
        await App.view.cancel();
    }

    App.view.expectedState = AccountsView.render(App.state);
    await test('Update account', () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function del(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    App.view.setBlock(`Delete account(s) [${itemIds.join()}]`, 2);

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }

    // Check initial state
    await App.state.fetch();

    const ids = App.state.getAccountsByIndexes(itemIds);
    App.state.deleteAccounts(ids);

    await App.view.deleteAccounts(itemIds);

    App.view.expectedState = AccountsView.render(App.state);
    await test(`Delete accounts [${itemIds.join()}]`, () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function delFromUpdate(pos) {
    const ind = parseInt(pos, 10);
    if (Number.isNaN(ind) || ind < 0) {
        throw new Error('Invalid position of account specified');
    }

    App.view.setBlock(`Delete account from update view [${ind}]`, 2);

    if (!(App.view instanceof AccountsView)) {
        if (!(App.view instanceof MainView)) {
            await App.goToMainView();
        }
        await App.view.goToAccounts();
    }

    await App.view.goToUpdateAccount(ind);

    await App.state.fetch();

    const ids = App.state.getAccountsByIndexes(ind);
    App.state.deleteAccounts(ids);

    await App.view.deleteSelfItem();

    App.view.expectedState = AccountsView.render(App.state);
    await test(`Delete account [${ind}]`, () => App.view.checkState());

    await App.goToMainView();

    App.view.expectedState = MainView.render(App.state);
    await test('Main page widgets update', () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function show(accounts, val = true) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    const showVerb = (val) ? 'Show' : 'Hide';
    App.view.setBlock(`${showVerb} account(s) [${itemIds.join()}]`, 2);

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }

    // Check initial state
    await App.state.fetch();

    const ids = App.state.getAccountsByIndexes(itemIds);
    App.state.showAccounts(ids, val);

    if (val) {
        await App.view.showAccounts(itemIds);
    } else {
        await App.view.hideAccounts(itemIds);
    }

    App.view.expectedState = AccountsView.render(App.state);

    await test(`${showVerb} accounts [${accounts.join()}]`, () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function hide(accounts) {
    return show(accounts, false);
}

export async function exportTest(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    // Navigate to create account view
    if (!(App.view instanceof AccountsView)) {
        await App.goToMainView();
        await App.view.goToAccounts();
    }

    // Prepare expected content
    const headerRow = [
        'ID',
        'Type',
        'Source amount',
        'Destination amount',
        'Source result',
        'Destination result',
        'Date',
        'Comment',
    ];

    // Prepare state
    await App.state.fetch();
    const ids = App.state.getAccountsByIndexes(itemIds);
    const trList = App.state.transactions.filterByAccounts(ids);
    const transactions = trList.sortAsc();

    const rows = transactions.map((transaction) => [
        transaction.id,
        Transaction.typeToString(transaction.type),
        Currency.format(transaction.src_curr, transaction.src_amount),
        Currency.format(transaction.dest_curr, transaction.dest_amount),
        Currency.format(transaction.src_curr, transaction.src_result),
        Currency.format(transaction.dest_curr, transaction.dest_result),
        transaction.date,
        transaction.comment,
    ]);

    let expectedContent = createCSV({ header: headerRow, data: rows });
    expectedContent = expectedContent.trim();

    let content = await App.view.exportAccounts(itemIds);
    content = content.trim();

    await test(`Export accounts [${itemIds.join()}]`, () => expectedContent === content);
}

export async function toggleSelect(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
        const origItems = App.view.getItems();
        // Check correctness of arguments
        const indexes = [];
        for (const pos of itemIds) {
            const ind = parseInt(pos, 10);
            if (Number.isNaN(ind) || ind < 0 || ind > origItems.length) {
                throw new Error(`Invalid item index ${pos}`);
            }
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
        checkObjValue(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectAccounts(indexes);
        items = App.view.getItems();
        checkObjValue(items, expectedItems);

        return true;
    });
}
