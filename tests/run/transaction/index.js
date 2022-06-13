import { copyObject } from 'jezvejs';
import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
} from 'jezve-test';
import { TransactionsView } from '../../view/TransactionsView.js';
import { TransactionView } from '../../view/TransactionView.js';
import { MainView } from '../../view/MainView.js';
import { Currency } from '../../model/Currency.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../../model/Transaction.js';
import { AccountsList } from '../../model/AccountsList.js';
import { App } from '../../Application.js';
import { formatProps, generateId } from '../../common.js';
import * as AccountTests from '../account.js';

export const runAction = async ({ action, data }) => {
    let testDescr = null;

    assert.instanceOf(App.view, TransactionView, 'Invalid view');

    assert(App.view.isActionAvailable(action), 'Invalid action specified');

    if (action === 'changeSrcAccountByPos' || action === 'changeDestAccountByPos') {
        const ids = App.state.getAccountsByIndexes(data);
        assert(Array.isArray(ids) && ids.length > 0, `Account (${data}) not found`);

        const acc = App.state.accounts.getItem(ids[0]);
        assert(acc, `Account (${data}) not found`);

        if (action === 'changeSrcAccountByPos') {
            testDescr = `Change source account to (${acc.name})`;
        } else {
            testDescr = `Change destination account to (${acc.name})`;
        }
    }

    if (action === 'changePersonByPos') {
        const ids = App.state.getPersonsByIndexes(data);
        assert(Array.isArray(ids) && ids.length > 0, `Person (${data}) not found`);

        const person = App.state.persons.getItem(ids[0]);
        assert(person, `Person (${data}) not found`);

        testDescr = `Change person to (${person.name})`;
    }

    if (action === 'toggleAccount') {
        testDescr = App.view.model.noAccount ? 'Enable account' : 'Disable account';
    }

    if (action === 'changeAccountByPos') {
        if (data === null) {
            if (!App.view.model.noAccount) {
                await test('Disable account', () => App.view.toggleAccount());
                return;
            }
        } else {
            if (App.view.model.noAccount) {
                await test('Enable account', () => App.view.toggleAccount());
            }

            const ids = App.state.getAccountsByIndexes(data);
            assert(Array.isArray(ids) && ids.length > 0, `Account (${data}) not found`);

            const acc = App.state.accounts.getItem(ids[0]);
            assert(acc, `Account (${data}) not found`);

            testDescr = `Change account to (${acc.name})`;
        }
    }

    if (action === 'toggleDebtType') {
        if (typeof data !== 'undefined' && !!data === App.view.model.debtType) {
            return;
        }

        const debtTypeStr = App.view.model.debtType ? 'take' : 'give';
        testDescr = `Change debt type (${debtTypeStr})`;
    }

    if (action === 'changeSourceCurrency' || action === 'changeDestCurrency') {
        const curr = Currency.getById(data);
        assert(curr, `Currency (${data}) not found`);

        if (action === 'changeSourceCurrency') {
            testDescr = `Change source currency to ${curr.name}`;
        } else {
            testDescr = `Change destination currency to ${curr.name}`;
        }
    }

    if (action === 'inputSrcAmount') {
        testDescr = `Source amount (${data}) input`;
    }

    if (action === 'inputDestAmount') {
        testDescr = `Destination amount (${data}) input`;
    }

    if (action === 'inputResBalance') {
        testDescr = `Source result balance (${data}) input`;
    }

    if (action === 'inputDestResBalance') {
        testDescr = `Destination result balance (${data}) input`;
    }

    if (action === 'inputExchRate') {
        testDescr = `Input exchange rate (${data})`;
    }

    if (action === 'clickSrcAmount') {
        testDescr = 'Click on source amount';
    }

    if (action === 'clickDestAmount') {
        testDescr = 'Click on destination amount';
    }

    if (action === 'clickSrcResultBalance') {
        testDescr = 'Click on source result balance';
    }

    if (action === 'clickDestResultBalance') {
        testDescr = 'Click on destination result balance';
    }

    if (action === 'clickExchRate') {
        testDescr = 'Click on exchange rate';
    }

    if (action === 'changeDate') {
        testDescr = `Date (${data}) input`;
    }

    if (action === 'inputComment') {
        testDescr = `Comment (${data}) input`;
    }

    if (action === 'changeTransactionType') {
        testDescr = `Change type to ${Transaction.typeToString(data)}`;
    }

    await test(testDescr, () => App.view.runAction(action, data));
};

export const runActions = async (actions) => {
    for (const action of actions) {
        await runAction(action);
    }
};

export const runGroup = async (action, data) => {
    for (const item of data) {
        await runAction({ action, data: item });
    }
};

