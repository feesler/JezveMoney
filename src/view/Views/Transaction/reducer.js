import { createSlice } from 'jezvejs/Store';

// Reducers
const slice = createSlice({
    startSubmit: (state) => ({ ...state, submitStarted: true }),
    cancelSubmit: (state) => ({ ...state, submitStarted: false }),
    changeTransaction: (state, transaction) => ({
        ...state,
        transaction: { ...transaction },
    }),
});

export const { actions, reducer } = slice;
