import { createSlice } from 'jezvejs/Store';
import { Account } from '../../Models/Account.js';
import { AccountList } from '../../Models/AccountList.js';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../utils/utils.js';

export const createList = (items, sortMode) => {
    const res = AccountList.create(items);
    res.sortBy(sortMode);
    return res;
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: {
        visible: state.items.visible.map(reduceDeselectItem),
        hidden: state.items.hidden.map(reduceDeselectItem),
    },
});

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
                detailsItem: new Account(item),
            }
    ),

    showMenu: (state) => (
        (state.showMenu) ? state : { ...state, showMenu: true }
    ),

    hideMenu: (state) => (
        (!state.showMenu) ? state : { ...state, showMenu: false }
    ),

    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId && state.showContextMenu)
            ? state
            : { ...state, contextItem: itemId, showContextMenu: true }
    ),

    hideContextMenu: (state) => (
        (state.showContextMenu) ? { ...state, showContextMenu: false } : state
    ),

    toggleSelectItem: (state, itemId) => {
        const account = window.app.model.userAccounts.getItem(itemId);
        if (!account) {
            return state;
        }

        const toggleItem = reduceToggleItem(itemId);

        const { visible, hidden } = state.items;
        return {
            ...state,
            items: {
                visible: (account.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!account.isVisible()) ? hidden.map(toggleItem) : hidden,
            },
        };
    },

    selectAllItems: (state) => ({
        ...state,
        items: {
            visible: state.items.visible.map(reduceSelectItem),
            hidden: state.items.hidden.map(reduceSelectItem),
        },
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
            showContextMenu: false,
        };

        return (listMode === 'list') ? reduceDeselectAll(newState) : newState;
    },

    startLoading: (state) => (
        (state.loading)
            ? state
            : { ...state, loading: true }
    ),

    stopLoading: (state) => (
        (state.loading)
            ? { ...state, loading: false, renderTime: Date.now() }
            : state
    ),

    changeSortMode: (state, sortMode) => (
        (state.sortMode === sortMode)
            ? state
            : {
                ...state,
                items: {
                    visible: createList(state.items.visible, sortMode),
                    hidden: createList(state.items.hidden, sortMode),
                },
                sortMode,
            }
    ),

    listRequestLoaded: (state, keepState) => ({
        ...state,
        items: {
            visible: createList(window.app.model.visibleUserAccounts, state.sortMode),
            hidden: createList(window.app.model.hiddenUserAccounts, state.sortMode),
        },
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
