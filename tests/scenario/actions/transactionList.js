import { assert } from '@jezvejs/assert';
import { asArray } from '@jezvejs/types';
import {
    test,
    baseUrl,
    goTo,
} from 'jezve-test';
import { App } from '../../Application.js';
import { TransactionListView } from '../../view/TransactionListView.js';
import { Transaction } from '../../model/Transaction.js';
import { TransactionList } from '../../view/component/TransactionList/TransactionList.js';
import { TransactionListModel } from '../../model/TransactionListModel.js';

/** Navigate to transactions list page */
const checkNavigation = async () => {
    if (App.view instanceof TransactionListView) {
        return;
    }

    await App.view.navigateToTransactions();
};

export const checkInitialState = async ({ directNavigate = false } = {}) => {
    if (directNavigate) {
        const requestURL = `${baseUrl()}transactions/`;

        await goTo(requestURL);
    } else {
        await checkNavigation();
    }

    App.view.expectedState = App.view.getExpectedState();
    await test('Initial state of transaction list view', () => App.view.checkState());
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

    await test('Show more transactions', () => App.view.showMore());
};

export const setClassicMode = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Change list mode to classic', () => App.view.setClassicMode(directNavigate));
};

export const setDetailsMode = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Change list mode to details', () => App.view.setDetailsMode(directNavigate));
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
};

export const showDetails = async ({ index, directNavigate = false }) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of transaction not specified');

    if (!directNavigate) {
        await checkNavigation();
    }

    await test(`Show details of transaction [${index}]`, () => (
        App.view.showDetails(index, directNavigate)
    ));
};

export const closeDetails = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Close transaction details', () => (
        App.view.closeDetails(directNavigate)
    ));
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

/** Set sort mode */
export const setSortMode = async () => {
    await test('Set sort mode', async () => {
        await checkNavigation();
        return App.view.setSortMode();
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

export const setTransactionCategory = async ({ index, category }) => {
    await test('Set transaction category from context menu', async () => {
        await checkNavigation();

        const origItems = App.view.getItems();
        const pageIds = origItems.map((item) => item.id);

        const ind = parseInt(index, 10);
        assert.arrayIndex(origItems, ind);
        const { id } = origItems[ind];

        const options = TransactionList.getRenderOptions(App.view.model, App.state);

        await App.view.setTransactionCategory(index, category);

        App.state.setTransactionCategory({ id, category });
        const expectedItems = App.state.transactions.getItems(pageIds);
        const expected = {
            transList: TransactionList.render(expectedItems, App.state, options),
        };
        App.view.checkState(expected);
        App.view.updateTransactions();

        return App.state.fetchAndTest();
    });
};

export const setCategory = async ({ items, category }) => {
    const indexes = asArray(items);

    await test('Set transactions category', async () => {
        await checkNavigation();

        const origItems = App.view.getItems();

        const pageIds = origItems.map((item) => item.id);
        const ids = indexes.map((ind) => {
            assert.arrayIndex(origItems, ind);
            return origItems[ind].id;
        });

        const options = TransactionList.getRenderOptions(App.view.model, App.state);

        await App.view.setCategory(items, category);

        App.state.setTransactionCategory({
            id: ids,
            category,
        });
        const expectedItems = App.state.transactions.getItems(pageIds);
        const expected = {
            transList: TransactionList.render(expectedItems, App.state, options),
        };
        App.view.checkState(expected);
        App.view.updateTransactions();

        return App.state.fetchAndTest();
    });
};

export const iteratePages = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    return test('Iterate all pages', () => (
        App.view.iteratePages()
    ));
};

export const clearAllFilters = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear all filters', () => (
        App.view.clearAllFilters(directNavigate)
    ));
};

