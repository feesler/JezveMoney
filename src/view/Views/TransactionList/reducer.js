// Action types
const SHOW_CONTEXT_MENU = 'showContextMenu';
const TOGGLE_SELECT_ITEM = 'toggleSelectItem';
const SELECT_ALL_ITEMS = 'selectAllItems';
const DESELECT_ALL_ITEMS = 'deselectAllItems';
const CHANGE_LIST_MODE = 'changeListMode';
const START_LOADING = 'startLoading';
const STOP_LOADING = 'stopLoading';
const CLEAR_ALL_FILTERS = 'clearAllFilters';
const CHANGE_TYPE_FILTER = 'changeTypeFilter';
const CHANGE_ACCOUNTS_FILTER = 'changeAccountsFilter';
const CHANGE_PERSONS_FILTER = 'changePersonsFilter';
const CHANGE_SEARCH_QUERY = 'changeSearchQuery';
const CHANGE_DATE_FILTER = 'changeDateFilter';
const CHANGE_MODE = 'changeMode';
const LIST_REQUEST_LOADED = 'listRequestLoaded';
const LIST_REQUEST_ERROR = 'listRequestError';

// Action creators
export const showContextMenu = (itemId) => ({ type: SHOW_CONTEXT_MENU, payload: itemId });
export const toggleSelectItem = (itemId) => ({ type: TOGGLE_SELECT_ITEM, payload: itemId });
export const selectAllItems = () => ({ type: SELECT_ALL_ITEMS });
export const deselectAllItems = () => ({ type: DESELECT_ALL_ITEMS });
export const changeListMode = (value) => ({ type: CHANGE_LIST_MODE, payload: value });
export const startLoading = () => ({ type: START_LOADING });
export const stopLoading = () => ({ type: STOP_LOADING });
export const clearAllFilters = () => ({ type: CLEAR_ALL_FILTERS });
export const changeTypeFilter = (value) => ({ type: CHANGE_TYPE_FILTER, payload: value });
export const changeAccountsFilter = (value) => ({ type: CHANGE_ACCOUNTS_FILTER, payload: value });
export const changePersonsFilter = (value) => ({ type: CHANGE_PERSONS_FILTER, payload: value });
export const changeSearchQuery = (value) => ({ type: CHANGE_SEARCH_QUERY, payload: value });
export const changeDateFilter = (value) => ({ type: CHANGE_DATE_FILTER, payload: value });
export const changeMode = (value) => ({ type: CHANGE_MODE, payload: value });
export const listRequestLoaded = (value) => ({ type: LIST_REQUEST_LOADED, payload: value });
export const listRequestError = () => ({ type: LIST_REQUEST_ERROR });

// Utils
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

// Reducers
const reduceShowContextMenu = (state, itemId) => (
    (state.contextItem === itemId)
        ? state
        : { ...state, contextItem: itemId }
);

const reduceToggleSelectItem = (state, itemId) => ({
    ...state,
    items: state.items.map((item) => (
        (item.id === itemId)
            ? { ...item, selected: !item.selected }
            : item
    )),
});

const reduceSelectAllItems = (state) => ({
    ...state,
    items: state.items.map((item) => (
        (item.selected)
            ? item
            : { ...item, selected: true }
    )),
});

const reduceDeselectAllItems = (state) => ({
    ...state,
    items: state.items.map((item) => (
        (item.selected)
            ? { ...item, selected: false }
            : item
    )),
});

const reduceChangeListMode = (state, listMode) => {
    if (state.listMode === listMode) {
        return state;
    }

    const newState = {
        ...state,
        listMode,
        contextItem: null,
    };

    return (listMode === 'list') ? reduceDeselectAllItems(newState) : newState;
};

const reduceStartLoading = (state) => (
    (state.loading) ? state : { ...state, loading: true }
);

const reduceStopLoading = (state) => (
    (state.loading) ? { ...state, loading: false } : state
);

const reduceClearAllFilters = (state) => ({
    ...state,
    form: {},
    pagination: {
        ...state.pagination,
        page: 1,
    },
});

const reduceChangeTypeFilter = (state, type) => ({
    ...state,
    form: {
        ...state.form,
        type,
    },
});

const reduceChangeAccountsFilter = (state, accounts) => ({
    ...state,
    form: {
        ...state.form,
        acc_id: accounts,
    },
});

const reduceChangePersonsFilter = (state, persons) => ({
    ...state,
    form: {
        ...state.form,
        person_id: persons,
    },
});

const reduceChangeSearchQuery = (state, value) => {
    if (state.form.search === value) {
        return state;
    }

    const newState = {
        ...state,
        form: {
            ...state.form,
        },
        typingSearch: true,
    };

    if (value.length > 0) {
        newState.form.search = value;
    } else if ('search' in state.form) {
        delete newState.form.search;
    }

    return newState;
};

const reduceChangeDateFilter = (state, data) => ({
    ...state,
    form: {
        ...state.form,
        ...data,
    },
});

const reduceChangeMode = (state, mode) => (
    (state.mode === mode) ? state : { ...state, mode }
);

const reduceListRequestLoaded = (state, data) => ({
    ...state,
    items: [...data.items],
    pagination: { ...data.pagination },
    filter: { ...data.filter },
    form: { ...data.filter },
    listMode: 'list',
    contextItem: null,
    typingSearch: false,
});

const reduceListRequestError = (state) => ({
    ...state,
    form: { ...state.filter },
    typingSearch: false,
});

const reducerMap = {
    [SHOW_CONTEXT_MENU]: reduceShowContextMenu,
    [TOGGLE_SELECT_ITEM]: reduceToggleSelectItem,
    [SELECT_ALL_ITEMS]: reduceSelectAllItems,
    [DESELECT_ALL_ITEMS]: reduceDeselectAllItems,
    [CHANGE_LIST_MODE]: reduceChangeListMode,
    [START_LOADING]: reduceStartLoading,
    [STOP_LOADING]: reduceStopLoading,
    [CLEAR_ALL_FILTERS]: reduceClearAllFilters,
    [CHANGE_TYPE_FILTER]: reduceChangeTypeFilter,
    [CHANGE_ACCOUNTS_FILTER]: reduceChangeAccountsFilter,
    [CHANGE_PERSONS_FILTER]: reduceChangePersonsFilter,
    [CHANGE_SEARCH_QUERY]: reduceChangeSearchQuery,
    [CHANGE_DATE_FILTER]: reduceChangeDateFilter,
    [CHANGE_MODE]: reduceChangeMode,
    [LIST_REQUEST_LOADED]: reduceListRequestLoaded,
    [LIST_REQUEST_ERROR]: reduceListRequestError,
};

export const reducer = (state, action) => {
    if (!(action.type in reducerMap)) {
        throw new Error('Invalid action type');
    }

    const reduceFunc = reducerMap[action.type];
    return reduceFunc(state, action.payload);
};
