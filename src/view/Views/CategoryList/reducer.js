import { Category } from '../../js/model/Category.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { createSlice } from '../../js/store.js';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../js/utils.js';

/** Prepare data from categories list model for list component */
export const createItemsFromModel = () => {
    const { categories } = window.app.model;
    return CategoryList.create(categories);
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: state.items.map(reduceDeselectItem),
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
                detailsItem: new Category(item),
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

    changeSortMode: (state, sortMode) => (
        (state.sortMode === sortMode)
            ? state
            : { ...state, sortMode }
    ),

    listRequestLoaded: (state, keepState) => ({
        ...state,
        items: createItemsFromModel(),
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
