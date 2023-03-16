import { createSlice } from 'jezvejs/Store';

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
