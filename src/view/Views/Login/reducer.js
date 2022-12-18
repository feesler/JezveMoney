import { createSlice } from '../../js/store.js';

// Reducers
const slice = createSlice({
    changeLogin: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            login: true,
            valid: true,
        },
        form: {
            ...state.form,
            login: value,
        },
    }),

    changePassword: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            password: true,
            valid: true,
        },
        form: {
            ...state.form,
            password: value,
        },
    }),

    invalidateLoginField: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            login: false,
            valid: false,
        },
    }),

    invalidatePasswordField: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            password: false,
            valid: false,
        },
    }),

    setRememberUser: (state, value) => ({
        ...state,
        form: {
            ...state.form,
            remember: !!value,
        },
    }),
});

export const { actions, reducer } = slice;
