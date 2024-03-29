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
            setBlock('Transaction ListModel view: direct navigation', 1);
        } else {
            setBlock('Transaction ListModel view: manual navigation', 1);
        }

        await Actions.checkInitialState({ directNavigate });
        await Actions.goToNextPage({ directNavigate });
        await Actions.setDetailsMode({ directNavigate });
        await Actions.goToNextPage({ directNavigate });

        if (!directNavigate) {
            await this.manualTests();
        }

        await App.scenario.runner.runGroup(
            async (data) => {
                await Actions.filterByType(data);
                await Actions.iteratePages();
            },
            Transaction.availTypes.map((type) => ({ type, directNavigate })),
        );

        // Show all types
        await Actions.filterByType({ type: 0 });

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

        await Actions.filterByType({ type: 0, directNavigate });
        await Actions.filterByType({ type: EXPENSE, directNavigate });
        await Actions.filterByType({ type: [INCOME, DEBT], directNavigate });
        await Actions.filterByCategories({ categories: FOOD_CATEGORY, directNavigate });
        await Actions.filterByCategories({
            categories: [FOOD_CATEGORY, TRANSPORT_CATEGORY],
            directNavigate,
        });

        await Actions.selectEndDateFilter({ date: App.dates.yesterday, directNavigate });
        await Actions.selectStartDateFilter({ date: App.dates.weekAgo, directNavigate });
        await Actions.clearEndDateFilter();
        await Actions.clearStartDateFilter();
        await Actions.selectStartDateFilter({ date: App.dates.yearAgo, directNavigate });
        await Actions.selectEndDateFilter({ date: App.dates.monthAgo, directNavigate });

        await Actions.selectWeekRangeFilter({ directNavigate });
        await Actions.selectMonthRangeFilter({ directNavigate });
        await Actions.selectHalfYearRangeFilter({ directNavigate });

        await Actions.inputMinAmountFilter({ value: '100', directNavigate });
        await Actions.inputMaxAmountFilter({ value: '1000', directNavigate });
        await Actions.clearMinAmountFilter({ directNavigate });
        await Actions.clearMaxAmountFilter({ directNavigate });
        await Actions.inputMinAmountFilter({ value: '1000', directNavigate });
        await Actions.inputMaxAmountFilter({ value: '100', directNavigate });
        await Actions.clearMinAmountFilter({ directNavigate });
        await Actions.clearMaxAmountFilter({ directNavigate });

        await Actions.search({ text: '1', directNavigate });
        await Actions.search({ text: 'la', directNavigate });
        await Actions.search({ text: 'кк', directNavigate });
        await Actions.clearSearchForm({ directNavigate });
        await Actions.clearStartDateFilter({ directNavigate });
        await Actions.clearEndDateFilter({ directNavigate });
        await Actions.search({ text: '1', directNavigate });

        await Actions.selectStartDateFilter(
            { date: App.dates.yearAgo, directNavigate },
        );
        await Actions.selectEndDateFilter(
            { date: App.dates.monthAgo, directNavigate },
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

        await Actions.selectHalfYearRangeFilter();
        await Actions.setCategory({
            items: [0, 1],
            category: TAXES_CATEGORY,
        });

        await Actions.filterByType({ type: EXPENSE });
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
        await Actions.filterByType({ type: 0 });
    }

    async locales() {
        setBlock('Transaction list view locales', 1);

        const localeActions = () => this.checkLocale();

        await testLocales(localeActions);
        await testDateLocales(['es', 'ko'], localeActions);
        await testDecimalLocales(['es', 'hi'], localeActions);
    }

    async checkLocale() {
        await Actions.selectStartDateFilter({ date: App.dates.weekAgo });
        await Actions.clearStartDateFilter();
    }
}
