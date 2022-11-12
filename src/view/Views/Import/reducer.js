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
        page: Math.max(1, Math.ceil(index / onPage)),
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
        isForm: data.isForm,
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

const reduceDeleteItemByIndex = (state, index) => {
    if (index === -1) {
        return state;
    }

    const newState = {
        ...state,
        contextItemIndex: -1,
        items: state.items.filter((_, ind) => (ind !== index)),
    };

    if (newState.activeItemIndex === index) {
        newState.activeItemIndex = -1;
        newState.originalItemData = null;
    } else if (index < newState.activeItemIndex) {
        newState.activeItemIndex -= 1;
    }

    newState.pagination = getPagination(newState);
    return newState;
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
                ...data.map((item) => {
                    const transaction = mapImportItem(item, state);
                    const props = convertItemDataToProps(transaction, state);
                    const newItem = new ImportTransaction(props.data);
                    newItem.state.listMode = state.listMode;
                    return newItem;
                }),
            ],
        };

        newState.pagination = getPagination(newState);
        return newState;
    },

    similarTransactionsLoaded: (state, transactions) => ({
        ...state,
        items: state.items.map((item) => {
            if (!item.isImported) {
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
            if (!item.isImported) {
                return item;
            }
            if (item.isSameSimilarTransaction(null)) {
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
            originalItemData: null,
            listMode: 'list',
        };
        newState.pagination = getPagination(newState);

        return newState;
    },

    deleteItemByIndex: (state, index) => reduceDeleteItemByIndex(state, index),

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

    collapseItem: (state, { index, collapsed }) => ({
        ...state,
        items: state.items.map((item, ind) => {
            if (ind !== index) {
                return item;
            }
            if (item.collapsed === collapsed) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.collapse(collapsed);
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
                pagination: {
                    ...state.pagination,
                    page,
                },
            }
    ),

    createItem: (state) => {
        if (state.listMode !== 'list') {
            return state;
        }

        const currencyId = state.mainAccount.curr_id;
        const itemData = {
            isForm: true,
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
        const newItem = new ImportTransaction(itemProps.data);
        newItem.state.listMode = 'list';

        const newState = {
            ...state,
            items: [...state.items, newItem],
            activeItemIndex: state.items.length,
            originalItemData: null,
        };
        newState.pagination = getPagination(newState);
        newState.pagination.page = newState.pagination.pagesCount;

        return newState;
    },

    saveItem: (state) => ({
        ...state,
        items: state.items.map((item, ind) => {
            if (ind !== state.activeItemIndex) {
                return item;
            }

            const savedItem = new ImportTransaction(item);
            savedItem.isForm = false;
            return savedItem;
        }),
        activeItemIndex: -1,
        originalItemData: null,
    }),

    editItem: (state, index) => ({
        ...state,
        contextItemIndex: -1,
        items: state.items.map((item, ind) => {
            const isForm = (ind === index);
            if (item.isForm === isForm) {
                return item;
            }

            const newItem = new ImportTransaction(item);
            newItem.isForm = isForm;
            return newItem;
        }),
        activeItemIndex: index,
        originalItemData: new ImportTransaction(state.items[index]),
    }),

    formChanged: (state, data) => {
        const { activeItemIndex } = state;
        if (activeItemIndex === -1) {
            return state;
        }

        const newState = state;
        newState.items[activeItemIndex] = new ImportTransaction(data);

        return newState;
    },

    cancelEditItem: (state) => {
        const { activeItemIndex, originalItemData } = state;
        if (activeItemIndex === -1) {
            return state;
        }

        const pageIndex = getPageIndex(activeItemIndex, state);
        if (pageIndex.page !== state.pagination.page) {
            throw new Error('Invalid page');
        }

        if (!originalItemData) {
            return reduceDeleteItemByIndex(state, activeItemIndex);
        }

        return {
            ...state,
            items: state.items.map((item, ind) => (
                (ind === activeItemIndex) ? originalItemData : item
            )),
            activeItemIndex: -1,
            originalItemData: null,
        };
    },

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
            originalItemData: setItemMainAccount(state.originalItemData, mainAccount.id),
        };
    },

    applyRules: (state, restore) => (
        (state.rulesEnabled)
            ? {
                ...state,
                items: state.items.map((item) => {
                    if (!item.isImported) {
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
            if (!item.isImported) {
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
