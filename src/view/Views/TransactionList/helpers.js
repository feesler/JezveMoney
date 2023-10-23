import { App } from '../../Application/App.js';

/** Returns true if specified arrays contains same set of values */
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

/** Returns transactions group by date setting value */
export const getTransactionsGroupByDate = () => (
    App.model.profile.settings.tr_group_by_date
);

export const getListRequest = (state) => ({
    ...state.form,
    order: 'desc',
    page: state.pagination.page,
    range: state.pagination.range,
});

export const prepareRequest = (data, state) => ({
    ...data,
    returnState: {
        transactions: getListRequest(state),
        profile: {},
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.transactions
);
