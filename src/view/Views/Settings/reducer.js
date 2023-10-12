import { createSlice } from 'jezvejs/Store';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../utils/utils.js';
import { App } from '../../Application/App.js';

/** Prepare data from currencies list model for list component */
export const createItemsFromModel = () => {
    const { userCurrencies } = App.model;
    const items = userCurrencies.map((item) => ({ ...item }));
    return items;
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    userCurrencies: state.userCurrencies.map(reduceDeselectItem),
});

const slice = createSlice({
    changeTab: (state, action) => (
        (state.action === action) ? state : { ...state, action, showMenu: false }
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
        userCurrencies: state.userCurrencies.map(reduceToggleItem(itemId)),
    }),

    selectAllItems: (state) => ({
        ...state,
        userCurrencies: state.userCurrencies.map(reduceSelectItem),
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

    setDateRenderTime: (state) => ({
        ...state,
        dateRenderTime: Date.now(),
    }),

    listRequestLoaded: (state, keepState) => ({
        ...state,
        userCurrencies: createItemsFromModel(),
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),

    changeDateLocale: (state, dateLocale) => ({
        ...state,
        dateLocale,
    }),

    changeDecimalLocale: (state, decimalLocale) => ({
        ...state,
        decimalLocale,
    }),
});

export const { actions, reducer } = slice;
