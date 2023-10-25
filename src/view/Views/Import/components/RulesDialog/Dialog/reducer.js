import { createSlice } from 'jezvejs/Store';

import { App } from '../../../../../Application/App.js';

import { ImportRule } from '../../../../../Models/ImportRule.js';
import { ImportCondition } from '../../../../../Models/ImportCondition.js';

import { updateList } from './helpers.js';

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
    showDeleteConfirmDialog: false,
    contextItem: null,
    renderTime: Date.now(),
});

// Reducers
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

    duplicateRule: (state) => {
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
        delete rule.id;

        return {
            ...state,
            id: CREATE_STATE,
            rule: new ImportRule(rule),
        };
    },

    showDeleteConfirmDialog: (state) => {
        if (state.showDeleteConfirmDialog) {
            return state;
        }

        const item = App.model.rules.getItem(state.contextItem);
        if (!item) {
            return state;
        }

        return {
            ...state,
            showDeleteConfirmDialog: true,
        };
    },

    hideDeleteConfirmDialog: (state) => (
        (state.showDeleteConfirmDialog)
            ? { ...state, showDeleteConfirmDialog: false }
            : state
    ),
});

export const { actions, reducer } = slice;
