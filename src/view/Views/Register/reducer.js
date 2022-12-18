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

    changeName: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            name: true,
            valid: true,
        },
        form: {
            ...state.form,
            name: value,
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

    invalidateNameField: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            name: false,
            valid: false,
        },
    }),
});

export const { actions, reducer } = slice;
