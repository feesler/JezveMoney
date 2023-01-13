import {
    test,
    assert,
    baseUrl,
    goTo,
    copyObject,
    formatDate,
    asArray,
} from 'jezve-test';
import { App } from '../Application.js';
import { fixDate } from '../common.js';
import { TransactionListView } from '../view/TransactionListView.js';
import { availTransTypes, Transaction } from '../model/Transaction.js';
import { TransactionList } from '../view/component/TransactionList/TransactionList.js';

/** Navigate to transactions list page */
const checkNavigation = async () => {
    if (App.view instanceof TransactionListView) {
        return;
    }

    await App.view.navigateToTransactions();
};

export const checkInitialState = async (directNavigate = false) => {
    if (directNavigate) {
        const requestURL = `${baseUrl()}transactions/`;

        await goTo(requestURL);
    } else {
        await checkNavigation();
    }

    App.view.expectedState = App.view.getExpectedState();
    await test('Initial state of transaction list view', () => App.view.checkState());
};

export const goToFirstPage = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to first page', () => App.view.goToFirstPage(directNavigate));
};

export const goToLastPage = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to last page', () => App.view.goToLastPage(directNavigate));
};

export const goToPrevPage = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to previous page', () => App.view.goToPrevPage(directNavigate));
};

export const goToNextPage = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Navigate to next page', () => App.view.goToNextPage(directNavigate));
};

export const showMore = async () => {
    await checkNavigation();

    await test('Show more transactions', () => App.view.showMore());
};

export const setDetailsMode = async (directNavigate = false) => {
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

        await App.view.setTransactionCategory(index, category);

        App.state.setTransactionCategory({ id, category });
        const expectedItems = App.state.transactions.getItems(pageIds);
        const expected = {
            transList: {
                items: TransactionList.render(expectedItems, App.state),
            },
        };
        App.view.checkState(expected);

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

        await App.view.setCategory(items, category);

        App.state.setTransactionCategory({
            id: ids,
            category,
        });
        const expectedItems = App.state.transactions.getItems(pageIds);
        const expected = {
            transList: {
                items: TransactionList.render(expectedItems, App.state),
            },
        };
        App.view.checkState(expected);

        return App.state.fetchAndTest();
    });
};

export const clearAllFilters = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear all filters', async () => {
        await App.view.clearAllFilters(directNavigate);
        return App.view.iteratePages();
    });
};

export const filterByType = async ({ type, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    let types = Array.isArray(type) ? type : [type];
    types = types.filter((item) => availTransTypes.includes(item));

    const typeNames = types.map(Transaction.typeToString);

    const descr = (types.length)
        ? `Filter by [${typeNames.join()}]`
        : 'Show all types of transactions';
    await test(descr, async () => {
        await App.view.filterByType(type, directNavigate);
        return App.view.iteratePages();
    });
};

export const filterByAccounts = async ({ accounts, directNavigate = false }) => {
    const itemIds = Array.isArray(accounts) ? accounts : [accounts];

    if (!directNavigate) {
        await checkNavigation();
    }

    const accountNames = itemIds.map((accountId) => {
        const item = App.state.accounts.getItem(accountId);
        return (item) ? item.name : `(${accountId})`;
    });

    await test(`Filter by accounts [${accountNames.join()}]`, async () => {
        await App.view.filterByAccounts(itemIds, directNavigate);
        return App.view.iteratePages();
    });
};

export const filterByPersons = async ({ persons, directNavigate = false }) => {
    const itemIds = asArray(persons);

    if (!directNavigate) {
        await checkNavigation();
    }

    const personsNames = itemIds.map((personId) => {
        const item = App.state.persons.getItem(personId);
        return (item) ? item.name : `(${personId})`;
    });

    await test(`Filter by persons [${personsNames.join()}]`, async () => {
        await App.view.filterByPersons(itemIds, directNavigate);
        return App.view.iteratePages();
    });
};

export const filterByCategories = async ({ categories, directNavigate = false }) => {
    const itemIds = asArray(categories);

    if (!directNavigate) {
        await checkNavigation();
    }

    const names = itemIds.map((id) => {
        const item = App.state.categories.getItem(id);
        return (item) ? item.name : `(${id})`;
    });

    await test(`Filter by categories [${names.join()}]`, async () => {
        await App.view.filterByCategories(itemIds, directNavigate);
        return App.view.iteratePages();
    });
};

export const filterByDate = async ({ start, end, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    const startDateFmt = formatDate(new Date(fixDate(start)));
    const endDateFmt = formatDate(new Date(fixDate(end)));

    await test(`Select date range (${startDateFmt} - ${endDateFmt})`, async () => {
        await App.view.selectDateRange(start, end, directNavigate);
        return App.view.iteratePages();
    });
};

export const clearDateRange = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear date range', async () => {
        await App.view.clearDateRange(directNavigate);
        return App.view.iteratePages();
    });
};

export const search = async ({ text, directNavigate = false }) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test(`Search (${text})`, async () => {
        await App.view.search(text, directNavigate);
        return App.view.iteratePages();
    });
};

export const clearSearchForm = async (directNavigate = false) => {
    if (!directNavigate) {
        await checkNavigation();
    }

    await test('Clear search form', async () => {
        await App.view.clearSearch(directNavigate);
        return App.view.iteratePages();
    });
};
