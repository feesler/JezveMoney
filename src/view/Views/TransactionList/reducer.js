import { createSlice } from '../../js/store.js';

// Utils
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

// Reducers
const reduceDeselectAllItems = (state) => ({
    ...state,
    items: state.items.map((item) => (
        (item.selected)
            ? { ...item, selected: false }
            : item
    )),
});

const slice = createSlice({
    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId)
            ? state
            : { ...state, contextItem: itemId }
    ),

    toggleSelectItem: (state, itemId) => ({
        ...state,
        items: state.items.map((item) => (
            (item.id === itemId)
                ? { ...item, selected: !item.selected }
                : item
        )),
    }),

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        )),
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
            acc_id: accounts,
        },
    }),

    changePersonsFilter: (state, persons) => ({
        ...state,
        form: {
            ...state.form,
            person_id: persons,
        },
    }),

    changeCategoriesFilter: (state, categories) => ({
        ...state,
        form: {
            ...state.form,
            category_id: categories,
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

    toggleMode: (state) => ({
        ...state,
        mode: (state.mode === 'details') ? 'classic' : 'details',
        contextItem: null,
    }),

    showCategoryDialog: (state, ids) => ({
        ...state,
        showCategoryDialog: true,
        categoryDialog: {
            ...state.categoryDialog,
            ids,
        },
        contextItem: null,
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
            form: { ...data.filter },
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
