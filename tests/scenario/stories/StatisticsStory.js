import { setBlock, TestStory } from 'jezve-test';
import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
    Transaction,
} from '../../model/Transaction.js';
import * as StatisticsTests from '../../run/statistics.js';

export class StatisticsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Statistics', 1);

        const {
            ACC_3,
            ACC_RUB,
            ACC_EUR,
            ACC_USD,
        } = App.scenario;

        await App.view.navigateToStatistics();

        await StatisticsTests.checkInitialState();
        // Income transactions filter
        await StatisticsTests.filterByType(INCOME);
        await StatisticsTests.filterByType(TRANSFER);
        await StatisticsTests.filterByType(DEBT);
        // Filter by accounts
        await StatisticsTests.filterByType(EXPENSE);
        await StatisticsTests.filterByAccounts(ACC_EUR);
        await StatisticsTests.filterByAccounts([ACC_3, ACC_RUB]);
        await StatisticsTests.filterByAccounts(ACC_3);
        // Test grouping
        await StatisticsTests.filterByType(DEBT);
        await StatisticsTests.groupByDay();
        await StatisticsTests.groupByWeek();
        await StatisticsTests.groupByMonth();
        await StatisticsTests.groupByYear();
        await StatisticsTests.filterByAccounts(ACC_USD);
        await StatisticsTests.filterByType([EXPENSE, DEBT]);
        await StatisticsTests.groupByDay();
        await StatisticsTests.groupByWeek();
        await StatisticsTests.groupByMonth();
        await StatisticsTests.groupByYear();
        // Show report by currencies
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

        await this.availability();
    }

    async availability() {
        setBlock('Check initialization in case owner of first account is person', 2);

        await App.scenario.resetData({
            accounts: true,
            persons: true,
        });
        await App.scenario.createPersons();

        const { RUB, MARIA } = App.scenario;
        const transaction = {
            type: DEBT,
            op: 1,
            person_id: MARIA,
            src_amount: '1050',
            src_curr: RUB,
        };
        const extracted = Transaction.extract(transaction, App.state);
        await api.transaction.create(extracted);
        await App.state.fetch();

        await App.scenario.createAccounts();

        await App.goToMainView();
        await App.view.navigateToStatistics();

        await StatisticsTests.checkInitialState();
    }
}
