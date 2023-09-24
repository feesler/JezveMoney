import { createSlice } from 'jezvejs/Store';
import { App } from '../../Application/App.js';
import { ImportTransaction } from '../../Models/ImportTransaction.js';
import { REMINDER_SCHEDULED, Reminder } from '../../Models/Reminder.js';

/** Returns page number and relative index of specified absolute index */
export const getPageIndex = (index, state) => {
    if (index === -1) {
        return { page: 0, index: -1 };
    }

    const { onPage } = state.pagination;
    return {
        page: Math.floor(index / onPage) + 1,
        index: index % onPage,
    };
};

/**
 * Compare transaction item with reference object
 * @param {TransactionItem} item - transaction item object
 * @param {Object} reference - imported transaction object
 */
const isSimilarTransaction = (item, reference) => {
    if (!item || !reference) {
        throw new Error('Invalid parameters');
    }

    // Check date, source and destination accounts
    if (
        item.src_id !== reference.src_id
        || item.dest_id !== reference.dest_id
        || item.date !== reference.date
    ) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reference.src_amount);
    const refDestAmount = Math.abs(reference.dest_amount);
    if (
        (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
    ) {
        return false;
    }

    return true;
};

/** Return first found transaction with same date and amount as reference */
const findSimilarTransaction = (transactions, reference) => {
    const res = transactions.find((item) => (
        item
        && !item.picked
        && isSimilarTransaction(item, reference)
    ));
    return res ?? null;
};

/** Returns array of extended reminders */
const getExtendedReminders = () => (
    App.model.reminders.map((item) => Reminder.createExtended(item))
);

/** Returns true if both items has the same reminder selected */
const isSameRemiderSelected = (a, b) => (
    (
        !!a.reminderId
        && a.reminderId === b.reminderId
    ) || (
        !!a.scheduleId
        && a.scheduleId === b.scheduleId
        && a.reminderDate === b.reminderDate
    )
);

/** Removes reminder from item if the same reminder is selected by reference item */
const removeSameReminder = (item, ref) => (
    isSameRemiderSelected(item, ref)
        ? item.removeReminder()
        : item
);

/** Returns true if specified reminder is suitable for transaction */
const isSuitableReminder = (item, reminder) => {
    if (!item || reminder?.state !== REMINDER_SCHEDULED) {
        return false;
    }

    // Check date, source and destination accounts
    if (
        item.type !== reminder.type
        || item.src_id !== reminder.src_id
        || item.dest_id !== reminder.dest_id
        || item.date !== reminder.date
    ) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reminder.src_amount);
    const refDestAmount = Math.abs(reminder.dest_amount);
    if (
        (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
    ) {
        return false;
    }

    return true;
};

/** Returns first suitable reminder for specified transaction */
const findSuitableReminder = (transaction, reminders) => (
    reminders.find((item) => (
        item
        && !item.picked
        && isSuitableReminder(transaction, item)
    )) ?? null
);

/** Updates list state */
const getPagination = (state) => {
    const { items, pagination } = state;
    const pagesCount = Math.ceil(items.length / pagination.onPage);
    const res = {
        ...pagination,
        total: items.length,
        pagesCount,
        range: 1,
    };

    res.page = (pagesCount > 0) ? Math.min(pagesCount, res.page) : 1;

    return res;
};

