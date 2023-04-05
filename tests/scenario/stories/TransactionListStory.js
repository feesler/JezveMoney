import { setBlock, TestStory } from 'jezve-test';
import {
    EXPENSE,
    INCOME,
    DEBT,
    availTransTypes,
} from '../../model/Transaction.js';
import * as Actions from '../../run/transactionList.js';
import { App } from '../../Application.js';

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
    }

    async runTests(directNavigate = false) {
        const { FOOD_CATEGORY, TRANSPORT_CATEGORY } = App.scenario;

        if (directNavigate) {
            setBlock('Transaction List view: direct navigation', 1);
        } else {
            setBlock('Transaction List view: manual navigation', 1);
        }

        await Actions.checkInitialState(directNavigate);
        await Actions.goToNextPage(directNavigate);
        await Actions.setDetailsMode(directNavigate);
        await Actions.goToNextPage(directNavigate);

        if (!directNavigate) {
            await this.manualTests();
        }

        await App.scenario.runner.runGroup(
            Actions.filterByType,
            availTransTypes.map((type) => ({ type, directNavigate })),
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

        await Actions.filterByType({ type: 0, directNavigate });
        await Actions.filterByType({ type: EXPENSE, directNavigate });
        await Actions.filterByType({ type: [INCOME, DEBT], directNavigate });
        await Actions.filterByCategories({ categories: FOOD_CATEGORY, directNavigate });
        await Actions.filterByCategories({
            categories: [FOOD_CATEGORY, TRANSPORT_CATEGORY],
            directNavigate,
        });

        await Actions.filterByDate({
            start: App.datesFmt.weekAgo, end: App.datesFmt.now, directNavigate,
        });
        await Actions.filterByDate({
            start: App.datesFmt.yearAgo, end: App.datesFmt.monthAgo, directNavigate,
        });

        await Actions.search({ text: '1', directNavigate });
        await Actions.search({ text: 'la', directNavigate });
        await Actions.search({ text: 'кк', directNavigate });
        await Actions.clearSearchForm(directNavigate);
        await Actions.clearDateRange(directNavigate);
        await Actions.search({ text: '1', directNavigate });

        await Actions.filterByDate({
            start: App.datesFmt.yearAgo, end: App.datesFmt.monthAgo, directNavigate,
        });
        await Actions.clearAllFilters(directNavigate);
    }

    async manualTests() {
        const { FOOD_CATEGORY, TAXES_CATEGORY } = App.scenario;

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
}
