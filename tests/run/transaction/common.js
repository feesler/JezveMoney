import { isObject, copyObject } from 'jezvejs';
import { test } from 'jezve-test';
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
import { setBlock, baseUrl, goTo } from '../../env.js';
import { formatProps, generateId } from '../../common.js';

export async function runAction({ action, data }) {
    let testDescr = null;

    if (!(App.view instanceof TransactionView)) {
        throw new Error('Invalid view');
    }

    if (!App.view.isActionAvailable(action)) {
        throw new Error('Invalid action specified');
    }

    if (action === 'changeSrcAccountByPos' || action === 'changeDestAccountByPos') {
        const ids = App.state.getAccountsByIndexes(data);
        if (!Array.isArray(ids) || !ids.length) {
            throw new Error(`Account (${data}) not found`);
        }

        const acc = App.state.accounts.getItem(ids[0]);
        if (!acc) {
            throw new Error(`Account (${data}) not found`);
        }

        if (action === 'changeSrcAccountByPos') {
            testDescr = `Change source account to (${acc.name})`;
        } else {
            testDescr = `Change destination account to (${acc.name})`;
        }
    }

    if (action === 'changePersonByPos') {
        const ids = App.state.getPersonsByIndexes(data);
        if (!Array.isArray(ids) || !ids.length) {
            throw new Error(`Person (${data}) not found`);
        }

        const person = App.state.persons.getItem(ids[0]);
        if (!person) {
            throw new Error(`Person (${data}) not found`);
        }

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
            if (!Array.isArray(ids) || !ids.length) {
                throw new Error(`Account (${data}) not found`);
            }

            const acc = App.state.accounts.getItem(ids[0]);
            if (!acc) {
                throw new Error(`Account (${data}) not found`);
            }

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
        if (!curr) {
            throw new Error(`Currency (${data}) not found`);
        }

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
}

export async function runActions(actions) {
    for (const action of actions) {
        await runAction(action);
    }
}

export async function runGroup(action, data) {
    for (const item of data) {
        await runAction({ action, data: item });
    }
}

export async function submit() {
    const validInput = App.view.isValid();

    const res = (validInput) ? App.view.getExpectedTransaction() : null;

    await App.view.submit();

    if (validInput && (App.view instanceof TransactionView)) {
        throw new Error('Fail to submit transaction');
    }

    return res;
}

export async function create(type, params, submitHandler) {
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
}

export async function update(type, params, submitHandler) {
    if (!isObject(params)) {
        throw new Error('Parameters not specified');
    }
    const props = copyObject(params);

    const pos = parseInt(props.pos, 10);
    if (Number.isNaN(pos) || pos < 0) {
        throw new Error('Position of transaction not specified');
    }
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
}

export async function del(type, transactions) {
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
            if (tr.length) {
                throw new Error(`Transaction(s) ${tr.join()} can not be removed`);
            } else {
                break;
            }
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
}

export async function delFromUpdate(type, pos) {
    const ind = parseInt(pos, 10);
    if (Number.isNaN(ind) || ind < 0) {
        throw new Error('Position of transaction not specified');
    }

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
}

export async function typeChangeLoop() {
    setBlock('Change transaction type tests', 2);

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
        { action: 'changeTransactionType', data: EXPENSE },
    ]);
}

/** Check navigation to update not existing transaction */
export async function securityTests() {
    setBlock('Transaction security', 2);

    let transactionId;

    do {
        transactionId = generateId();
    } while (App.state.transactions.getItem(transactionId) != null);

    const requestURL = `${baseUrl()}transactions/update/${transactionId}`;

    await test('Access to not existing transaction', async () => {
        await goTo(requestURL);
        if (!(App.view instanceof MainView)) {
            throw new Error('Invalid view');
        }

        App.view.expectedState = {
            msgPopup: { success: false, message: 'Fail to update transaction.' },
        };
        await App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
}

/** Navigate to create transaction view and check form availability according to current state */
export async function checkTransactionAvailable(type, directNavigate = false) {
    await test(`${Transaction.typeToString(type)} transaction availability`, async () => {
        if (directNavigate) {
            const requestURL = `${baseUrl()}transactions/create/?type=${type}`;

            await goTo(requestURL);
        } else {
            await App.goToMainView();
            await App.view.goToTransactions();
            await App.view.goToCreateTransaction();
            if (!(App.view instanceof TransactionView)) {
                throw new Error('Invalid view');
            }

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
}
