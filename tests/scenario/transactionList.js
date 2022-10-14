import { setBlock } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    DEBT,
    availTransTypes,
} from '../model/Transaction.js';
import * as TransactionListTests from '../run/transactionList.js';
import { App } from '../Application.js';
import { api } from '../model/api.js';

const prepare = async () => {
    await App.scenario.prepareTestUser();
    await api.profile.resetData({
        accounts: true,
        persons: true,
    });
    await App.state.fetch();
    await App.scenario.createTestData();

    await App.goToMainView();
};

const runTests = async (directNavigate = false) => {
    if (directNavigate) {
        setBlock('Transaction List view: direct navigation', 1);
    } else {
        setBlock('Transaction List view: manual navigation', 1);
    }

    await App.scenario.runner.runTasks([
        { action: TransactionListTests.checkInitialState, data: directNavigate },
        { action: TransactionListTests.goToNextPage, data: directNavigate },
        { action: TransactionListTests.setDetailsMode, data: directNavigate },
        { action: TransactionListTests.goToNextPage, data: directNavigate },
    ]);

    if (!directNavigate) {
        const toggleSelectData = [
            0,
            [1, 2],
        ];

        await App.scenario.runner.runGroup(TransactionListTests.toggleSelect, toggleSelectData);
    }

    await App.scenario.runner.runGroup(
        TransactionListTests.filterByType,
        availTransTypes.map((type) => ({ type, directNavigate })),
    );

    await App.scenario.runner.runTasks([{
        action: TransactionListTests.filterByAccounts,
        data: { accounts: App.scenario.ACC_3 },
    }, {
        action: TransactionListTests.filterByAccounts,
        data: { accounts: [App.scenario.ACC_3, App.scenario.ACC_USD], directNavigate },
    }, {
        action: TransactionListTests.filterByPersons,
        data: { persons: App.scenario.MARIA, directNavigate },
    }, {
        action: TransactionListTests.filterByType,
        data: { type: 0, directNavigate },
    }, {
        action: TransactionListTests.filterByType,
        data: { type: EXPENSE, directNavigate },
    }, {
        action: TransactionListTests.filterByType,
        data: { type: [INCOME, DEBT], directNavigate },
    }, {
        action: TransactionListTests.filterByDate,
        data: { start: App.dates.weekAgo, end: App.dates.now, directNavigate },
    },
    {
        action: TransactionListTests.filterByDate,
        data: { start: App.dates.yearAgo, end: App.dates.monthAgo, directNavigate },
    }]);

    const searchData = [
        { text: '1', directNavigate },
        { text: 'la', directNavigate },
        { text: 'кк', directNavigate },
    ];

    await App.scenario.runner.runGroup(TransactionListTests.search, searchData);

    await App.scenario.runner.runTasks([
        { action: TransactionListTests.clearSearchForm, data: directNavigate },
        { action: TransactionListTests.clearDateRange },
        { action: TransactionListTests.search, data: { text: '1', directNavigate } },
        {
            action: TransactionListTests.filterByDate,
            data: { start: App.dates.yearAgo, end: App.dates.monthAgo, directNavigate },
        },
        { action: TransactionListTests.clearAllFilters, directNavigate },
    ]);
};

export const transactionsListTests = {
    /** Run transactions list view tests */
    async run() {
        await prepare();

        await runTests(false);
        await runTests(true);
    },
};
