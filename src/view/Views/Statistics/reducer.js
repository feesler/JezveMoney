import { asArray } from 'jezvejs';
import { createSlice } from '../../js/store.js';

const groupTypes = [null, 'day', 'week', 'month', 'year'];

// Utils
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

export const getGroupTypeByName = (name) => {
    const groupName = (name) ? name.toLowerCase() : null;
    return groupTypes.indexOf(groupName);
};

// Reducers
const slice = createSlice({
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

    changeTypeFilter: (state, type) => (
        (state.filter.type === type)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    type,
                },
            }
    ),

    changeReportType: (state, report) => (
        (state.form.report === report)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    report,
                },
            }
    ),

    changeAccountsFilter: (state, ids) => {
        const accounts = asArray(ids);
        const account = window.app.model.userAccounts.getItem(accounts[0]);
        return {
            ...state,
            form: {
                ...state.form,
                acc_id: accounts,
            },
            accountCurrency: account?.curr_id ?? 0,
        };
    },

    changeCategoriesFilter: (state, ids) => {
        const categories = asArray(ids);
        return {
            ...state,
            form: {
                ...state.form,
                category_id: categories,
            },
        };
    },

    changeCurrencyFilter: (state, currencyId) => (
        (state.form.curr_id === currencyId)
            ? state
            : {
                ...state,
                form: {
                    ...state.form,
                    curr_id: currencyId,
                },
            }
    ),

    changeDateFilter: (state, data) => ({
        ...state,
        form: {
            ...state.form,
            ...data,
        },
    }),

    changeGroupType: (state, value) => {
        if (state.form.group === value) {
            return state;
        }

        const form = { ...state.form };
        const groupId = parseInt(value, 10);
        const group = (groupId < groupTypes.length) ? groupTypes[groupId] : null;
        if (group) {
            form.group = group;
        } else if ('group' in form) {
            delete form.group;
        }

        return { ...state, form };
    },

    dataRequestLoaded: (state, data) => ({
        ...state,
        chartData: { ...data.histogram },
        filter: { ...data.filter },
        form: { ...data.filter },
        renderTime: Date.now(),
    }),

    dataRequestError: (state) => ({
        ...state,
        form: { ...state.filter },
    }),
});

export const { actions, reducer } = slice;
