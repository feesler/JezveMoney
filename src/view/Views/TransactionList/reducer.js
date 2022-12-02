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
    }),

    listRequestLoaded: (state, data) => ({
        ...state,
        items: [...data.items],
        pagination: { ...data.pagination },
        filter: { ...data.filter },
        form: { ...data.filter },
        listMode: 'list',
        contextItem: null,
    }),

    listRequestError: (state) => ({
        ...state,
        form: { ...state.filter },
    }),
});

export const { actions, reducer } = slice;
