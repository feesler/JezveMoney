import { Person } from '../../js/model/Person.js';
import { PersonList } from '../../js/model/PersonList.js';
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

    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId)
            ? state
            : { ...state, contextItem: itemId }
    ),

    toggleSelectItem: (state, itemId) => {
        const person = window.app.model.persons.getItem(itemId);
        if (!person) {
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
                visible: (person.isVisible()) ? visible.map(toggleItem) : visible,
                hidden: (!person.isVisible()) ? hidden.map(toggleItem) : hidden,
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
            ? { ...state, loading: false }
            : state
    ),

    listRequestLoaded: (state) => ({
        ...state,
        items: {
            visible: PersonList.create(window.app.model.visiblePersons),
            hidden: PersonList.create(window.app.model.hiddenPersons),
        },
        listMode: 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
