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
import * as StatisticsTests from '../../actions/statistics.js';
import { testLocales } from '../../actions/locale.js';
import { testDateLocales } from '../../actions/settings.js';

export class StatisticsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Statistics', 1);

        const {
            RUB,
            USD,
            EUR,
            ACC_3,
            ACC_RUB,
            ACC_EUR,
            ACC_USD,
            FOOD_CATEGORY,
            BIKE_CATEGORY,
        } = App.scenario;

        await App.view.navigateToStatistics();

        await StatisticsTests.checkInitialState();

        await StatisticsTests.byAccounts();
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

        await StatisticsTests.selectCurrency(USD);
        await StatisticsTests.selectCurrency(EUR);
        await StatisticsTests.selectCurrency(RUB);

        // Show report by categories
        await StatisticsTests.byCategories();
        await StatisticsTests.filterByCategories(FOOD_CATEGORY);
        await StatisticsTests.filterByCategories([FOOD_CATEGORY, BIKE_CATEGORY]);
        await StatisticsTests.filterByCategories(0);

        await StatisticsTests.selectDateRange({
            start: App.datesFmt.yearAgo,
            end: App.datesFmt.monthAgo,
        });
        await StatisticsTests.selectDateRange({
            start: App.datesFmt.weekAgo,
            end: App.datesFmt.now,
        });
        await StatisticsTests.clearDateRange();

        await this.locales();

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

    async locales() {
        setBlock('Statistics view locales', 1);

        await testLocales((locale) => this.checkLocale(locale));
        await testDateLocales(['es', 'ko'], (locale) => this.checkLocale(locale));
    }

    async checkLocale(locale) {
        setBlock(`Locale: '${locale}'`, 1);

        await StatisticsTests.selectDateRange({
            start: App.datesFmt.yearAgo,
            end: App.datesFmt.monthAgo,
        });
        await StatisticsTests.selectDateRange({
            start: App.datesFmt.weekAgo,
            end: App.datesFmt.now,
        });
        await StatisticsTests.clearDateRange();
    }
}
