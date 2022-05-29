import { copyObject } from 'jezvejs';
import { formatDate } from 'jezvejs/DateUtils';
import { test, assert } from 'jezve-test';
import { App } from '../Application.js';
import { fixDate } from '../common.js';
import { TransactionsView } from '../view/TransactionsView.js';
import { MainView } from '../view/MainView.js';
import { availTransTypes, Transaction } from '../model/Transaction.js';

/** Navigate to transactions list page */
async function checkNavigation() {
    if (App.view instanceof TransactionsView) {
        return;
    }

    if (!(App.view instanceof MainView)) {
        await App.goToMainView();
    }

    await App.view.goToTransactions();
}

export async function checkInitialState() {
    await checkNavigation();

    App.view.expectedState = App.view.setExpectedState();
    await test('Initial state of transaction list view', () => App.view.checkState());
}

export async function goToNextPage() {
    await checkNavigation();

    await test('Navigate to next page', () => App.view.goToNextPage());
}

export async function setDetailsMode() {
    await checkNavigation();

    await test('Change list mode to details', () => App.view.setDetailsMode());
}

export async function toggleSelect(transactions) {
    const itemIds = Array.isArray(transactions) ? transactions : [transactions];

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
            const res = copyObject(item);
            if (indexes.includes(ind)) {
                res.selected = !res.selected;
            }

            return res;
        });

        await App.view.selectTransactions(indexes);
        let items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectTransactions(indexes);
        items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        return true;
    });
}

export async function clearAllFilters() {
    await checkNavigation();

    await test('Clear all filters', async () => {
        await App.view.clearAllFilters();
        return App.view.iteratePages();
    });
}

export async function filterByType(type) {
    await checkNavigation();

    let types = Array.isArray(type) ? type : [type];
    types = types.filter((item) => availTransTypes.includes(item));

    const typeNames = types.map(Transaction.typeToString);

    const descr = (types.length)
        ? `Filter by [${typeNames.join()}]`
        : 'Show all types of transactions';
    await test(descr, async () => {
        await App.view.filterByType(type);
        return App.view.iteratePages();
    });
}

export async function filterByAccounts(accounts) {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    await checkNavigation();

    const accountNames = itemIds.map((accountId) => {
        const item = App.state.accounts.getItem(accountId);
        return (item) ? item.name : `(${accountId})`;
    });

    await test(`Filter by accounts [${accountNames.join()}]`, async () => {
        await App.view.filterByAccounts(itemIds);
        return App.view.iteratePages();
    });
}

export async function filterByDate({ start, end }) {
    await checkNavigation();

    const startDateFmt = formatDate(new Date(fixDate(start)));
    const endDateFmt = formatDate(new Date(fixDate(end)));

    await test(`Select date range (${startDateFmt} - ${endDateFmt})`, async () => {
        await App.view.selectDateRange(start, end);
        return App.view.iteratePages();
    });
}

export async function clearDateRange() {
    await checkNavigation();

    await test('Clear date range', async () => {
        await App.view.clearDateRange();
        return App.view.iteratePages();
    });
}

export async function search(text) {
    await checkNavigation();

    await test(`Search (${text})`, async () => {
        await App.view.search(text);
        return App.view.iteratePages();
    });
}

export async function clearSearchForm() {
    await checkNavigation();

    await test('Clear search form', async () => {
        await App.view.clearSearch();
        return App.view.iteratePages();
    });
}