export const submit = async () => {
    const validInput = App.view.isValid();

    const res = (validInput) ? App.view.getExpectedTransaction() : null;

    await App.view.submit();

    if (validInput) {
        assert(!(App.view instanceof TransactionView), 'Fail to submit transaction');
    }

    return res;
};

export const create = async (type, params, submitHandler) => {
    setBlock(`Create ${Transaction.typeToString(type)} (${formatProps(params)})`, 2);

    // Navigate to create transaction page
    const accNum = ('fromAccount' in params) ? params.fromAccount : 0;
    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(accNum);

    if (!App.view.content.typeMenu.isSingleSelected(type)) {
        await App.view.changeTransactionType(type);
    }

    // Input data and submit
    const expectedTransaction = await submitHandler(params);
    if (expectedTransaction) {
        App.state.createTransaction(expectedTransaction);
    } else {
        await App.view.cancel();
    }

    await test('Submit result', async () => {
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
};

export const update = async (type, params, submitHandler) => {
    assert.isObject(params, 'Parameters not specified');
    const props = copyObject(params);

    const pos = parseInt(props.pos, 10);
    assert(!Number.isNaN(pos) && pos >= 0, 'Position of transaction not specified');
    delete props.pos;

    setBlock(`Update ${Transaction.typeToString(type)} [${pos}] (${formatProps(props)})`, 2);

    await App.goToMainView();
    await App.view.goToTransactions();

    if (!App.view.content.typeMenu.isSingleSelected(type)) {
        await App.view.filterByType(type);
    }

    await App.view.goToUpdateTransaction(pos);

    // Step
    let origTransaction = App.view.getExpectedTransaction();
    const expectedState = App.state.clone();
    origTransaction = expectedState.getExpectedTransaction(origTransaction);
    const originalAccounts = copyObject(expectedState.accounts.data);
    const canceled = AccountsList.cancelTransaction(originalAccounts, origTransaction);
    App.state.accounts.data = canceled;
    await App.view.parse();

    const expectedTransaction = await submitHandler(props);
    if (expectedTransaction) {
        expectedState.accounts.data = originalAccounts;
        expectedState.updateTransaction(expectedTransaction);
        App.state.setState(expectedState);
    }

    await test('Submit result', async () => {
        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
};

export const del = async (type, transactions) => {
    setBlock(`Delete transactions [${transactions.join()}]`, 3);

    await App.goToMainView();

    const expectedState = App.state.clone();
    const ids = expectedState.transactions.filterByType(type).indexesToIds(transactions);
    expectedState.deleteTransactions(ids);

    // Navigate to transactions view and filter by specified type of transaction
    await App.view.goToTransactions();
    await App.view.filterByType(type);

    let tr = copyObject(transactions);
    const onPage = App.config.transactionsOnPage;

    while (true) {
        const pageNum = App.view.currentPage();

        const absTrOnCurrentPage = tr.filter(
            (ind) => (ind >= onPage * (pageNum - 1) && ind < onPage * pageNum),
        );

        if (absTrOnCurrentPage.length) {
            const trOnCurrentPage = absTrOnCurrentPage.map((ind) => (ind - (pageNum - 1) * onPage));

            // Request view to select and delete transactions
            await App.view.deleteTransactions(trOnCurrentPage);

            // Refresh state and rebuild model
            await App.state.fetch();
            await App.view.updateModel();

            // After delete transactions navigation occurs to page without filters,
            // so we need to restore it
            await App.view.filterByType(type);

            // Exclude previously removed transactions
            tr = tr.filter((ind) => !absTrOnCurrentPage.includes(ind));
            if (!tr.length) {
                break;
            }

            // Shift positions
            const shiftSize = trOnCurrentPage.length;
            tr = tr.map((ind) => ind - shiftSize);
        } else if (App.view.isLastPage()) {
            assert(tr.length === 0, `Transaction(s) ${tr.join()} can not be removed`);
            break;
        } else {
            await App.view.goToNextPage();
        }
    }

    await test('Submit result', async () => {
        await App.goToMainView();
        App.state.setState(expectedState);
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (type, pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Position of transaction not specified');

    setBlock(`Delete ${Transaction.typeToString(type)} from update view [${ind}]`, 2);

    const expectedState = App.state.clone();
    const ids = expectedState.transactions.filterByType(type).indexesToIds(ind);
    expectedState.deleteTransactions(ids);

    if (!(App.view instanceof TransactionsView)) {
        if (!(App.view instanceof MainView)) {
            await App.goToMainView();
        }
        await App.view.goToTransactions();
    }

    if (!App.view.content.typeMenu.isSingleSelected(type)) {
        await App.view.filterByType(type);
    }

    await App.view.goToUpdateTransaction(ind);

    await App.view.deleteSelfItem();

    await test('Submit result', async () => {
        await App.goToMainView();
        App.state.setState(expectedState);
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
};

export const typeChangeLoop = async () => {
    setBlock('Change transaction type tests', 2);

    // Hide first account
    let userVisibleAccounts = App.state.accounts.getUserVisible();
    const account = userVisibleAccounts.getItemByIndex(0);
    await AccountTests.hide(0);

    await App.goToMainView();
    await App.view.goToNewTransactionByAccount(0);

    // Start from Expense type
    await runActions([
        { action: 'changeTransactionType', data: INCOME },
        { action: 'changeTransactionType', data: EXPENSE },
        { action: 'changeTransactionType', data: TRANSFER },
        { action: 'changeTransactionType', data: EXPENSE },
        { action: 'changeTransactionType', data: DEBT },
        { action: 'changeTransactionType', data: INCOME },
        { action: 'changeTransactionType', data: TRANSFER },
        { action: 'changeTransactionType', data: INCOME },
        { action: 'changeTransactionType', data: DEBT },
        { action: 'changeTransactionType', data: TRANSFER },
        { action: 'changeTransactionType', data: DEBT },
        // Disable account to check obtaining first visible account on switch to expense
        { action: 'toggleAccount' },
        { action: 'changeTransactionType', data: EXPENSE },
    ]);

    // Show previously hidden account
    userVisibleAccounts = App.state.accounts.getUserVisible();
    const userHiddenAccounts = App.state.accounts.getUserHidden();
    const index = userHiddenAccounts.getIndexById(account.id);
    await AccountTests.show(userVisibleAccounts.length + index);
};

/** Check navigation to update not existing transaction */
export const securityTests = async () => {
    setBlock('Transaction security', 2);

    let transactionId;

    do {
        transactionId = generateId();
    } while (App.state.transactions.getItem(transactionId) != null);

    const requestURL = `${baseUrl()}transactions/update/${transactionId}`;

    await test('Access to not existing transaction', async () => {
        await goTo(requestURL);
        assert.instanceOf(App.view, MainView, 'Invalid view');

        App.view.expectedState = {
            msgPopup: { success: false, message: 'Fail to update transaction.' },
        };
        await App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Check navigation to create transaction with hidden account */
export const createFromHiddenAccount = async ({ type, accountId }) => {
    const typeString = Transaction.typeToString(type);
    await test(`Create ${typeString} transaction from hidden account`, async () => {
        const userAccounts = App.state.accounts.getUserAccounts();
        const account = userAccounts.getItem(accountId);
        assert(account, `Account ${accountId} not found`);
        assert(userAccounts.isHidden(account), 'Hidden account is expected');

        const requestType = typeString.toLowerCase();
        const requestURL = `${baseUrl()}transactions/create/?acc_id=${accountId}&type=${requestType}`;
        await goTo(requestURL);
        assert.instanceOf(App.view, MainView, 'Invalid view');

        App.view.expectedState = {
            msgPopup: { success: false, message: 'Fail to create new transaction.' },
        };
        await App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Navigate to create transaction view and check form availability according to current state */
export const checkTransactionAvailable = async (type, directNavigate = false) => {
    await test(`${Transaction.typeToString(type)} transaction availability`, async () => {
        if (directNavigate) {
            const requestURL = `${baseUrl()}transactions/create/?type=${type}`;

            await goTo(requestURL);
        } else {
            await App.goToMainView();
            await App.view.goToTransactions();
            await App.view.goToCreateTransaction();
            assert.instanceOf(App.view, TransactionView, 'Invalid view');

            if (!App.view.content.typeMenu.isSingleSelected(type)) {
                await App.view.changeTransactionType(type);
            }
        }

        let stateId = -1;
        const userVisibleAccounts = App.state.accounts.getUserVisible();
        const visiblePersons = App.state.persons.getVisible();

        if (type === EXPENSE || type === INCOME) {
            if (userVisibleAccounts.length > 0) {
                stateId = 0;
            }
        } else if (type === TRANSFER) {
            if (userVisibleAccounts.length > 1) {
                const srcAccount = userVisibleAccounts.getItemByIndex(0);
                const destAccount = userVisibleAccounts.getItemByIndex(1);
                const isDiff = srcAccount.curr_id !== destAccount.curr_id;

                stateId = (isDiff) ? 3 : 0;
            }
        } else if (type === DEBT) {
            if (visiblePersons.length > 0) {
                stateId = (userVisibleAccounts.length > 0) ? 0 : 6;
            }
        }

        App.view.setExpectedState(stateId);
        await App.view.checkState();

        return true;
    });
};
