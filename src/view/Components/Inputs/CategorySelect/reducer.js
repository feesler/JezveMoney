import { createSlice } from 'jezvejs/Store';

// Reducers
const slice = createSlice({
    setTrasactionType: (state, transactionType) => ({ ...state, transactionType }),
});

export const { actions, reducer } = slice;
