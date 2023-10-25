import { App } from '../../../../../Application/App.js';
import { ImportRuleList } from '../../../../../Models/ImportRuleList.js';

/** Returns rules list according to current filters */
export const createList = (items, state) => {
    const filter = state?.filter ?? '';

    let res = (filter !== '')
        ? items.filter((rule) => rule.isMatchFilter(filter))
        : items;

    res = res.map((item) => (
        ('collapsed' in item) ? item : { ...item, collapsed: true }
    ));

    return ImportRuleList.create(res);
};

/** Updates rules list state */
export const updateList = (state) => {
    const { rules } = App.model;
    const { onPage, page } = state.pagination;

    const items = createList(rules, state);

    const pagesCount = Math.ceil(items.length / onPage);
    const pagination = {
        ...state.pagination,
        pagesCount,
        page: (pagesCount > 0) ? Math.min(pagesCount, page) : 1,
        total: items.length,
    };

    return {
        ...state,
        items,
        pagination,
    };
};

export const prepareRequest = (data) => ({
    ...data,
    returnState: {
        importrules: {},
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.importrules?.data
);
