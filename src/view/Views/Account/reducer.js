import { createSlice } from '../../js/store.js';
import { normalize } from '../../js/utils.js';

// Reducers
const slice = createSlice({
    changeIcon: (state, iconId) => ({
        ...state,
        data: {
            ...state.data,
            icon_id: iconId,
        },
    }),

    changeCurrency: (state, currencyId) => ({
        ...state,
        data: {
            ...state.data,
            curr_id: currencyId,
        },
    }),

    changeInitialBalance: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            initbalance: true,
            valid: true,
        },
        data: {
            ...state.data,
            initbalance: value,
            fInitBalance: normalize(value),
        },
    }),

    changeName: (state, value) => ({
        ...state,
        nameChanged: true,
        validation: {
            ...state.validation,
            name: true,
            valid: true,
        },
        data: {
            ...state.data,
            name: value,
        },
    }),

    invalidateNameField: (state, message) => ({
        ...state,
        validation: {
            ...state.validation,
            name: message,
            valid: false,
        },
    }),

    invalidateInitialBalanceField: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            initbalance: false,
            valid: false,
        },
    }),

    startSubmit: (state) => ({
        ...state,
        submitStarted: true,
    }),

    cancelSubmit: (state) => ({
        ...state,
        submitStarted: false,
    }),
});

export const { actions, reducer } = slice;
