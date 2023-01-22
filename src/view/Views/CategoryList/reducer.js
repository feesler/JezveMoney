import { Category } from '../../js/model/Category.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { createSlice } from '../../js/store.js';

/** Prepare data from categories list model for list component */
export const createItemsFromModel = () => {
    const { categories } = window.app.model;
    const res = CategoryList.create(categories);
    res.sortByParent();
    return res;
};

// Reducers
const reduceDeselectAll = (state) => ({
    ...state,
    items: state.items.map((item) => (
        (item.selected)
            ? { ...item, selected: false }
            : item
    )),
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

    showContextMenu: (state, itemId) => (
        (state.contextItem === itemId)
            ? state
            : { ...state, contextItem: itemId }
    ),

    toggleSelectItem: (state, itemId) => {
        const category = window.app.model.categories.getItem(itemId);
        if (!category) {
            return state;
        }

        return {
            ...state,
            items: state.items.map((item) => (
                (item.id === itemId)
                    ? { ...item, selected: !item.selected }
                    : item
            )),
        };
    },

    selectAllItems: (state) => ({
        ...state,
        items: state.items.map((item) => (
            (item.selected)
                ? item
                : { ...item, selected: true }
        )),
    }),

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
        items: createItemsFromModel(),
        listMode: 'list',
        contextItem: null,
    }),
});

export const { actions, reducer } = slice;
