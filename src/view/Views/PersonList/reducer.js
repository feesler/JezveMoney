import { createSlice } from 'jezvejs/Store';
import { Person } from '../../js/model/Person.js';
import { PersonList } from '../../js/model/PersonList.js';
import { reduceDeselectItem, reduceSelectItem, reduceToggleItem } from '../../js/utils.js';

export const createList = (items, sortMode) => {
    const res = PersonList.create(items);
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
                detailsItem: new Person(item),
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
        const person = window.app.model.persons.getItem(itemId);
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

    listRequestLoaded: (state, keepState) => ({
        ...state,
        items: {
            visible: createList(window.app.model.visiblePersons, state.sortMode),
            hidden: createList(window.app.model.hiddenPersons, state.sortMode),
        },
        listMode: (keepState) ? state.listMode : 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
