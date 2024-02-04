import { createSlice } from 'jezvejs/Store';
import {
    getHideableContextIds,
    reduceDeselectItem,
    reduceSelectItem,
    reduceToggleItem,
} from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import { Person } from '../../Models/Person.js';
import { PersonListModel } from '../../Models/PersonListModel.js';

export const createList = (items, sortMode) => {
    const res = PersonListModel.create(items);
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

    showExportDialog: (state) => {
        const persons = getHideableContextIds(state);
        return (persons.length === 0)
            ? state
            : {
                ...state,
                showExportDialog: true,
                exportFilter: { persons },
                showMenu: false,
                showContextMenu: false,
                contextItem: null,
            };
    },

    hideExportDialog: (state) => ({
        ...state,
        showExportDialog: false,
        exportFilter: null,
    }),

    itemDetailsLoaded: (state, item) => (
        (state.detailsId !== item?.id)
            ? state
            : {
                ...state,
                detailsItem: new Person(item),
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

    toggleSelectItem: (state, itemId) => {
        const person = App.model.persons.getItem(itemId);
        if (!person) {
            return state;
        }

        const toggleItem = reduceToggleItem(itemId);

        const { visible, hidden } = state.items;
        return {
            ...state,
            items: {
                visible: (person.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!person.isVisible()) ? hidden.map(toggleItem) : hidden,
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
            : {
                ...state,
                items: {
                    visible: createList(state.items.visible, sortMode),
                    hidden: createList(state.items.hidden, sortMode),
                },
                sortMode,
            }
    ),

    cancelPosChange: (state) => ({ ...state }),

    showDeleteConfirmDialog: (state) => {
        if (state.showDeleteConfirmDialog) {
            return state;
        }

        const ids = getHideableContextIds(state);
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

    listRequestLoaded: (state, keepState) => ({
        ...state,
        items: {
            visible: createList(App.model.visiblePersons, state.sortMode),
            hidden: createList(App.model.hiddenPersons, state.sortMode),
        },
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
