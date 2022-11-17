import { AccountList } from '../../js/model/AccountList.js';
import { createSlice } from '../../js/store.js';

// Reducers
const deselectItem = (item) => (
    (item.selected)
        ? { ...item, selected: false }
        : item
);

const reduceDeselectAll = (state) => ({
    ...state,
    items: {
        visible: state.items.visible.map(deselectItem),
        hidden: state.items.hidden.map(deselectItem),
    },
});

const slice = createSlice({
    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId)
            ? state
            : { ...state, contextItem: itemId }
    ),

    toggleSelectItem: (state, itemId) => {
        const account = window.app.model.userAccounts.getItem(itemId);
        if (!account) {
            return state;
        }

        const toggleItem = (item) => (
            (item.id === itemId)
                ? { ...item, selected: !item.selected }
                : item
        );

        const { visible, hidden } = state.items;
        return {
            ...state,
            items: {
                visible: (account.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!account.isVisible()) ? hidden.map(toggleItem) : hidden,
            },
        };
    },

    selectAllItems: (state) => {
        const selectItem = (item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        );

        return {
            ...state,
            items: {
                visible: state.items.visible.map(selectItem),
                hidden: state.items.hidden.map(selectItem),
            },
        };
    },

    deselectAllItems: (state) => reduceDeselectAll(state),

    toggleSelectMode: (state) => {
        const newState = {
            ...state,
            listMode: (state.listMode === 'list') ? 'select' : 'list',
            contextItem: null,
        };
        return (newState.listMode === 'list')
            ? reduceDeselectAll(newState)
            : newState;
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

    listRequestLoaded: (state) => ({
        ...state,
        items: {
            visible: AccountList.create(window.app.model.visibleUserAccounts),
            hidden: AccountList.create(window.app.model.hiddenUserAccounts),
        },
        listMode: 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
