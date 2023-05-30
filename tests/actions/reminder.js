import {
    test,
    assert,
    copyObject,
    asArray,
} from 'jezve-test';
import { ReminderListView } from '../view/ReminderListView.js';
import { App } from '../Application.js';
import { TransactionView } from '../view/TransactionView.js';

/** Navigate to reminders page */
const checkNavigation = async () => {
    if (App.view instanceof ReminderListView) {
        return;
    }

    await App.view.navigateToReminders();
};

export const confirmFromContextMenu = async (index) => {
    await test(`Confirm reminder from context menu [${index}]`, async () => {
        await checkNavigation();

        await App.view.confirmFromContextMenu(index);
        return App.state.fetchAndTest();
    });
};

export const updateFromContextMenu = async (index) => {
    await test(`Update reminder from context menu [${index}]`, async () => {
        await checkNavigation();

        await App.view.goToUpdateItem(index);
        assert.instanceOf(App.view, TransactionView, 'Invalid view');

        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const cancelFromContextMenu = async (index) => {
    await test(`Cancel reminder from context menu [${index}]`, async () => {
        await checkNavigation();

        await App.view.cancelFromContextMenu(index);
        return App.state.fetchAndTest();
    });
};

export const confirm = async (index) => {
    await test(`Confirm reminders [${index}]`, async () => {
        await checkNavigation();

        await App.view.confirmItems(index);
        return App.state.fetchAndTest();
    });
};

export const cancel = async (index) => {
    await test(`Cancel reminders [${index}]`, async () => {
        await checkNavigation();

        await App.view.cancelItems(index);
        return App.state.fetchAndTest();
    });
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

        await App.view.selectItems(indexes);
        let items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectItems(indexes);
        items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        return true;
    });
};

export const showDetails = async ({ index, directNavigate = false }) => {
    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of transaction not specified');

    await test(`Show details of transaction [${index}]`, async () => {
        await checkNavigation();
        return App.view.showDetails(index, directNavigate);
    });
};

export const closeDetails = async ({ directNavigate = false } = {}) => {
    await test('Close transaction details', async () => {
        await checkNavigation();
        return App.view.closeDetails(directNavigate);
    });
};

/** Clicks by mode selector button */
export const toggleMode = async () => {
    await test('Toggle details/classic mode', async () => {
        await checkNavigation();
        return App.view.toggleMode();
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

    await test('Show more items', () => App.view.showMore());
};