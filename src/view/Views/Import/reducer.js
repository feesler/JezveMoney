import { createSlice } from 'jezvejs/Store';
import { App } from '../../Application/App.js';
import { ImportTransaction } from '../../Models/ImportTransaction.js';
import {
    findSimilarTransaction,
    findSuitableReminder,
    getExtendedReminders,
    getPageIndex,
    getPagination,
    removeSameReminder,
} from './helpers.js';

const slice = createSlice({
    startLoading: (state) => (
        (state.loading) ? state : { ...state, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading) ? { ...state, loading: false } : state
    ),

    setRenderTime: (state) => ({ ...state, renderTime: Date.now() }),

    showMenu: (state) => (
        (state.showMenu) ? state : { ...state, showMenu: true, showContextMenu: false }
    ),

    hideMenu: (state) => (
        (!state.showMenu) ? state : { ...state, showMenu: false }
    ),

    showContextMenu: (state, itemIndex) => (
        (state.showContextMenu)
            ? state
            : {
                ...state,
                contextItemIndex: itemIndex,
                showContextMenu: true,
                showMenu: false,
            }
    ),

    hideContextMenu: (state) => (
        (!state.showContextMenu)
            ? state
            : {
                ...state,
                showContextMenu: false,
                contextItemIndex: -1,
            }
    ),

    openUploadDialog: (state) => (
        (state.showUploadDialog)
            ? state
            : { ...state, showUploadDialog: true }
    ),

    closeUploadDialog: (state) => (
        (!state.showUploadDialog)
            ? state
            : { ...state, showUploadDialog: false }
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

    enableSelectedItems: (state, value) => (
        (state.listMode !== 'select')
            ? state
            : {
                ...state,
                items: state.items.map((item) => (
                    (item.selected) ? item.enable(!!value) : item
                )),
            }
    ),

    deleteSelectedItems: (state) => {
        if (state.listMode !== 'select') {
            return state;
        }

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

    deleteItem: (state) => {
        if (state.contextItemIndex === -1) {
            return state;
        }

        const newState = {
            ...state,
            contextItemIndex: -1,
            items: state.items.filter((_, ind) => (ind !== state.contextItemIndex)),
        };
        newState.pagination = getPagination(newState);
        return newState;
    },

    changeListMode: (state, listMode) => (
        (state.listMode === listMode || state.activeItemIndex !== -1)
            ? state
            : {
                ...state,
                listMode,
                contextItemIndex: -1,
                showContextMenu: false,
                items: state.items.map((item) => item.setListMode(listMode)),
            }
    ),

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

    restoreItem: (state) => (
        (state.contextItemIndex === -1)
            ? state
            : {
                ...state,
                contextItemIndex: -1,
                items: state.items.map((item, ind) => (
                    (ind === state.contextItemIndex)
                        ? item.restoreOriginal()
                        : item
                )),
            }
    ),

    toggleEnableItem: (state) => (
        (state.contextItemIndex === -1)
            ? state
            : {
                ...state,
                contextItemIndex: -1,
                items: state.items.map((item, ind) => (
                    (ind === state.contextItemIndex)
                        ? item.enable(!item.enabled)
                        : item
                )),
            }
    ),

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

    openRulesDialog: (state) => (
        (state.showRulesDialog || !state.rulesEnabled)
            ? state
            : { ...state, showRulesDialog: true }
    ),

    closeRulesDialog: (state) => (
        (!state.showRulesDialog)
            ? state
            : { ...state, showRulesDialog: false }
    ),

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
