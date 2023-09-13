import { setBlock, TestStory } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    DEBT,
    Transaction,
} from '../../model/Transaction.js';
import * as Actions from '../actions/transactionList.js';
import { testLocales } from '../actions/locale.js';
import { App } from '../../Application.js';
import { testDateLocales, testDecimalLocales } from '../actions/settings.js';

export class TransactionListStory extends TestStory {
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
        await this.runTests(false);
        await this.runTests(true);
        await this.locales();
    }

    async runTests(directNavigate = false) {
        const { FOOD_CATEGORY, TRANSPORT_CATEGORY } = App.scenario;

        if (directNavigate) {
            setBlock('Transaction List view: direct navigation', 1);
        } else {
            setBlock('Transaction List view: manual navigation', 1);
        }

        await Actions.checkInitialState({ directNavigate });
        await Actions.goToNextPage({ directNavigate });
        await Actions.setDetailsMode({ directNavigate });
        await Actions.goToNextPage({ directNavigate });

        if (!directNavigate) {
            await this.manualTests();
        }

        await App.scenario.runner.runGroup(
            Actions.filterByType,
            Transaction.availTypes.map((type) => ({ type, directNavigate })),
        );

        // Show all types
        await Actions.filterByType({ type: 0, iteratePages: false });

        await Actions.filterByAccounts({ accounts: App.scenario.ACC_3 });
        await Actions.filterByAccounts({
            accounts: [App.scenario.ACC_3, App.scenario.ACC_USD], directNavigate,
        });
        await Actions.filterByPersons({
            persons: App.scenario.MARIA, directNavigate,
        });

        if (!directNavigate) {
            await Actions.exportTest();
        }

        await Actions.filterByType({ type: 0, directNavigate, iteratePages: false });
        await Actions.filterByType({ type: EXPENSE, directNavigate, iteratePages: false });
        await Actions.filterByType({ type: [INCOME, DEBT], directNavigate, iteratePages: false });
        await Actions.filterByCategories(
            { categories: FOOD_CATEGORY, directNavigate, iteratePages: false },
        );
        await Actions.filterByCategories({
            categories: [FOOD_CATEGORY, TRANSPORT_CATEGORY],
            directNavigate,
        });

        await Actions.selectEndDateFilter({ date: App.dates.yesterday, directNavigate });
        await Actions.selectStartDateFilter({ date: App.dates.weekAgo, directNavigate });
        await Actions.clearEndDateFilter();
        await Actions.clearStartDateFilter();
        await Actions.selectStartDateFilter(
            { date: App.dates.yearAgo, directNavigate, iteratePages: false },
        );
        await Actions.selectEndDateFilter(
            { date: App.dates.monthAgo, directNavigate, iteratePages: false },
        );

        await Actions.selectWeekRangeFilter({ directNavigate, iteratePages: false });
        await Actions.selectMonthRangeFilter({ directNavigate, iteratePages: false });
        await Actions.selectHalfYearRangeFilter({ directNavigate, iteratePages: false });

        await Actions.inputMinAmountFilter({ value: '100', directNavigate, iteratePages: false });
        await Actions.inputMaxAmountFilter({ value: '1000', directNavigate, iteratePages: false });
        await Actions.clearMinAmountFilter({ directNavigate, iteratePages: false });
        await Actions.clearMaxAmountFilter({ directNavigate, iteratePages: false });
        await Actions.inputMinAmountFilter({ value: '1000', directNavigate, iteratePages: false });
        await Actions.inputMaxAmountFilter({ value: '100', directNavigate, iteratePages: false });
        await Actions.clearMinAmountFilter({ directNavigate, iteratePages: false });
        await Actions.clearMaxAmountFilter({ directNavigate, iteratePages: false });

        await Actions.search({ text: '1', directNavigate });
        await Actions.search({ text: 'la', directNavigate });
        await Actions.search({ text: 'кк', directNavigate });
        await Actions.clearSearchForm({ directNavigate, iteratePages: false });
        await Actions.clearStartDateFilter({ directNavigate, iteratePages: false });
        await Actions.clearEndDateFilter({ directNavigate, iteratePages: false });
        await Actions.search({ text: '1', directNavigate, iteratePages: false });

        await Actions.selectStartDateFilter(
            { date: App.dates.yearAgo, directNavigate, iteratePages: false },
        );
        await Actions.selectEndDateFilter(
            { date: App.dates.monthAgo, directNavigate, iteratePages: false },
        );

        await Actions.clearAllFilters({ directNavigate });
    }

    async manualTests() {
        const { FOOD_CATEGORY, TAXES_CATEGORY } = App.scenario;

        await Actions.toggleGroupByDate();

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();

        await Actions.toggleSelect(0);
        await Actions.toggleSelect([1, 2]);

        await Actions.toggleGroupByDate();

        await Actions.toggleSelect(0);
        await Actions.toggleSelect([1, 2]);

        await Actions.selectAll();
        await Actions.deselectAll();
        await Actions.setListMode();
        await Actions.setSortMode();
        await Actions.setListMode();

        await Actions.goToFirstPage();
        await Actions.showMore();
        await Actions.showMore();
        await Actions.goToNextPage();
        await Actions.goToLastPage();
        await Actions.goToPrevPage();
        await Actions.showMore();

        await Actions.goToFirstPage();

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();

        await Actions.setCategory({
            items: [0, 1],
            category: TAXES_CATEGORY,
        });

        await Actions.filterByType({ type: EXPENSE, iteratePages: false });
        await Actions.setTransactionCategory({
            index: 1,
            category: FOOD_CATEGORY,
        });
        await Actions.setCategory({
            items: [3, 5],
            category: FOOD_CATEGORY,
        });
        await Actions.setCategory({
            items: [1, 2],
            category: 0,
        });
        // Show all types
        await Actions.filterByType({ type: 0, iteratePages: false });
    }

    async locales() {
        setBlock('Transaction list view locales', 1);

        await testLocales((locale) => this.checkLocale(locale));
        await testDateLocales(['es', 'ko'], (locale) => this.checkLocale(locale));
        await testDecimalLocales(['es', 'hi'], (locale) => this.checkLocale(locale));
    }

    async checkLocale(locale) {
        setBlock(`Locale: '${locale}'`, 1);

        await Actions.selectStartDateFilter({ date: App.dates.weekAgo, iteratePages: false });
        await Actions.clearStartDateFilter({ iteratePages: false });
    }
}
