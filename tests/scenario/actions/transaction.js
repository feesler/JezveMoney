import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
} from 'jezve-test';
import { TransactionListView } from '../../view/TransactionListView.js';
import { TransactionView } from '../../view/TransactionView.js';
import { MainView } from '../../view/MainView.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
    LIMIT_CHANGE,
} from '../../model/Transaction.js';
import { App } from '../../Application.js';
import { generateId } from '../../common.js';
import { __ } from '../../model/locale.js';
import { ACCOUNT_TYPE_CREDIT_CARD } from '../../model/AccountsList.js';
import { TransactionList } from '../../view/component/TransactionList/TransactionList.js';

export * from './transactionForm.js';

export const decimalInputTestStrings = [
    '-',
    '-.0',
    '-.015',
    '-0',
    '-0.0',
    '-0.015',
    '.',
    '.0',
    '.015',
    '0',
    '0.0',
    '0.015',
    '',
    '1',
    '1.0',
    '1.015',
];

export const createFromAccount = async (index) => {
    await test(`Initial state of create transaction view requested from account [${index}]`, async () => {
        await App.goToMainView();

        const [fromAccount] = App.state.getSortedAccountsByIndexes(index, true);
        const expected = TransactionView.getInitialState({ fromAccount });

        await App.view.goToNewTransactionByAccount(index);

        return App.view.checkState(expected);
    });
};

export const createFromPerson = async (index) => {
    await test(`Initial state of create transaction view requested from person [${index}]`, async () => {
        await App.goToMainView();

        const [fromPerson] = App.state.getSortedPersonsByIndexes(index, true);
        const expected = TransactionView.getInitialState({ fromPerson });

        await App.view.goToNewTransactionByPerson(index);

        return App.view.checkState(expected);
    });
};

export const submit = async () => {
    await test('Submit transaction', async () => {
        assert.instanceOf(App.view, TransactionView, 'Invalid view');

        const validInput = App.view.isValid();
        const expectedTransaction = App.view.getExpectedTransaction();

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
        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);
        return App.state.fetchAndTest();
    });
};

export const update = async (type, pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');
    const typeStr = Transaction.typeToString(type, App.config.logsLocale);

    await test(`Initial state of update ${typeStr} view [${index}]`, async () => {
        await App.view.navigateToTransactions();
        await App.view.filterByType(type);

        const transactions = App.view.getItems();
        assert.arrayIndex(transactions, index, 'Invalid position of transaction');

        const item = transactions[index];

        const expected = TransactionView.getInitialState({
            action: 'update',
            id: item.id,
        });

        await App.view.goToUpdateTransaction(pos);

        return App.view.checkState(expected);
    });
};

export const updateFromMainView = async (pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');

    await test(`Initial state of update transaction [${index}] view`, async () => {
        await App.goToMainView();

        const transactions = App.view.transactionsWidget.transList.getItems();
        assert.arrayIndex(transactions, index, 'Invalid position of transaction');

        const item = transactions[index];

        const expected = TransactionView.getInitialState({
            action: 'update',
            id: item.id,
        });

        await App.view.goToUpdateTransactionByIndex(pos);

        return App.view.checkState(expected);
    });
};

export const duplicate = async (type, pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');
    const typeStr = Transaction.typeToString(type, App.config.logsLocale);

    await test(`Initial state of duplicate ${typeStr} view [${index}]`, async () => {
        await App.view.navigateToTransactions();
        await App.view.filterByType(type);

        const transactions = App.view.getItems();
        assert.arrayIndex(transactions, index, 'Invalid position of transaction');

        const item = transactions[index];
        const expected = TransactionView.getInitialState({
            from: item.id,
        });

        await App.view.goToDuplicateTransaction(pos);

        return App.view.checkState(expected);
    });
};

export const duplicateFromMainView = async (pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of transaction not specified');

    await test(`Initial state of duplicate transaction [${index}] view`, async () => {
        await App.goToMainView();

        const transactions = App.view.transactionsWidget.transList.getItems();
        assert.arrayIndex(transactions, index, 'Invalid position of transaction');

        const item = transactions[index];
        const expected = TransactionView.getInitialState({
            from: item.id,
        });

        await App.view.goToDuplicateTransactionByIndex(pos);

        return App.view.checkState(expected);
    });
};

