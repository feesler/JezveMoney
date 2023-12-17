import { createSlice } from 'jezvejs/Store';

// Reducers
const slice = createSlice({
    toggleGroup: (state, id) => ({
        ...state,
        items: state.items.map((item) => (
            (item.type === 'group')
                ? { ...item, expanded: item.id.toString() === id }
                : item
        )),
    }),
});

export const { actions, reducer } = slice;
