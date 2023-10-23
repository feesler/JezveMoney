import { App } from '../../Application/App.js';

export const ANY_TYPE = 0;

/** Returns categories sort setting value */
export const getCategoriesSortMode = () => (
    App.model.profile.settings.sort_categories
);

export const getListRequest = () => ({});

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        categories: getListRequest(),
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.categories?.data
);
