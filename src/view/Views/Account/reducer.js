import { createSlice } from 'jezvejs/Store';
import { getCurrencyPrecision } from '../../utils/utils.js';
import { normalize } from '../../utils/decimal.js';

// Reducers
const slice = createSlice({
    changeType: (state, type) => ({
        ...state,
        data: {
            ...state.data,
            type,
        },
    }),

    changeIcon: (state, iconId) => ({
        ...state,
        data: {
            ...state.data,
            icon_id: iconId,
        },
    }),

    changeCurrency: (state, currencyId) => {
        const precision = getCurrencyPrecision(currencyId);

        const newState = {
            ...state,
            data: {
                ...state.data,
                curr_id: currencyId,
                fInitBalance: normalize(state.data.fInitBalance, precision),
                fInitLimit: normalize(state.data.fInitLimit, precision),
            },
        };

        if (state.data.fInitBalance !== newState.data.fInitBalance) {
            newState.data.initbalance = newState.data.fInitBalance;
        }

        if (state.data.fInitLimit !== newState.data.fInitLimit) {
            newState.data.initlimit = newState.data.fInitLimit;
        }

        return newState;
    },

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
            fInitBalance: normalize(
                value,
                getCurrencyPrecision(state.data.curr_id),
            ),
        },
    }),

    changeLimit: (state, value) => ({
        ...state,
        validation: {
            ...state.validation,
            initlimit: true,
            valid: true,
        },
        data: {
            ...state.data,
            initlimit: value,
            fInitLimit: normalize(
                value,
                getCurrencyPrecision(state.data.curr_id),
            ),
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

    invalidateLimitField: (state) => ({
        ...state,
        validation: {
            ...state.validation,
            initlimit: false,
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
