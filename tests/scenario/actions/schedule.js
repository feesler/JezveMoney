import {
    test,
    assert,
    setBlock,
    baseUrl,
    goTo,
    asArray,
    formatDate,
} from 'jezve-test';
import { ScheduleView } from '../../view/ScheduleView.js';
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
import { ScheduledTransaction } from '../../model/ScheduledTransaction.js';
import { ScheduleItemView } from '../../view/ScheduleItemView.js';

/** Navigate to schedule page */
const checkNavigation = async () => {
    if (App.view instanceof ScheduleView) {
        return;
    }

    await App.view.navigateToSchedule();
};

export const runAction = async ({ action, data }) => {
    let testDescr = null;

    assert.instanceOf(App.view, ScheduleItemView, 'Invalid view');

    assert(App.view.isActionAvailable(action), 'Invalid action specified');

    if (action === 'inputStartDate') {
        testDescr = `Input schedule start date '${data}'`;
    }

    if (action === 'selectStartDate') {
        testDescr = `Select schedule start date '${formatDate(data, { locales: App.view.locale })}'`;
    }

    if (action === 'inputEndDate') {
        testDescr = `Input schedule end date '${data}'`;
    }

    if (action === 'selectEndDate') {
        testDescr = `Select schedule end date '${formatDate(data, { locales: App.view.locale })}'`;
    }

    if (action === 'clearEndDate') {
        testDescr = 'Clear schedule end date';
    }

    if (action === 'toggleEnableRepeat') {
        const { repeatEnabled } = App.view.formModel;

        testDescr = (repeatEnabled)
            ? 'Disable transaction repeat'
            : 'Enable transaction repeat';
    }

    if (action === 'changeIntervalType') {
        const intervalType = parseInt(data, 10);
        const type = ScheduledTransaction.intervalTypes[intervalType];
        assert(type, `Invalid interval type: ${data}`);

        testDescr = `Change schedule interval to '${type}'`;
    }

    if (action === 'inputIntervalStep') {
        testDescr = `Input schedule interval step '${data}'`;
    }

    if (action === 'selectWeekDayOffset') {
        testDescr = `Select schedule interval week day offset '${data}'`;
    }

    if (action === 'selectWeekdaysOffset') {
        testDescr = 'Select weekdays as schedule interval offset';
    }

    if (action === 'selectWeekendOffset') {
        testDescr = 'Select weekend as schedule interval offset';
    }

    if (action === 'selectMonthDayOffset') {
        testDescr = `Select schedule interval month day offset '${data}'`;
    }

    if (action === 'selectMonthOffset') {
        testDescr = `Select schedule interval month offset '${data}'`;
    }

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
        testDescr = App.view.formModel.noAccount ? 'Enable account' : 'Disable account';
    }

    if (action === 'changeAccount') {
        if (data === null) {
            if (!App.view.formModel.noAccount) {
                await test('Disable account', () => App.view.toggleAccount());
                return;
            }
        } else {
            if (App.view.formModel.noAccount) {
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
        testDescr = `Select date '${formatDate(data, { locales: App.view.locale })}'`;
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

export const create = async () => {
    await test('Initial state of create scheduled transaction view', async () => {
        await checkNavigation();

        const expected = ScheduleItemView.getInitialState();

        await App.view.goToCreateNewItem();

        return App.view.checkState(expected);
    });
};

export const submit = async () => {
    await test('Submit scheduled transaction', async () => {
        assert.instanceOf(App.view, ScheduleItemView, 'Invalid view');

        const validInput = App.view.isValid();
        const expectedItem = (validInput) ? App.view.getExpectedScheduledTransaction() : null;

        await App.view.submit();

        if (validInput) {
            assert(!(App.view instanceof ScheduleItemView), 'Fail to submit scheduled transaction');
        }

        if (expectedItem) {
            if (expectedItem.id) {
                App.state.updateScheduledTransaction(expectedItem);
            } else {
                App.state.createScheduledTransaction(expectedItem);
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

export const update = async (pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index) && index >= 0, 'Position of item not specified');

    await test(`Initial state of update scheduled transaction view [${index}]`, async () => {
        await checkNavigation();

        const id = App.state.schedule.indexesToIds(index);
        const expected = ScheduleItemView.getInitialState({
            action: 'update',
            id,
        });

        await App.view.goToUpdateItem(pos);

        return App.view.checkState(expected);
    });
};

export const createAndSubmit = async (...args) => {
    const descr = (args.length > 1) ? args[0] : 'Create scheduled transaction';
    setBlock(descr, 2);

    const actions = (args.length > 1) ? args[1] : args[0];

    await create();
    await runActions(actions);
    await submit();
};

export const updateAndSubmit = async (pos, actions) => {
    setBlock(`Update scheduled transaction [${pos}]`, 2);

    await update(pos);
    await runActions(actions);
    await submit();
};

export const finishFromContextMenu = async (index) => {
    await test(`Finish scheduled transaction from context menu [${index}]`, async () => {
        await checkNavigation();
        await App.view.finishFromContextMenu(index);

        const id = App.state.schedule.indexesToIds(index);
        App.state.finishScheduledTransaction({ id });
        App.view.loadScheduleItems();

        const expected = App.view.getExpectedState();
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const finish = async (index) => {
    const indexes = asArray(index);

    await test(`Finish scheduled transaction [${indexes.join()}]`, async () => {
        await checkNavigation();

        await App.view.finishItems(index);

        const id = App.state.schedule.indexesToIds(index);
        App.state.finishScheduledTransaction({ id });
        App.view.loadScheduleItems();

        const expected = App.view.getExpectedState();
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const deleteFromContextMenu = async (index) => {
    await test(`Delete scheduled transaction from context menu [${index}]`, async () => {
        await checkNavigation();
        await App.view.deleteFromContextMenu(index);

        const id = App.state.schedule.indexesToIds(index);
        App.state.deleteScheduledTransaction({ id });
        App.view.loadScheduleItems();

        const expected = {
            scheduleList: App.view.getExpectedList(),
        };
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const del = async (index) => {
    const indexes = asArray(index);
    setBlock(`Delete scheduled transactions [${indexes.join()}]`, 3);

    await App.goToMainView();

    const expectedState = App.state.clone();
    const id = expectedState.schedule.indexesToIds(indexes);
    expectedState.deleteScheduledTransaction({ id });

    await checkNavigation();

    let tr = structuredClone(indexes);
    const onPage = App.config.transactionsOnPage;

    while (true) {
        const pageNum = App.view.currentPage();

        const absTrOnCurrentPage = tr.filter(
            (ind) => (ind >= onPage * (pageNum - 1) && ind < onPage * pageNum),
        );

        if (absTrOnCurrentPage.length) {
            const trOnCurrentPage = absTrOnCurrentPage.map((ind) => (ind - (pageNum - 1) * onPage));

            // Request view to select and delete transactions
            await App.view.deleteItems(trOnCurrentPage);

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

export const delFromUpdate = async (pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Position of transaction not specified');

    setBlock(`Delete scheduled transaction from update view [${ind}]`, 2);

    const expectedState = App.state.clone();
    const id = expectedState.schedule.indexesToIds(ind);
    expectedState.deleteScheduledTransaction({ id });

    await checkNavigation();

    await App.view.goToUpdateItem(ind);
    await App.view.deleteSelfItem();

    await test('Submit result', async () => {
        await App.goToMainView();
        App.state.setState(expectedState);
        const mainExpected = MainView.getInitialState();
        App.view.checkState(mainExpected);
        return App.state.fetchAndTest();
    });
};

/** Check navigation to update not existing scheduled transaction */
export const securityTests = async () => {
    setBlock('Scheduled transaction security', 2);

    let itemId;

    do {
        itemId = generateId();
    } while (App.state.schedule.getItem(itemId) != null);

    const requestURL = `${baseUrl()}schedule/update/${itemId}`;

    await test('Access to not existing scheduled transaction', async () => {
        await goTo(requestURL);
        assert.instanceOf(App.view, ScheduleView, 'Invalid view');

        App.view.expectedState = {
            notification: {
                success: false,
                message: __('schedule.errors.update', App.view.locale),
            },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};

/** Navigate to create transaction view and check form availability according to current state */
export const checkTransactionAvailable = async (type, directNavigate = false) => {
    await test(`${Transaction.typeToString(type)} scheduled transaction availability`, async () => {
        if (!directNavigate) {
            await checkNavigation();
            await App.view.goToCreateNewItem();
            assert.instanceOf(App.view, ScheduleItemView, 'Invalid view');

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

        const requestURL = `${baseUrl()}schedule/create/?type=${type}`;
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

export const toggleSelect = async (transactions) => {
    const itemIds = asArray(transactions);

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
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
            const res = structuredClone(item);
            if (indexes.includes(ind)) {
                res.selected = !res.selected;
            }

            return res;
        });

        await App.view.selectItems(indexes);
        let items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectItems(indexes);
        items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        return true;
    });
};

export const showDetails = async ({ index, directNavigate = false }) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of transaction not specified');

    await test(`Show details of transaction [${index}]`, async () => {
        await checkNavigation();
        return App.view.showDetails(index, directNavigate);
    });
};

export const closeDetails = async ({ directNavigate = false } = {}) => {
    await test('Close transaction details', async () => {
        await checkNavigation();
        return App.view.closeDetails(directNavigate);
    });
};

/** Clicks by mode selector button */
export const toggleMode = async () => {
    await test('Toggle details/classic mode', async () => {
        await checkNavigation();
        return App.view.toggleMode();
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

export const selectAll = async () => {
    await test('Select all transactions', async () => {
        await checkNavigation();
        return App.view.selectAll();
    });
};

export const deselectAll = async () => {
    await test('Deselect all transactions', async () => {
        await checkNavigation();
        return App.view.deselectAll();
    });
};

export const goToFirstPage = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to first page', () => App.view.goToFirstPage(directNavigate));
};

export const goToLastPage = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to last page', () => App.view.goToLastPage(directNavigate));
};

export const goToPrevPage = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to previous page', () => App.view.goToPrevPage(directNavigate));
};

export const goToNextPage = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to next page', () => App.view.goToNextPage(directNavigate));
};

export const showMore = async () => {
    await checkNavigation();

    await test('Show more items', () => App.view.showMore());
};
