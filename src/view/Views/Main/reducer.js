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

    showCategoryDialog: (state, ids) => {
        if (ids.length === 0) {
            return state;
        }

        let categoryId = 0;
        if (ids.length === 1) {
            const [id] = ids;
            const transaction = state.transactions.find((item) => item.id === id);
            if (transaction) {
                categoryId = transaction.category_id;
            }
        }

        return {
            ...state,
            categoryDialog: {
                show: true,
                categoryId,
                ids,
            },
            transactionContextItem: null,
        };
    },

    closeCategoryDialog: (state) => ({
        ...state,
        categoryDialog: {
            ...state.categoryDialog,
            show: false,
        },
    }),

    changeCategorySelect: (state, categoryId) => ({
        ...state,
        categoryDialog: {
            ...state.categoryDialog,
            categoryId,
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