const slice = createSlice({
    showMenu: (state) => (
        (state.showMenu) ? state : { ...state, showMenu: true, showContextMenu: false }
    ),

    hideMenu: (state) => (
        (!state.showMenu) ? state : { ...state, showMenu: false }
    ),

    showContextMenu: (state, itemIndex) => (
        (state.contextItemIndex === itemIndex && state.showContextMenu)
            ? state
            : {
                ...state,
                contextItemIndex: itemIndex,
                showContextMenu: true,
                showMenu: false,
            }
    ),

    hideContextMenu: (state) => (
        (state.showContextMenu) ? { ...state, showContextMenu: false } : state
    ),

    uploadFileDone: (state, data) => {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data');
        }

        const reminders = getExtendedReminders();
        const newState = {
            ...state,
            items: [
                ...state.items,
                ...data.map((item, index) => {
                    let transaction = ImportTransaction.fromImportData({
                        ...item,
                        id: state.lastId + index + 1,
                    });

                    if (!state.checkRemindersEnabled) {
                        return transaction;
                    }

                    const itemData = transaction.getData();
                    const reminder = findSuitableReminder(itemData, reminders);
                    if (reminder) {
                        reminder.picked = true;
                        transaction = transaction.setReminder({
                            reminder_id: reminder.id,
                            schedule_id: reminder.schedule_id,
                            reminder_date: reminder.date,
                        });
                    }

                    return transaction;
                }),
            ],
            lastId: state.lastId + data.length,
        };

        newState.pagination = getPagination(newState);
        return newState;
    },

    similarTransactionsLoaded: (state, transactions) => ({
        ...state,
        items: state.items.map((item) => {
            if (!item.originalData || item.modifiedByUser) {
                return item;
            }

            const data = item.getData();
            const transaction = findSimilarTransaction(transactions, data);
            if (transaction) {
                transaction.picked = true;
            }

            return item.setSimilarTransaction(transaction);
        }),
    }),

    disableFindSimilar: (state) => ({
        ...state,
        items: state.items.map((item) => {
            if (
                !item.originalData
                || item.modifiedByUser
            ) {
                return item;
            }

            return item.setSimilarTransaction(null);
        }),
    }),

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => item.select(true)),
    }),

    deselectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => item.select(false)),
    }),

    enableSelectedItems: (state, value) => ({
        ...state,
        items: state.items.map((item) => (
            (item.selected) ? item.enable(!!value) : item
        )),
    }),

    deleteSelectedItems: (state) => {
        const newState = {
            ...state,
            items: state.items.filter((item) => !item.selected),
        };
        newState.pagination = getPagination(newState);
        if (newState.items.length === 0) {
            newState.listMode = 'list';
        }

        return newState;
    },

    deleteAllItems: (state) => {
        const newState = {
            ...state,
            items: [],
            activeItemIndex: -1,
            listMode: 'list',
        };
        newState.pagination = getPagination(newState);

        return newState;
    },

    deleteItemByIndex: (state, index) => {
        if (index === -1) {
            return state;
        }

        const newState = {
            ...state,
            contextItemIndex: -1,
            items: state.items.filter((_, ind) => (ind !== index)),
        };
        newState.pagination = getPagination(newState);
        return newState;
    },

    changeListMode: (state, listMode) => ({
        ...state,
        listMode,
        contextItemIndex: -1,
        showContextMenu: false,
        items: state.items.map((item) => item.setListMode(listMode)),
    }),

    toggleSelectItemByIndex: (state, index) => ({
        ...state,
        items: state.items.map((item, ind) => (
            (index === ind) ? item.toggleSelect() : item
        )),
    }),

    toggleCollapseItem: (state, index) => ({
        ...state,
        items: state.items.map((item, ind) => (
            (index === ind) ? item.collapse(!item.collapsed) : item
        )),
    }),

    restoreItemByIndex: (state, index) => ({
        ...state,
        contextItemIndex: -1,
        items: state.items.map((item, ind) => (
            (index === ind) ? item.restoreOriginal() : item
        )),
    }),

    toggleEnableItemByIndex: (state, index) => ({
        ...state,
        contextItemIndex: -1,
        items: state.items.map((item, ind) => (
            (ind === index) ? item.enable(!item.enabled) : item
        )),
    }),

    changePage: (state, page) => ({
        ...state,
        contextItemIndex: -1,
        pagination: {
            ...state.pagination,
            page,
            range: 1,
        },
    }),

    showMore: (state) => ({
        ...state,
        contextItemIndex: -1,
        pagination: {
            ...state.pagination,
            range: state.pagination.range + 1,
        },
    }),

    createItem: (state) => {
        if (state.listMode !== 'list' || state.activeItemIndex !== -1) {
            return state;
        }

        const form = new ImportTransaction({
            mainAccount: state.mainAccount,
            sourceAmount: '',
            destAmount: '',
            date: App.formatInputDate(new Date()),
        });

        return {
            ...state,
            form,
            activeItemIndex: state.items.length,
        };
    },

    saveItem: (state, data) => {
        const isAppend = (state.activeItemIndex === state.items.length);
        let savedItem = new ImportTransaction({
            ...data,
            id: (isAppend) ? state.lastId + 1 : data.id,
        });

        if (isAppend || savedItem.isChanged(state.items[state.activeItemIndex])) {
            savedItem = savedItem.setModified(true);
        }

        const items = (isAppend) ? [...state.items, savedItem] : state.items;
        const newState = {
            ...state,
            items: (
                items.map((item, ind) => (
                    (ind === state.activeItemIndex)
                        ? savedItem
                        : removeSameReminder(item, savedItem)
                ))
            ),
            lastId: (isAppend) ? (state.lastId + 1) : state.lastId,
            form: null,
            activeItemIndex: -1,
        };

        newState.pagination = getPagination(newState);

        // Change page if saved item is not in current range
        const startPage = state.pagination.page;
        const endPage = startPage + state.pagination.range - 1;
        const pageIndex = getPageIndex(state.activeItemIndex, newState);
        if (pageIndex.page < startPage || pageIndex.page > endPage) {
            newState.pagination.page = pageIndex.page;
        } else {
            newState.pagination.page = startPage;
            newState.pagination.range = state.pagination.range;
        }

        return newState;
    },

    editItem: (state, index) => {
        const activeItemIndex = index ?? state.contextItemIndex;
        if (activeItemIndex === -1 || activeItemIndex === state.activeItemIndex) {
            return state;
        }

        const item = state.items[activeItemIndex];
        return {
            ...state,
            contextItemIndex: -1,
            activeItemIndex,
            form: item.enable(true),
        };
    },

    duplicateItem: (state, index) => {
        const contextItemIndex = index ?? state.contextItemIndex;
        if (contextItemIndex === -1) {
            return state;
        }

        const item = state.items[contextItemIndex];
        return {
            ...state,
            contextItemIndex: -1,
            form: item.enable(true),
            activeItemIndex: state.items.length,
        };
    },

    cancelEditItem: (state) => ({
        ...state,
        activeItemIndex: -1,
        form: null,
    }),

    changeMainAccount: (state, accountId) => {
        if (state.mainAccount?.id === accountId) {
            return state;
        }

        const { userAccounts } = App.model;
        const mainAccount = userAccounts.getItem(accountId);
        if (!mainAccount) {
            throw new Error(`Account ${accountId} not found`);
        }

        return {
            ...state,
            mainAccount,
            items: state.items.map((item) => item.setMainAccount(mainAccount.id)),
        };
    },

    applyRules: (state) => (
        (state.rulesEnabled)
            ? {
                ...state,
                items: state.items.map((item) => {
                    if (!item.originalData || item.modifiedByUser) {
                        return item;
                    }

                    const { rules } = App.model;
                    let newItem = item;

                    // Restore transaction for case some rules was removed
                    if (newItem.rulesApplied) {
                        newItem = newItem.restoreOriginal();
                    }

                    return rules.applyTo(newItem);
                }),
            }
            : state
    ),

    toggleEnableRules: (state) => ({
        ...state,
        contextItemIndex: -1,
        rulesEnabled: !state.rulesEnabled,
        items: state.items.map((item) => {
            if (!item.originalData || item.modifiedByUser) {
                return item;
            }

            const { rules } = App.model;
            const enable = !state.rulesEnabled;
            let newItem = item;
            if (newItem.rulesApplied) {
                newItem = newItem.restoreOriginal();
            }

            return (enable) ? rules.applyTo(newItem) : newItem;
        }),
    }),

    toggleCheckSimilar: (state) => ({
        ...state,
        checkSimilarEnabled: !state.checkSimilarEnabled,
        contextItemIndex: -1,
    }),

    toggleCheckReminders: (state) => {
        const reminders = getExtendedReminders();
        const checkRemindersEnabled = !state.checkRemindersEnabled;

        return {
            ...state,
            checkRemindersEnabled,
            contextItemIndex: -1,
            items: state.items.map((item) => {
                if (!item.originalData || item.modifiedByUser) {
                    return item;
                }

                if (!checkRemindersEnabled) {
                    return item.removeReminder();
                }

                const reminder = findSuitableReminder(item.getData(), reminders);
                if (!reminder) {
                    return item;
                }

                reminder.picked = true;
                return item.setReminder({
                    reminder_id: reminder.id,
                    schedule_id: reminder.schedule_id,
                    reminder_date: reminder.date,
                });
            }),
        };
    },

    changeItemPosition: (state, { fromIndex, toIndex }) => {
        if (fromIndex === -1 || toIndex === -1) {
            return state;
        }

        const newState = {
            ...state,
            items: [...state.items],
        };
        const [cutItem] = newState.items.splice(fromIndex, 1);
        newState.items.splice(toIndex, 0, cutItem);

        const { activeItemIndex } = state;
        if (activeItemIndex === -1) {
            return newState;
        }

        if (activeItemIndex === fromIndex) {
            newState.activeItemIndex = toIndex;
        } else if (activeItemIndex > fromIndex && activeItemIndex < toIndex) {
            newState.activeItemIndex -= 1;
        } else if (activeItemIndex < fromIndex && activeItemIndex > toIndex) {
            newState.activeItemIndex += 1;
        }

        return newState;
    },
});

export const { actions, reducer } = slice;
