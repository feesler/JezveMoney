import { asArray } from 'jezvejs';

/** Returns URL to export transaction of selected accounts */
export const getExportURL = (selectedIds) => {
    const ids = asArray(selectedIds);
    const res = new URL(`${window.app.baseURL}transactions/export/`);
    ids.forEach((id) => {
        res.searchParams.append('accounts[]', id);
    });
    return res;
};

/** Returns array of selected visible accounts */
export const getVisibleSelectedItems = (state) => (
    state.items.visible.filter((item) => item.selected)
);

/** Returns array of selected hidden accounts */
export const getHiddenSelectedItems = (state) => (
    state.items.hidden.filter((item) => item.selected)
);

/** Returns array of ids of selected accounts */
export const getSelectedIds = (state) => {
    const selArr = getVisibleSelectedItems(state);
    const hiddenSelArr = getHiddenSelectedItems(state);
    return selArr.concat(hiddenSelArr).map((item) => item.id);
};

/** Returns accounts sort setting value */
export const getAccountsSortMode = () => (
    window.app.model.profile.settings.sort_accounts
);
