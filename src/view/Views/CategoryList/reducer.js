import { asArray } from 'jezvejs';
import { createSlice } from 'jezvejs/Store';

import {
    getContextIds,
    reduceDeselectItem,
    reduceSelectItem,
    reduceToggleItem,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { Category } from '../../Models/Category.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { availTransTypes } from '../../Models/Transaction.js';
import { ANY_TYPE } from './helpers.js';

/** Prepare data from categories list model for list component */
export const createItemsFromModel = () => {
    const { categories } = App.model;
    return CategoryList.create(categories);
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: CategoryList.create(state.items.map(reduceDeselectItem)),
});

export const selectAvailableType = (state) => {
    const types = [
        ...asArray(state.selectedType),
        ...Object.keys(availTransTypes).map((type) => parseInt(type, 10)),
        ANY_TYPE,
    ];

    const selectedType = types.find((type) => {
        const typeItems = state.items.findByType(type);
        return typeItems?.length > 0;
    }) ?? null;

    return (state.selectedType === selectedType)
        ? state
        : { ...state, selectedType };
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
                detailsItem: new Category(item),
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
        items: CategoryList.create(state.items.map(reduceToggleItem(itemId))),
    }),

    selectAllItems: (state) => ({
        ...state,
        items: CategoryList.create(state.items.map(reduceSelectItem)),
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
            showMenu: false,
        };

        return (listMode === 'list') ? reduceDeselectAll(newState) : newState;
    },

    setRenderTime: (state) => ({
        ...state,
        renderTime: Date.now(),
    }),

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

    selectType: (state, selectedType) => (
        (state.selectedType === selectedType)
            ? state
            : selectAvailableType({
                ...state,
                selectedType,
                contextItem: null,
                showContextMenu: false,
                showMenu: false,
            })
    ),

    changeSortMode: (state, sortMode) => (
        (state.sortMode === sortMode)
            ? state
            : { ...state, sortMode }
    ),

    cancelPosChange: (state) => ({ ...state }),

    showDeleteConfirmDialog: (state) => {
        if (state.showDeleteConfirmDialog) {
            return state;
        }

        const ids = getContextIds(state);
        if (ids.length === 0) {
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

    listRequestLoaded: (state, keepState) => selectAvailableType({
        ...state,
        items: createItemsFromModel(),
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
