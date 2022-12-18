import { createSlice } from '../../js/store.js';

// Reducers
const slice = createSlice({
    changeUserName: (state, userName) => ({
        ...state,
        userName,
    }),

    changeAction: (state, action) => ({
        ...state,
        action,
    }),
});

export const { actions, reducer } = slice;
