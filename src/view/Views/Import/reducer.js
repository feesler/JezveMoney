import { createSlice } from '../../js/store.js';
import { fixFloat } from '../../js/utils.js';
import {
    EXPENSE,
    INCOME,
    TRANSFER,
    DEBT,
} from '../../js/model/Transaction.js';
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
 * Map import row to new transaction
 * @param {Object} data - import data
 */
const mapImportItem = (data, state) => {
    if (!data) {
        throw new Error('Invalid data');
    }

    const { mainAccount } = state;
    if (data.accountCurrencyId !== mainAccount.curr_id) {
        throw new Error('Currency must be the same as main account');
    }
    const accAmount = parseFloat(fixFloat(data.accountAmount));
    if (Number.isNaN(accAmount) || accAmount === 0) {
        throw new Error('Invalid account amount value');
    }
    const trAmount = parseFloat(fixFloat(data.transactionAmount));
    if (Number.isNaN(trAmount) || trAmount === 0) {
        throw new Error('Invalid transaction amount value');
    }

    const item = {
        enabled: true,
        type: (accAmount > 0) ? INCOME : EXPENSE,
        originalData: {
            ...data,
            origAccount: { ...mainAccount },
        },
    };

    if (item.type === EXPENSE) {
        item.src_id = mainAccount.id;
        item.dest_id = 0;
        item.dest_amount = Math.abs(trAmount);
        item.dest_curr = data.transactionCurrencyId;
        item.src_amount = Math.abs(accAmount);
        item.src_curr = data.accountCurrencyId;
    } else if (item.type === INCOME) {
        item.src_id = 0;
        item.dest_id = mainAccount.id;
        item.src_amount = Math.abs(trAmount);
        item.src_curr = data.transactionCurrencyId;
        item.dest_amount = Math.abs(accAmount);
        item.dest_curr = data.accountCurrencyId;
    }

    item.date = window.app.formatDate(new Date(data.date));
    item.comment = data.comment;

    return item;
};

const convertItemDataToProps = (data, state) => {
    const { mainAccount } = state;
    const res = {
        mainAccount,
        enabled: data.enabled,
        sourceAmount: data.src_amount,
        destAmount: data.dest_amount,
        srcCurrId: data.src_curr,
        destCurrId: data.dest_curr,
        date: data.date,
        comment: data.comment,
    };

    if (data.type === EXPENSE) {
        res.type = 'expense';
        res.sourceAccountId = data.src_id;
    } else if (data.type === INCOME) {
        res.type = 'income';
        res.destAccountId = data.dest_id;
    } else if (data.type === TRANSFER) {
        const isTransferFrom = data.src_id === mainAccount.id;
        res.type = (isTransferFrom) ? 'transferfrom' : 'transferto';
        if (isTransferFrom) {
            res.destAccountId = data.dest_id;
        } else {
            res.sourceAccountId = data.src_id;
        }
    } else if (data.type === DEBT) {
        res.type = (data.op === 1) ? 'debtto' : 'debtfrom';
        res.personId = data.person_id;
    }

    if (data.originalData) {
        res.originalData = { ...data.originalData };
    }

    return { data: res };
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
                ...data.map((item, index) => {
                    const transaction = mapImportItem(item, state);
                    const props = convertItemDataToProps(transaction, state);
                    props.data.id = state.lastId + index + 1;

                    const newItem = new ImportTransaction(props.data);
                    newItem.state.listMode = state.listMode;
                    return newItem;
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
            if (!item.originalData) {
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
            if (!item.originalData || item.isSameSimilarTransaction(null)) {
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
            newItem.state.listMode = listMode;
            newItem.select(false);
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

    changePage: (state, page) => (
        (state.pagination.page === page)
            ? state
            : {
                ...state,
                contextItemIndex: -1,
                pagination: {
                    ...state.pagination,
                    page,
                },
            }
    ),

    createItem: (state) => {
        if (state.listMode !== 'list' || state.activeItemIndex !== -1) {
            return state;
        }

        const currencyId = state.mainAccount.curr_id;
        const itemData = {
            enabled: true,
            type: EXPENSE,
            src_amount: '',
            dest_amount: '',
            src_curr: currencyId,
            dest_curr: currencyId,
            date: window.app.formatDate(new Date()),
            comment: '',
        };
        const itemProps = convertItemDataToProps(itemData, state);
        const form = new ImportTransaction(itemProps.data);
        form.state.listMode = 'list';

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

    applyRules: (state, restore) => (
        (state.rulesEnabled)
            ? {
                ...state,
                items: state.items.map((item) => {
                    if (!item.originalData) {
                        return item;
                    }

                    const newItem = new ImportTransaction(item);
                    if (restore) {
                        newItem.restoreOriginal();
                    }
                    window.app.model.rules.applyTo(newItem);

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
            if (!item.originalData) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            if (!state.rulesEnabled) {
                window.app.model.rules.applyTo(newItem);
            } else {
                newItem.restoreOriginal();
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
