import { AccountList } from '../../js/model/AccountList.js';
import { PersonList } from '../../js/model/PersonList.js';
import { createSlice } from '../../js/store.js';

// Reducers
const slice = createSlice({
    showTransactionContextMenu: (state, itemId) => (
        (state.transactionContextItem === itemId)
            ? state
            : { ...state, transactionContextItem: itemId }
    ),

    startLoading: (state) => (
        (state.loading) ? state : { ...state, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading) ? { ...state, loading: false } : state
    ),

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

    showCategoryDialog: (state, ids) => ({
        ...state,
        showCategoryDialog: true,
        categoryDialog: {
            categoryId: 0,
            ids,
        },
        transactionContextItem: null,
    }),

    closeCategoryDialog: (state) => ({
        ...state,
        showCategoryDialog: false,
    }),

    changeCategorySelect: (state, id) => ({
        ...state,
        categoryDialog: {
            ...state.categoryDialog,
            categoryId: id,
        },
    }),

    listRequestLoaded: (state, data) => ({
        ...state,
        transactions: data.transactions.data,
        accounts: {
            visible: AccountList.create(window.app.model.visibleUserAccounts),
        },
        persons: {
            visible: PersonList.create(window.app.model.visiblePersons),
        },
        chartData: data.histogram,
        transactionContextItem: null,
    }),
});

export const { actions, reducer } = slice;
