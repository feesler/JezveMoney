import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
    copyObject,
    asArray,
    formatDate,
} from 'jezve-test';
import { TransactionListView } from '../view/TransactionListView.js';
import { TransactionView } from '../view/TransactionView.js';
import { MainView } from '../view/MainView.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../model/Transaction.js';
import { App } from '../Application.js';
import { generateId } from '../common.js';
import { __ } from '../model/locale.js';
import { TransactionList } from '../view/component/TransactionList/TransactionList.js';

export const decimalInputTestStrings = [
    '.',
    '-',
    '-.',
    '-.0',
    '-.01',
    '-.015',
    '-0',
    '-0.',
    '-0.0',
    '-0.01',
    '-0.015',
    '.0',
    '.01',
    '.015',
    '0',
    '0.',
    '0.0',
    '0.01',
    '0.015',
    '',
    '1',
    '1.',
    '1.0',
    '1.01',
    '1.010',
    '1.0101',
];

export const runAction = async ({ action, data }) => {
    let testDescr = null;

    assert.instanceOf(App.view, TransactionView, 'Invalid view');

    assert(App.view.isActionAvailable(action), 'Invalid action specified');

    if (action === 'changeSrcAccount') {
        const userAccounts = App.state.getUserAccounts();
        const acc = userAccounts.getItem(data);
        assert(acc, `Account '${data}' not found`);

        testDescr = `Change source account to '${acc.name}'`;
    }

    if (action === 'changeDestAccount') {
        const userAccounts = App.state.getUserAccounts();
        const acc = userAccounts.getItem(data);
        assert(acc, `Account '${data}' not found`);

        testDescr = `Change destination account to '${acc.name}'`;
    }

    if (action === 'changePerson') {
        const person = App.state.persons.getItem(data);
        assert(person, `Person '${data}' not found`);

        testDescr = `Change person to '${person.name}'`;
    }

    if (action === 'toggleAccount') {
        testDescr = App.view.model.noAccount ? 'Enable account' : 'Disable account';
    }

    if (action === 'changeAccount') {
        if (data === null) {
            if (!App.view.model.noAccount) {
                await test('Disable account', () => App.view.toggleAccount());
                return;
            }
        } else {
            if (App.view.model.noAccount) {
                await test('Enable account', () => App.view.toggleAccount());
            }

            const userAccounts = App.state.getUserAccounts();
            const acc = userAccounts.getItem(data);
            assert(acc, `Account '${data}' not found`);

            testDescr = `Change account to '${acc.name}'`;
        }
    }

    if (action === 'swapSourceAndDest') {
        testDescr = 'Swap source and destination';
    }

    if (action === 'changeSourceCurrency' || action === 'changeDestCurrency') {
        const curr = App.currency.getItem(data);
        assert(curr, `Currency (${data}) not found`);

        if (action === 'changeSourceCurrency') {
            testDescr = `Change source currency to '${curr.code}'`;
        } else {
            testDescr = `Change destination currency to '${curr.code}'`;
        }
    }

    if (action === 'changeCategory') {
        const category = App.state.categories.getItem(data);
        assert(category, `Category '${data}' not found`);

        testDescr = `Change category to '${category.name}'`;
    }

    if (action === 'inputSrcAmount') {
        testDescr = `Input source amount '${data}'`;
    }

    if (action === 'inputDestAmount') {
        testDescr = `Input destination amount '${data}'`;
    }

    if (action === 'inputResBalance') {
        testDescr = `Input source result balance '${data}'`;
    }

    if (action === 'inputDestResBalance') {
        testDescr = `Input destination result balance '${data}'`;
    }

    if (action === 'inputExchRate') {
        testDescr = `Input exchange rate '${data}'`;
    }

    if (action === 'toggleExchange') {
        testDescr = 'Toggle exchange rate direction';
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

    if (action === 'inputDate') {
        testDescr = `Input date '${data}'`;
    }

    if (action === 'selectDate') {
        testDescr = `Select date '${formatDate(data)}'`;
    }

    if (action === 'inputComment') {
        testDescr = `Input comment '${data}'`;
    }

    if (action === 'changeTransactionType') {
        testDescr = `Change type to ${Transaction.typeToString(data)}`;
    }

    await test(testDescr, () => App.view.runAction(action, data));
};

export const runActions = async (actions) => {
    for (const action of asArray(actions)) {
        await runAction(action);
    }
};

export const runGroup = async (action, data) => {
    for (const item of data) {
        await runAction({ action, data: item });
    }
};

export const createFromAccount = async (index) => {
    await test(`Initial state of create transaction view requested from account [${index}]`, async () => {
        await App.goToMainView();
        await App.view.goToNewTransactionByAccount(index);

        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const createFromPerson = async (index) => {
    await test(`Initial state of create transaction view requested from person [${index}]`, async () => {
        await App.goToMainView();
        await App.view.goToNewTransactionByPerson(index);

        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const submit = async () => {
    await test('Submit transaction', async () => {
        assert.instanceOf(App.view, TransactionView, 'Invalid view');

        const validInput = App.view.isValid();
        const expectedTransaction = (validInput) ? App.view.getExpectedTransaction() : null;

        await App.view.submit();

        if (validInput) {
            assert(!(App.view instanceof TransactionView), 'Fail to submit transaction');
        }

        if (expectedTransaction) {
            if (expectedTransaction.id) {
                App.state.updateTransaction(expectedTransaction);
            } else {
                App.state.createTransaction(expectedTransaction);
            }
        } else {
            await App.view.cancel();
        }

        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
};

export const update = async (type, pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');

    await test(`Initial state of update ${Transaction.typeToString(type)} view [${index}]`, async () => {
        await App.view.navigateToTransactions();
        await App.view.filterByType(type);
        await App.view.goToUpdateTransaction(pos);

        const origTransaction = App.view.getExpectedTransaction();
        const isDiff = (origTransaction.src_curr !== origTransaction.dest_curr);
        if (origTransaction.type === EXPENSE || origTransaction.type === INCOME) {
            App.view.model.state = (isDiff) ? 2 : 0;
        }

        if (origTransaction.type === TRANSFER) {
            App.view.model.state = (isDiff) ? 3 : 0;
        }

        if (origTransaction.type === DEBT) {
            const { debtType, noAccount, isDiffCurr } = App.view.model;

            if (isDiffCurr) {
                App.view.model.state = (debtType) ? 10 : 16;
            } else if (debtType) {
                App.view.model.state = (noAccount) ? 6 : 0;
            } else {
                App.view.model.state = (noAccount) ? 7 : 3;
            }
        }

        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const updateFromMainView = async (pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');

    await test(`Initial state of update transaction [${index}] view`, async () => {
        await App.goToMainView();
        await App.view.goToUpdateTransactionByIndex(pos);

        const origTransaction = App.view.getExpectedTransaction();
        const isDiff = (origTransaction.src_curr !== origTransaction.dest_curr);
        if (origTransaction.type === EXPENSE || origTransaction.type === INCOME) {
            App.view.model.state = (isDiff) ? 2 : 0;
        }

        if (origTransaction.type === TRANSFER) {
            App.view.model.state = (isDiff) ? 3 : 0;
        }

        if (origTransaction.type === DEBT) {
            const { debtType, noAccount, isDiffCurr } = App.view.model;

            if (isDiffCurr) {
                App.view.model.state = (debtType) ? 10 : 16;
            } else if (debtType) {
                App.view.model.state = (noAccount) ? 6 : 0;
            } else {
                App.view.model.state = (noAccount) ? 7 : 3;
            }
        }

        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const createFromAccountAndSubmit = async (pos, actions) => {
    setBlock(`Create transaction from account [${pos}]`, 2);

    await createFromAccount(pos);
    await runActions(actions);
    await submit();
};

export const createFromPersonAndSubmit = async (pos, actions) => {
    setBlock(`Create transaction from person [${pos}]`, 2);

    await createFromPerson(pos);
    await runActions(actions);
    await submit();
};

export const updateAndSubmit = async (type, pos, actions) => {
    setBlock(`Update ${Transaction.typeToString(type)} [${pos}]`, 2);

    await update(type, pos);
    await runActions(actions);
    await submit();
};

export const updateFromMainViewAndSubmit = async (pos, actions) => {
    setBlock(`Update transaction [${pos}] from main view`, 2);

    await updateFromMainView(pos);
    await runActions(actions);
    await submit();
};

export const deleteFromContextMenu = async (index) => {
    await test(`Delete transaction from context menu [${index}]`, async () => {
        await App.view.navigateToTransactions();

        await App.view.deleteFromContextMenu(index);

        const id = App.state.transactions.indexesToIds(index);
        App.state.deleteTransactions({ id });

        App.view.model.data = App.state.transactions.clone();

        const expectedItems = App.state.transactions.getPage(1);
        const expected = {
            transList: TransactionList.render(expectedItems.data, App.state),
        };
        App.view.checkState(expected);

        await App.view.iteratePages();

        return App.state.fetchAndTest();
    });
};

export const del = async (type, transactions) => {
    setBlock(`Delete transactions [${transactions.join()}]`, 3);

    await App.goToMainView();

    const expectedState = App.state.clone();
    const id = expectedState.transactions.filterByType(type).indexesToIds(transactions);
    expectedState.deleteTransactions({ id });

    // Navigate to transactions view and filter by specified type of transaction
    await App.view.navigateToTransactions();
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
    const id = expectedState.transactions.filterByType(type).indexesToIds(ind);
    expectedState.deleteTransactions({ id });

    if (!(App.view instanceof TransactionListView)) {
        await App.view.navigateToTransactions();
    }

    await App.view.filterByType(type);
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

export const setTransactionCategory = async ({ index, category }) => {
    await test('Set transaction category from main view', async () => {
        await App.goToMainView();

        const origItems = App.view.content.transactionsWidget.transList.getItems();

        const ind = parseInt(index, 10);
        assert.arrayIndex(origItems, ind);
        const { id } = origItems[ind];

        App.state.setTransactionCategory({ id, category });

        await App.view.setTransactionCategory(index, category);

        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const deleteFromMainView = async (pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Position of transaction not specified');

    await test(`Delete transaction [${ind}] from main view`, async () => {
        const expectedState = App.state.clone();
        const id = expectedState.transactions.indexesToIds(ind);
        expectedState.deleteTransactions({ id });

        await App.goToMainView();
        await App.view.deleteTransactionByIndex(ind);

        App.state.setState(expectedState);
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();
        return App.state.fetchAndTest();
    });
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
            notification: { success: false, message: __('ERR_TRANS_UPDATE', App.view.locale) },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Check navigation to create transaction with person account */
export const createFromPersonAccount = async ({ type, accountId }) => {
    const typeString = Transaction.typeToString(type);
    await test(`Create ${typeString} transaction from person account`, async () => {
        const account = App.state.accounts.getItem(accountId);
        assert(account, `Account ${accountId} not found`);
        assert(account.owner_id !== App.owner_id, 'Account of person is expected');

        const requestType = typeString.toLowerCase();
        const requestURL = `${baseUrl()}transactions/create/?acc_id=${accountId}&type=${requestType}`;
        await goTo(requestURL);
        assert.instanceOf(App.view, MainView, 'Invalid view');

        App.view.expectedState = {
            notification: { success: false, message: __('ERR_TRANS_CREATE', App.view.locale) },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Navigate to create transaction view and check form availability according to current state */
export const checkTransactionAvailable = async (type, directNavigate = false) => {
    await test(`${Transaction.typeToString(type)} transaction availability`, async () => {
        if (!directNavigate) {
            await App.view.navigateToTransactions();
            await App.view.goToCreateTransaction();
            assert.instanceOf(App.view, TransactionView, 'Invalid view');

            return App.view.changeTransactionType(type);
        }

        const requestURL = `${baseUrl()}transactions/create/?type=${type}`;
        await goTo(requestURL);

        let stateId = -1;
        const userAccounts = App.state.getUserAccounts();

        if (type === EXPENSE || type === INCOME) {
            if (userAccounts.length > 0) {
                stateId = 0;
            }
        } else if (type === TRANSFER) {
            if (userAccounts.length > 1) {
                const srcAccount = userAccounts.getItemByIndex(0);
                const destAccount = userAccounts.getItemByIndex(1);
                const isDiff = srcAccount.curr_id !== destAccount.curr_id;

                stateId = (isDiff) ? 3 : 0;
            }
        } else if (type === DEBT) {
            if (App.state.persons.length > 0) {
                stateId = (userAccounts.length > 0) ? 0 : 6;
            }
        }

        App.view.model.state = stateId;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const checkDebtNoAccountURL = async () => {
    await test('Debt no account URL', async () => {
        const requestURL = `${baseUrl()}transactions/create/?type=debt&acc_id=0`;
        await goTo(requestURL);

        App.view.model.state = (App.state.persons.length > 0) ? 6 : -1;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};
