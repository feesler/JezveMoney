import { asArray } from 'jezvejs';
import { createSlice } from 'jezvejs/Store';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { ScheduledTransaction } from '../../Models/ScheduledTransaction.js';
import { ReminderList } from '../../Models/ReminderList.js';

export const createList = (items, state) => {
    const stateFilter = asArray(state?.filter?.state);

    const res = (stateFilter.length > 0)
        ? items.filter((item) => stateFilter.includes(item?.state))
        : items;

    return ReminderList.create(res);
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: state.items.map(reduceDeselectItem),
});

export const updateList = (state) => {
    const { reminders } = App.model;
    const result = state;
    const { pagination } = result;

    const items = createList(reminders.data, state);
    result.items = items;

    pagination.pagesCount = Math.ceil(items.length / pagination.onPage);
    pagination.page = (pagination.pagesCount > 0)
        ? Math.min(pagination.pagesCount, pagination.page)
        : 1;
    pagination.total = items.length;

    return result;
};

const slice = createSlice({
    showDetails: (state) => ({
        ...state,
        detailsId: state.contextItem,
        detailsItem: (state.detailsId === state.contextItem) ? state.detailsItem : null,
        contextItem: null,
    }),

    closeDetails: (state) => (
        (state.detailsId)
            ? { ...state, detailsId: null }
            : state
    ),

    itemDetailsLoaded: (state, item) => (
        (state.detailsId !== item?.id)
            ? state
            : {
                ...state,
                detailsItem: new ScheduledTransaction(item),
            }
    ),

    showMenu: (state) => (
        (state.showMenu) ? state : { ...state, showMenu: true, showContextMenu: false }
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

    toggleSelectItem: (state, itemId) => {
        const item = App.model.reminders.getItem(itemId);
        if (!item) {
            return state;
        }

        const toggleItem = reduceToggleItem(itemId);
        return {
            ...state,
            items: state.items.map(toggleItem),
        };
    },

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map(reduceSelectItem),
    }),

    deselectAllItems: (state) => reduceDeselectAll(state),

    changeListMode: (state, listMode) => {
        if (state.listMode === listMode) {
            return state;
        }

        const newState = {
            ...state,
            listMode,
            contextItem: null,
        };

        return (listMode === 'list') ? reduceDeselectAll(newState) : newState;
    },

    changeStateFilter: (state, value) => updateList({
        ...state,
        filter: {
            ...state.filter,
            state: value,
        },
    }),

    showMore: (state) => ({
        ...state,
        pagination: {
            ...state.pagination,
            range: (state.pagination.range ?? 0) + 1,
        },
    }),

    changePage: (state, page) => ({
        ...state,
        pagination: {
            ...state.pagination,
            page,
            range: 1,
        },
    }),

    toggleMode: (state) => ({
        ...state,
        mode: (state.mode === 'details') ? 'classic' : 'details',
        contextItem: null,
        renderTime: Date.now(),
    }),

    startLoading: (state) => (
        (state.loading)
            ? state
            : { ...state, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading)
            ? { ...state, loading: false }
            : state
    ),

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

    listRequestLoaded: (state, keepState) => ({
        ...state,
        items: createList(App.model.reminders, state),
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
