/** Returns true if specified arrays contains same set of values */
export const isSameSelection = (a, b) => (
    a.length === b.length && a.every((id) => b.includes(id))
);

/** Returns transactions group by date setting value */
export const getTransactionsGroupByDate = () => (
    window.app.model.profile.settings.tr_group_by_date
);

/** Returns transaction list view URL */
export const getBaseFilterURL = (path, filter) => {
    const res = new URL(`${window.app.baseURL}${path}`);

    Object.keys(filter).forEach((prop) => {
        const value = filter[prop];
        if (Array.isArray(value)) {
            const arrProp = `${prop}[]`;
            value.forEach((item) => res.searchParams.append(arrProp, item));
        } else {
            res.searchParams.set(prop, value);
        }
    });

    return res;
};

/** Returns export transactions URL */
export const getExportURL = (state) => (
    getBaseFilterURL('transactions/export/', state.filter)
);
