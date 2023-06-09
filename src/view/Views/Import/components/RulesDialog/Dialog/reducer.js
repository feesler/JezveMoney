import { createSlice } from 'jezvejs/Store';

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
        pagesCount: 0,
        total: 0,
    },
    showContextMenu: false,
    contextItem: null,
    renderTime: Date.now(),
});

/** Returns rules list according to current filters */
export const createList = (items, state) => {
    const filter = state?.filter ?? '';

    const res = (filter !== '')
        ? items.filter((rule) => rule.isMatchFilter(filter))
        : items;

    return ImportRuleList.create(res);
};

// Reducers

/** Updates rules list state */
export const updateList = (state) => {
    const { rules } = window.app.model;
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

    changePage: (state, page) => (
        (state.pagination.page === page)
            ? state
            : {
                ...state,
                pagination: {
                    ...state.pagination,
                    page,
                },
            }
    ),

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
        const item = window.app.model.rules.getItem(state.contextItem);
        if (!item) {
            return state;
        }

        const rule = {
            ...item,
            conditions: item.conditions.map((condition) => (
                (ImportCondition.isDateField(condition.field_id))
                    ? {
                        ...condition,
                        value: window.app.formatDate(condition.value),
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
