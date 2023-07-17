import { createSlice } from 'jezvejs/Store';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { ScheduledTransaction } from '../../Models/ScheduledTransaction.js';
import { ReminderList } from '../../Models/ReminderList.js';
import { REMINDER_SCHEDULED, REMINDER_UPCOMING } from '../../Models/Reminder.js';

export const getStateFilter = (state) => (
    state?.filter?.state ?? REMINDER_SCHEDULED
);

export const getItemsSource = (state) => (
    (getStateFilter(state) === REMINDER_UPCOMING)
        ? (state.upcomingItems ?? [])
        : App.model.reminders.data
);

export const createList = (items, state) => {
    const stateFilter = getStateFilter(state);

    const res = items.filter((item) => stateFilter === item?.state);

    const list = ReminderList.create(res);
    if (stateFilter === REMINDER_UPCOMING) {
        list.sortByDateAsc();
    }

    return list;
};

const upcomingId = (item, index) => ({
    ...item,
    id: `u${index}`,
});

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: state.items.map(reduceDeselectItem),
});

export const updateList = (state) => {
    const result = state;
    const { pagination } = result;

    const itemsSource = getItemsSource(state);
    const items = createList(itemsSource, state);
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

    toggleSelectItem: (state, itemId) => ({
        ...state,
        items: state.items.map(reduceToggleItem(itemId)),
    }),

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
        pagination: {
            ...state.pagination,
            page: 1,
            range: 1,
        },
    }),

    showMore: (state) => updateList({
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

    startLoading: (state, isLoadingMore = false) => (
        (state.loading)
            ? state
            : { ...state, isLoadingMore, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading)
            ? { ...state, loading: false, isLoadingMore: false }
            : state
    ),

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

    listRequestLoaded: (state, { upcoming, keepState }) => updateList({
        ...state,
        upcomingItems: (upcoming) ? upcoming.map(upcomingId) : state.upcomingItems,
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),

    upcomingItemsLoaded: (state, items) => updateList({
        ...state,
        upcomingItems: items.map(upcomingId),
    }),
});

export const { actions, reducer } = slice;
