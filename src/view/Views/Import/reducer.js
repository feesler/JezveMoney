import { createSlice } from '../../js/store.js';
import { ImportTransaction } from '../../js/model/ImportTransaction.js';

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
    showContextMenu: (state, itemIndex) => (
        (state.contextItemIndex === itemIndex)
            ? state
            : { ...state, contextItemIndex: itemIndex }
    ),

    uploadFileDone: (state, data) => {
        if (!Array.isArray(data)) {
            throw new Error('Invalid data');
        }

        const newState = {
            ...state,
            items: [
                ...state.items,
                ...data.map((item, index) => (
                    ImportTransaction.fromImportData({
                        ...item,
                        id: state.lastId + index + 1,
                    })
                )),
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

            if (item.isSameSimilarTransaction(transaction)) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.setSimilarTransaction(transaction);
            return newItem;
        }),
    }),

    disableFindSimilar: (state) => ({
        ...state,
        items: state.items.map((item) => {
            if (
                !item.originalData
                || item.modifiedByUser
                || item.isSameSimilarTransaction(null)
            ) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.setSimilarTransaction(null);
            return newItem;
        }),
    }),

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => {
            const newItem = new ImportTransaction(item);
            newItem.select(true);
            return newItem;
        }),
    }),

    deselectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => {
            const newItem = new ImportTransaction(item);
            newItem.select(false);
            return newItem;
        }),
    }),

    enableSelectedItems: (state, value) => ({
        ...state,
        items: state.items.map((item) => {
            if (!item.selected) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.enable(!!value);
            return newItem;
        }),
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
        items: state.items.map((item) => {
            const newItem = new ImportTransaction(item);
            newItem.setListMode(listMode);
            return newItem;
        }),
    }),

    toggleSelectItemByIndex: (state, index) => ({
        ...state,
        items: state.items.map((item, ind) => {
            if (index !== ind) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.toggleSelect();
            return newItem;
        }),
    }),

    toggleCollapseItem: (state, index) => ({
        ...state,
        items: state.items.map((item, ind) => {
            if (ind !== index) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.collapse(!newItem.collapsed);
            return newItem;
        }),
    }),

    restoreItemByIndex: (state, index) => ({
        ...state,
        contextItemIndex: -1,
        items: state.items.map((item, ind) => {
            if (ind !== index) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.restoreOriginal();
            return newItem;
        }),
    }),

    toggleEnableItemByIndex: (state, index) => ({
        ...state,
        contextItemIndex: -1,
        items: state.items.map((item, ind) => {
            if (ind !== index) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.enable(!item.enabled);
            return newItem;
        }),
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
        });

        return {
            ...state,
            form,
            activeItemIndex: state.items.length,
        };
    },

    saveItem: (state, data) => {
        const isAppend = (state.activeItemIndex === state.items.length);
        const savedItem = data;
        if (isAppend) {
            savedItem.props.id = state.lastId + 1;
            savedItem.state.id = savedItem.props.id;
        }
        if (isAppend || savedItem.isChanged(state.items[state.activeItemIndex])) {
            savedItem.setModified(true);
        }

        const newState = {
            ...state,
            items: (
                (isAppend)
                    ? [...state.items, savedItem]
                    : state.items.map((item, ind) => (
                        (ind === state.activeItemIndex) ? savedItem : item
                    ))
            ),
            lastId: (isAppend) ? (state.lastId + 1) : state.lastId,
            form: null,
            activeItemIndex: -1,
        };

        newState.pagination = getPagination(newState);
        const pageIndex = getPageIndex(state.activeItemIndex, newState);
        newState.pagination.page = pageIndex.page;

        return newState;
    },

    editItem: (state, index) => {
        const activeItemIndex = index ?? state.contextItemIndex;
        if (activeItemIndex === -1 || activeItemIndex === state.activeItemIndex) {
            return state;
        }

        const form = new ImportTransaction(state.items[activeItemIndex]);
        form.enable(true);
        return {
            ...state,
            contextItemIndex: -1,
            activeItemIndex,
            form,
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

        const mainAccount = window.app.model.accounts.getItem(accountId);
        if (!mainAccount) {
            throw new Error(`Account ${accountId} not found`);
        }

        const setItemMainAccount = (item, id) => {
            if (!item || item?.mainAccount?.id === id) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.setMainAccount(id);
            return newItem;
        };

        return {
            ...state,
            mainAccount,
            items: state.items.map((item) => setItemMainAccount(item, mainAccount.id)),
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

                    const { rules } = window.app.model;
                    const newItem = new ImportTransaction(item);

                    // Restore transaction for case some rules was removed
                    if (newItem.rulesApplied) {
                        newItem.restoreOriginal();
                    }
                    rules.applyTo(newItem);

                    return newItem;
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

            const { rules } = window.app.model;
            const enable = !state.rulesEnabled;
            const newItem = new ImportTransaction(item);

            if (newItem.rulesApplied) {
                newItem.restoreOriginal();
            }
            if (enable) {
                rules.applyTo(newItem);
            }

            return newItem;
        }),
    }),

    toggleCheckSimilar: (state) => ({
        ...state,
        checkSimilarEnabled: !state.checkSimilarEnabled,
        contextItemIndex: -1,
    }),

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
