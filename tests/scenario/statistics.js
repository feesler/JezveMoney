import { setBlock } from 'jezve-test';
import { App } from '../Application.js';
import { api } from '../model/api.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../model/Transaction.js';
import * as StatisticsTests from '../run/statistics.js';

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

export const statisticsTests = {
    async run() {
        setBlock('Statistics', 1);

        await prepare();

        await App.view.navigateToStatistics();

        await StatisticsTests.checkInitialState();
        // Income transactions filter
        await StatisticsTests.filterByType(INCOME);
        await StatisticsTests.filterByType(TRANSFER);
        await StatisticsTests.filterByType(DEBT);
        // Filter by accounts
        await StatisticsTests.filterByType(EXPENSE);
        await StatisticsTests.selectAccountByPos(2);
        // Test grouping
        await StatisticsTests.filterByType(DEBT);
        await StatisticsTests.groupByDay();
        await StatisticsTests.groupByWeek();
        await StatisticsTests.groupByMonth();
        await StatisticsTests.groupByYear();
        // Filter by currencies
        await StatisticsTests.byCurrencies();
        // Change transaction type when currencies filter is selected
        await StatisticsTests.filterByType(EXPENSE);

        await StatisticsTests.selectDateRange({
            start: App.dates.yearAgo,
            end: App.dates.monthAgo,
        });
        await StatisticsTests.selectDateRange({
            start: App.dates.weekAgo,
            end: App.dates.now,
        });
        await StatisticsTests.clearDateRange();
    },
};