export const filterByType = async ({ type, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const types = asArray(type).filter((item) => Transaction.availTypes.includes(item));
    const names = types.map((item) => Transaction.typeToString(item, App.config.logsLocale));

    const descr = (types.length)
        ? `Filter by [${names.join()}]`
        : 'Show all types of transactions';
    await test(descr, () => App.view.filterByType(type, directNavigate));
};

export const filterByAccounts = async ({
    accounts,
    directNavigate = false,
}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const itemIds = asArray(accounts);
    const names = itemIds.map((accountId) => {
        const item = App.state.accounts.getItem(accountId);
        return (item) ? item.name : `(${accountId})`;
    });

    await test(`Filter by accounts [${names.join()}]`, () => (
        App.view.filterByAccounts(itemIds, directNavigate)
    ));
};

export const filterByPersons = async ({
    persons,
    directNavigate = false,
}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const itemIds = asArray(persons);
    const names = itemIds.map((personId) => {
        const item = App.state.persons.getItem(personId);
        return (item) ? item.name : `(${personId})`;
    });

    await test(`Filter by persons [${names.join()}]`, () => (
        App.view.filterByPersons(itemIds, directNavigate)
    ));
};

export const filterByCategories = async ({ categories, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const itemIds = asArray(categories);
    const names = itemIds.map((id) => {
        if (parseInt(id, 10) === 0) {
            return 'No category';
        }

        const item = App.state.categories.getItem(id);
        return (item) ? item.name : `(${id})`;
    });

    await test(`Filter by categories [${names.join()}]`, () => (
        App.view.filterByCategories(itemIds, directNavigate)
    ));
};

export const selectWeekRangeFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Show week date range', () => (
        App.view.selectWeekRangeFilter(directNavigate)
    ));
};

export const selectMonthRangeFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Show month date range', () => (
        App.view.selectMonthRangeFilter(directNavigate)
    ));
};

export const selectHalfYearRangeFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Show half a year date range', () => (
        App.view.selectHalfYearRangeFilter(directNavigate)
    ));
};

export const selectStartDateFilter = async ({ date, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const dateFmt = App.reformatDate(date);

    await test(`Select start date (${dateFmt})`, () => (
        App.view.selectStartDateFilter(date, directNavigate)
    ));
};

export const selectEndDateFilter = async ({ date, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const dateFmt = App.reformatDate(date);

    await test(`Select end date (${dateFmt})`, () => (
        App.view.selectEndDateFilter(date, directNavigate)
    ));
};

export const clearStartDateFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear start date', () => (
        App.view.clearStartDateFilter(directNavigate)
    ));
};

export const clearEndDateFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear end date', () => (
        App.view.clearEndDateFilter(directNavigate)
    ));
};

export const inputMinAmountFilter = async ({ value, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test(`Input min. amount filter '${value}'`, () => (
        App.view.inputMinAmountFilter(value, directNavigate)
    ));
};

export const inputMaxAmountFilter = async ({ value, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test(`Input max. amount filter '${value}'`, () => (
        App.view.inputMaxAmountFilter(value, directNavigate)
    ));
};

export const clearMinAmountFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear min amount', () => (
        App.view.clearMinAmountFilter(directNavigate)
    ));
};

export const clearMaxAmountFilter = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear max amount', () => (
        App.view.clearMaxAmountFilter(directNavigate)
    ));
};

export const search = async ({ text, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test(`Search (${text})`, () => (
        App.view.search(text, directNavigate)
    ));
};

export const clearSearchForm = async ({ directNavigate = false } = {}) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear search form', () => (
        App.view.clearSearch(directNavigate)
    ));
};

export const toggleGroupByDate = async () => {
    await checkNavigation();

    await test('Toggle enable group transactions by date', () => (
        App.view.toggleGroupByDate()
    ));
};

export const exportTest = async () => {
    await test('Export transactions', async () => {
        await checkNavigation();

        let transactions = App.state.transactions.applyFilter(App.view.model.filter);
        transactions = TransactionListModel.create(transactions);
        const expectedContent = transactions.exportToCSV();

        const content = await App.view.exportTransactions();

        return assert.deepMeet(content.trim(), expectedContent.trim());
    });
};
