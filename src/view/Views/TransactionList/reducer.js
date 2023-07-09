import { createSlice } from 'jezvejs/Store';
import {
    formatDateRange,
    reduceDeselectItem,
    reduceSelectItem,
    reduceToggleItem,
} from '../../utils/utils.js';

// Reducers
const reduceDeselectAllItems = (state) => ({
    ...state,
    items: state.items.map(reduceDeselectItem),
});

const slice = createSlice({
    showDetails: (state) => (
        (state.detailsId === state.contextItem)
            ? state
            : {
                ...state,
                detailsId: state.contextItem,
                contextItem: null,
            }
    ),

    closeDetails: (state) => (
        (state.detailsId)
            ? { ...state, detailsId: null }
            : state
    ),

    showMenu: (state) => (
        (state.showMenu)
            ? state
            : { ...state, showMenu: true, showContextMenu: false }
    ),

    hideMenu: (state) => (
        (!state.showMenu) ? state : { ...state, showMenu: false }
    ),

    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId && state.showContextMenu)
            ? state
            : {
                ...state,
                contextItem: itemId,
                showContextMenu: true,
                showMenu: false,
            }
    ),

    hideContextMenu: (state) => (
        (state.showContextMenu) ? { ...state, showContextMenu: false } : state
    ),

    toggleSelectItem: (state, itemId) => ({
        ...state,
        items: state.items.map(reduceToggleItem(itemId)),
    }),

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map(reduceSelectItem),
    }),

    deselectAllItems: (state) => reduceDeselectAllItems(state),

    changeListMode: (state, listMode) => {
        if (state.listMode === listMode) {
            return state;
        }

        const newState = {
            ...state,
            listMode,
            contextItem: null,
        };

        return (listMode === 'list') ? reduceDeselectAllItems(newState) : newState;
    },

    startLoading: (state, isLoadingMore = false) => (
        (state.loading) ? state : { ...state, isLoadingMore, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading) ? { ...state, loading: false, isLoadingMore: false } : state
    ),

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

    clearAllFilters: (state) => ({
        ...state,
        form: {},
        pagination: {
            ...state.pagination,
            page: 1,
        },
    }),

    changeTypeFilter: (state, type) => ({
        ...state,
        form: {
            ...state.form,
            type,
        },
    }),

    changeAccountsFilter: (state, accounts) => ({
        ...state,
        form: {
            ...state.form,
            accounts,
        },
    }),

    changePersonsFilter: (state, persons) => ({
        ...state,
        form: {
            ...state.form,
            persons,
        },
    }),

    changeCategoriesFilter: (state, categories) => ({
        ...state,
        form: {
            ...state.form,
            categories,
        },
    }),

    changeSearchQuery: (state, value) => {
        if (state.form.search === value) {
            return state;
        }

        const newState = {
            ...state,
            form: {
                ...state.form,
            },
        };

        if (value.length > 0) {
            newState.form.search = value;
        } else if ('search' in state.form) {
            delete newState.form.search;
        }

        return newState;
    },

    changeDateFilter: (state, data) => ({
        ...state,
        form: {
            ...state.form,
            ...data,
        },
    }),

    toggleGroupByDate: (state) => ({
        ...state,
        groupByDate: !state.groupByDate,
    }),

    toggleMode: (state) => ({
        ...state,
        mode: (state.mode === 'details') ? 'classic' : 'details',
        contextItem: null,
    }),

    showCategoryDialog: (state, ids) => {
        if (ids.length === 0) {
            return state;
        }

        let categoryId = 0;
        if (ids.length === 1) {
            const [id] = ids;
            const transaction = state.items.find((item) => item.id === id);
            if (transaction) {
                categoryId = transaction.category_id;
            }
        }

        // Check all transactions have same type, otherwise show only categories with type 'Any'
        const type = ids.reduce((currentType, id) => {
            const transaction = state.items.find((item) => item.id === id);
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
            contextItem: null,
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

    listRequestLoaded: (state, data) => {
        const selectedBefore = (data.keepState && state.listMode === 'select')
            ? state.items.filter((item) => item.selected).map((item) => item.id)
            : [];

        return {
            ...state,
            items: data.items.map((item) => (
                (data.keepState)
                    ? { ...item, selected: selectedBefore.includes(item.id) }
                    : item
            )),
            pagination: { ...data.pagination },
            filter: { ...data.filter },
            form: {
                ...data.filter,
                ...formatDateRange(data.filter),
            },
            listMode: (data.keepState) ? state.listMode : 'list',
            contextItem: null,
        };
    },

    listRequestError: (state) => ({
        ...state,
        form: { ...state.filter },
    }),
});

export const { actions, reducer } = slice;