export const createFromAccountAndSubmit = async (pos, actions) => {
    setBlock(`Create transaction from account [${pos}]`, 2);

    await createFromAccount(pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const createFromPersonAndSubmit = async (pos, actions) => {
    setBlock(`Create transaction from person [${pos}]`, 2);

    await createFromPerson(pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const updateAndSubmit = async (type, pos, actions) => {
    const typeStr = Transaction.typeToString(type, App.config.logsLocale);
    setBlock(`Update ${typeStr} [${pos}]`, 2);

    await update(type, pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const updateFromMainViewAndSubmit = async (pos, actions) => {
    setBlock(`Update transaction [${pos}] from main view`, 2);

    await updateFromMainView(pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const duplicateAndSubmit = async (type, pos, actions) => {
    setBlock(`Duplicate transaction [${pos}] from main view`, 2);

    await duplicate(type, pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const duplicateFromMainViewAndSubmit = async (pos, actions) => {
    setBlock(`Update transaction [${pos}] from main view`, 2);

    await duplicateFromMainView(pos);
    await App.scenario.runner.runTasks(actions);
    await submit();
};

export const deleteFromContextMenu = async (index) => {
    const onPage = App.config.transactionsOnPage;

    await test(`Delete transaction from context menu [${index}]`, async () => {
        await App.view.navigateToTransactions();

        await App.view.deleteFromContextMenu(index);

        const id = App.state.transactions.indexesToIds(index);
        App.state.deleteTransactions({ id });

        App.view.model.data = App.state.transactions.clone();

        const expectedItems = App.view.model.data.getPage(1, onPage, 1, true);
        const showDate = !App.state.getGroupByDate();
        const expected = {
            transList: TransactionList.render(expectedItems, App.state, showDate),
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

    let tr = structuredClone(transactions);
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
        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);
        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (type, pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Position of transaction not specified');
    const typeStr = Transaction.typeToString(type, App.config.logsLocale);

    setBlock(`Delete ${typeStr} from update view [${ind}]`, 2);

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
        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);
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

        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);

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
        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);
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
            notification: { success: false, message: __('transactions.errors.update') },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Check navigation to create transaction with person account */
export const createFromPersonAccount = async ({ type, accountId }) => {
    const typeString = Transaction.typeToString(type, App.config.logsLocale);
    await test(`Create ${typeString} transaction from person account`, async () => {
        const account = App.state.accounts.getItem(accountId);
        assert(account, `Account ${accountId} not found`);
        assert(account.owner_id !== App.owner_id, 'Account of person is expected');

        const requestType = Transaction.getTypeName(type);
        const requestURL = `${baseUrl()}transactions/create/?acc_id=${accountId}&type=${requestType}`;
        await goTo(requestURL);
        assert.instanceOf(App.view, MainView, 'Invalid view');

        App.view.expectedState = {
            notification: { success: false, message: __('transactions.errors.create') },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Navigate to create transaction view and check form availability according to current state */
export const checkTransactionAvailable = async (type, directNavigate = false) => {
    const typeStr = Transaction.typeToString(type, App.config.logsLocale);
    await test(`Availability of ${typeStr} transaction`, async () => {
        if (!directNavigate) {
            await App.view.navigateToTransactions();
            await App.view.goToCreateTransaction();
            assert.instanceOf(App.view, TransactionView, 'Invalid view');

            if (type === LIMIT_CHANGE) {
                const { srcAccount, destAccount } = App.view.formModel;
                const isCreditCard = (
                    (srcAccount?.type === ACCOUNT_TYPE_CREDIT_CARD)
                    || (destAccount?.type === ACCOUNT_TYPE_CREDIT_CARD)
                );

                if (!isCreditCard) {
                    return true;
                }
            }

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
        } else if (type === LIMIT_CHANGE) {
            stateId = 0;
        }

        App.view.formModel.state = stateId;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};

export const checkDebtNoAccountURL = async () => {
    await test('Debt no account URL', async () => {
        const requestURL = `${baseUrl()}transactions/create/?type=debt&acc_id=0`;
        await goTo(requestURL);

        App.view.formModel.state = (App.state.persons.length > 0) ? 6 : -1;
        const expected = App.view.getExpectedState();
        return App.view.checkState(expected);
    });
};
