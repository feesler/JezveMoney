import { createSlice } from 'jezvejs/Store';

import { App } from '../../../../../Application/App.js';
import { ImportRuleList } from '../../../../../Models/ImportRuleList.js';
import { ImportRule } from '../../../../../Models/ImportRule.js';
import { ImportCondition } from '../../../../../Models/ImportCondition.js';

/* Dialogs states */
export const LIST_STATE = 1;
export const CREATE_STATE = 2;
export const UPDATE_STATE = 3;
/* Other */
const SHOW_ON_PAGE = 20;

/** Returns initial state object */
export const getInitialState = () => ({
    id: LIST_STATE,
    listLoading: false,
    filter: '',
    items: [],
    pagination: {
        onPage: SHOW_ON_PAGE,
        page: 1,
        range: 1,
        pagesCount: 0,
        total: 0,
    },
    showContextMenu: false,
    contextItem: null,
    renderTime: Date.now(),
});

/** Returns absolute index for relative index on current page */
export const getAbsoluteIndex = (index, state) => {
    if (index === -1) {
        return index;
    }

    const { pagination } = state;
    if (!pagination) {
        return index;
    }

    const firstItemIndex = (pagination.page - 1) * pagination.onPage;
    return firstItemIndex + index;
};

/** Returns rules list according to current filters */
export const createList = (items, state) => {
    const filter = state?.filter ?? '';

    let res = (filter !== '')
        ? items.filter((rule) => rule.isMatchFilter(filter))
        : items;

    res = res.map((item) => (
        ('collapsed' in item) ? item : { ...item, collapsed: true }
    ));

    return ImportRuleList.create(res);
};

// Reducers

/** Updates rules list state */
export const updateList = (state) => {
    const { rules } = App.model;
    const { onPage, page } = state.pagination;

    const items = createList(rules.data, state);

    const pagesCount = Math.ceil(items.length / onPage);
    const pagination = {
        ...state.pagination,
        pagesCount,
        page: (pagesCount > 0) ? Math.min(pagesCount, page) : 1,
        total: items.length,
    };

    return {
        ...state,
        items,
        pagination,
    };
};

const slice = createSlice({
    reset: () => updateList(getInitialState()),

    showContextMenu: (state, contextItem) => (
        (state.contextItem === contextItem && state.showContextMenu)
            ? state
            : { ...state, contextItem, showContextMenu: true }
    ),

    hideContextMenu: (state) => (
        (state.showContextMenu) ? { ...state, showContextMenu: false } : state
    ),

    toggleCollapseItem: (state, itemId) => ({
        ...state,
        items: state.items.map((item) => (
            (item.id === itemId)
                ? { ...item, collapsed: !item.collapsed }
                : item
        )),
    }),

    startLoading: (state) => (
        (state.listLoading)
            ? state
            : { ...state, listLoading: true }
    ),

    stopLoading: (state) => (
        (state.listLoading)
            ? { ...state, listLoading: false, renderTime: Date.now() }
            : state
    ),

    changeSearchQuery: (state, filter) => (
        (state.filter.toLowerCase() === filter.toLowerCase())
            ? state
            : updateList({
                ...state,
                filter,
                pagination: {
                    ...state.pagination,
                    page: (filter.length === 0) ? 1 : state.pagination.page,
                },
            })
    ),

    changePage: (state, page) => ({
        ...state,
        contextItem: null,
        pagination: {
            ...state.pagination,
            page,
            range: 1,
        },
    }),

    showMore: (state) => ({
        ...state,
        contextItem: null,
        pagination: {
            ...state.pagination,
            range: state.pagination.range + 1,
        },
    }),

    listRequestLoaded: (state) => updateList({
        ...state,
        id: LIST_STATE,
        contextItem: null,
        rule: null,
    }),

    createRule: (state) => ({
        ...state,
        id: CREATE_STATE,
        rule: new ImportRule({
            flags: 0,
            conditions: [],
            actions: [],
        }),
    }),

    updateRule: (state) => {
        const item = App.model.rules.getItem(state.contextItem);
        if (!item) {
            return state;
        }

        const rule = {
            ...item,
            conditions: item.conditions.map((condition) => (
                (ImportCondition.isDateField(condition.field_id))
                    ? {
                        ...condition,
                        value: App.formatDate(condition.value),
                    }
                    : condition
            )),
        };

        return {
            ...state,
            id: UPDATE_STATE,
            rule: new ImportRule(rule),
        };
    },
});

export const { actions, reducer } = slice;
