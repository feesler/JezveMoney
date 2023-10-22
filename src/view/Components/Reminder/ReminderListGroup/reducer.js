import { createSlice } from 'jezvejs/Store';
import {
    dateStringToTime,
    reduceDeselectItem,
    reduceSelectItem,
    reduceToggleItem,
    formatDateRange,
} from '../../../utils/utils.js';
import { App } from '../../../Application/App.js';
import { ScheduledTransaction } from '../../../Models/ScheduledTransaction.js';
import { ReminderList } from '../../../Models/ReminderList.js';
import { REMINDER_SCHEDULED, REMINDER_UPCOMING } from '../../../Models/Reminder.js';

/** Returns initial state object */
export const getInitialState = (props = {}) => ({
    listMode: 'list',
    ...props,
    form: {
        ...(props?.filter ?? {}),
        ...formatDateRange(props?.filter ?? {}),
    },
    upcomingItems: null,
    loading: false,
    isLoadingMore: false,
    renderTime: null,
});

export const getStateFilter = (state) => (
    state?.filter?.reminderState ?? REMINDER_SCHEDULED
);

export const getItemsSource = (state) => (
    (getStateFilter(state) === REMINDER_UPCOMING)
        ? (state.upcomingItems ?? [])
        : App.model.reminders
);

export const createList = (items, state) => {
    const stateFilter = getStateFilter(state);
    const { startDate, endDate } = state.filter;

    const res = items.filter((item) => (
        stateFilter === item?.state
        && (!startDate || item.date >= startDate)
        && (!endDate || item.date <= endDate)
    ));

    return res;
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

export const updateList = (state, options = {}) => {
    const keepSelection = options.keepState && state.listMode === 'select';
    const selectedBefore = (keepSelection)
        ? state.items.filter((item) => item.selected).map((item) => item.id)
        : [];

    const result = state;
    const stateFilter = getStateFilter(result);
    const { pagination } = result;

    const itemsSource = getItemsSource(state);
    let items = createList(itemsSource, state);
    if (keepSelection) {
        items = items.map((item) => ({
            ...item,
            selected: selectedBefore.includes(item.id),
        }));
    }

    const list = ReminderList.create(items);
    if (stateFilter === REMINDER_UPCOMING) {
        list.sortByDateAsc();
    }
    result.items = list;

    if (stateFilter !== REMINDER_UPCOMING) {
        pagination.pagesCount = Math.ceil(items.length / pagination.onPage);
    }

    pagination.page = (pagination.pagesCount > 0)
        ? Math.min(pagination.pagesCount, pagination.page)
        : 1;
    pagination.total = items.length;

    return result;
};

const slice = createSlice({
    update: (state) => updateList({ ...state }),

    reset: (_, props) => updateList(getInitialState(props)),

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

    changeStateFilter: (state, reminderState) => updateList({
        ...state,
        form: {
            ...state.form,
            reminderState,
        },
        filter: {
            ...state.filter,
            reminderState,
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
    }, { keepState: true }),

    changePage: (state, page) => ({
        ...state,
        pagination: {
            ...state.pagination,
            page,
            range: 1,
        },
    }),

    changeDateFilter: (state, data) => updateList({
        ...state,
        form: {
            ...state.form,
            ...data,
        },
        filter: {
            ...state.filter,
            startDate: dateStringToTime(data.startDate, { fixShortYear: false }),
            endDate: dateStringToTime(data.endDate, { fixShortYear: false }),
        },
    }),

    clearAllFilters: (state) => updateList({
        ...state,
        form: {
            ...state.form,
            startDate: null,
            endDate: null,
        },
        filter: {
            ...state.filter,
            startDate: null,
            endDate: null,
        },
        pagination: {
            ...state.pagination,
            page: 1,
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

    listRequestLoaded: (state, { upcoming, keepState }) => {
        const isUpcoming = getStateFilter(state) === REMINDER_UPCOMING;

        return updateList({
            ...state,
            pagination: (isUpcoming && upcoming?.pagination)
                ? { ...upcoming.pagination }
                : state.pagination,
            filter: (isUpcoming && upcoming?.filter)
                ? { ...state.filter, ...upcoming.filter }
                : state.filter,
            upcomingItems: (isUpcoming && Array.isArray(upcoming?.items))
                ? upcoming.items.map(upcomingId)
                : state.upcomingItems,
            listMode: (keepState) ? state.listMode : 'list',
            contextItem: null,
        });
    },
});

export const { actions, reducer } = slice;
