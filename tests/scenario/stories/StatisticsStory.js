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
import * as Actions from '../actions/statistics.js';
import { testLocales } from '../actions/locale.js';
import { testDateLocales, testDecimalLocales } from '../actions/settings.js';

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

        await Actions.checkInitialState();

        await Actions.byAccounts();
        // Income transactions filter
        await Actions.filterByType(INCOME);
        await Actions.filterByType(TRANSFER);
        await Actions.filterByType(DEBT);
        // Filter by accounts
        await Actions.filterByType(EXPENSE);
        await Actions.filterByAccounts(ACC_EUR);
        await Actions.filterByAccounts([ACC_3, ACC_RUB]);
        await Actions.filterByAccounts(ACC_3);
        // Test grouping
        await Actions.filterByType(DEBT);
        await Actions.groupByDay();
        await Actions.groupByWeek();
        await Actions.groupByMonth();
        await Actions.groupByYear();
        await Actions.filterByAccounts(ACC_USD);
        await Actions.filterByType([EXPENSE, DEBT]);
        await Actions.groupByDay();
        await Actions.groupByWeek();
        await Actions.groupByMonth();
        await Actions.groupByYear();
        // Show report by currencies
        await Actions.byCurrencies();
        // Change transaction type when currencies filter is selected
        await Actions.filterByType(EXPENSE);

        await Actions.selectCurrency(USD);
        await Actions.selectCurrency(EUR);
        await Actions.selectCurrency(RUB);

        // Show report by categories
        await Actions.byCategories();
        await Actions.filterByCategories(FOOD_CATEGORY);
        await Actions.filterByCategories([FOOD_CATEGORY, BIKE_CATEGORY]);
        await Actions.filterByCategories(0);

        await Actions.selectStartDateFilter(App.dates.yearAgo);
        await Actions.clearStartDateFilter();
        await Actions.selectEndDateFilter(App.dates.monthAgo);
        await Actions.selectStartDateFilter(App.dates.yearAgo);

        await Actions.selectEndDateFilter(App.dates.now);
        await Actions.selectStartDateFilter(App.dates.weekAgo);

        await Actions.clearStartDateFilter();
        await Actions.clearEndDateFilter();

        await Actions.groupByDay();
        await Actions.selectWeekRangeFilter();
        await Actions.selectMonthRangeFilter();
        await Actions.selectHalfYearRangeFilter();

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

        await Actions.checkInitialState();
    }

    async locales() {
        setBlock('Statistics view locales', 1);

        await testLocales((locale) => this.checkLocale(locale));
        await testDateLocales(['es', 'ko'], (locale) => this.checkLocale(locale));
        await testDecimalLocales(['es', 'hi'], (locale) => this.checkLocale(locale));
    }

    async checkLocale(locale) {
        setBlock(`Locale: '${locale}'`, 1);

        await Actions.selectStartDateFilter(App.datesFmt.monthAgo);
        await Actions.clearStartDateFilter();
    }
}
