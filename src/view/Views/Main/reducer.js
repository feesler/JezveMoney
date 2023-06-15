import { createSlice } from 'jezvejs/Store';
import { App } from '../../Application/App.js';
import { AccountList } from '../../Models/AccountList.js';
import { PersonList } from '../../Models/PersonList.js';

// Reducers
const slice = createSlice({
    toggleHiddenAccounts: (state) => (
        (state.accounts.hidden.length === 0)
            ? state
            : {
                ...state,
                accounts: {
                    ...state.accounts,
                    showHidden: !state.accounts.showHidden,
                },
            }
    ),

    toggleHiddenPersons: (state) => (
        (state.persons.hidden.length === 0)
            ? state
            : {
                ...state,
                persons: {
                    ...state.persons,
                    showHidden: !state.persons.showHidden,
                },
            }
    ),

    showTransactionContextMenu: (state, itemId) => (
        (state.transactionContextItem === itemId && state.showContextMenu)
            ? state
            : { ...state, transactionContextItem: itemId, showContextMenu: true }
    ),

    hideTransactionContextMenu: (state) => (
        (state.showContextMenu) ? { ...state, showContextMenu: false } : state
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
            const [itemId] = ids;
            const id = parseInt(itemId, 10);
            const transaction = state.transactions.find((item) => item.id === id);
            if (transaction) {
                categoryId = transaction.category_id;
            }
        }

        // Check all transactions have same type, otherwise show only categories with type 'Any'
        const type = ids.reduce((currentType, itemId) => {
            const id = parseInt(itemId, 10);
            const transaction = state.transactions.find((item) => item.id === id);
            if (!transaction) {
                throw new Error(`Transaction '${id}' not found`);
            }

            if (currentType === null) {
                return transaction.type;
            }

            return (currentType === transaction.type) ? currentType : 0;
        }, null);

        return {
            ...state,
            categoryDialog: {
                show: true,
                categoryId,
                type,
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
        transactions: data.transactions.items,
        accounts: {
            ...state.accounts,
            visible: AccountList.create(App.model.visibleUserAccounts),
            hidden: AccountList.create(App.model.hiddenUserAccounts),
        },
        persons: {
            ...state.persons,
            visible: PersonList.create(App.model.visiblePersons),
            hidden: PersonList.create(App.model.hiddenPersons),
        },
        chartData: data.histogram,
        transactionContextItem: null,
    }),
});

export const { actions, reducer } = slice;
