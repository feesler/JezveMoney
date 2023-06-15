import { asArray } from 'jezvejs';

/** Returns URL to export transaction of selected persons */
export const getExportURL = (selectedIds) => {
    const ids = asArray(selectedIds);
    const res = new URL(`${window.app.baseURL}transactions/export/`);
    ids.forEach((id) => {
        res.searchParams.append('persons[]', id);
    });
    return res;
};

/** Returns array of selected visible persons */
export const getVisibleSelectedItems = (state) => (
    state.items.visible.filter((item) => item.selected)
);

/** Returns array of selected hidden persons */
export const getHiddenSelectedItems = (state) => (
    state.items.hidden.filter((item) => item.selected)
);

/** Returns array of ids of selected persons */
export const getSelectedIds = (state) => {
    const selArr = getVisibleSelectedItems(state);
    const hiddenSelArr = getHiddenSelectedItems(state);
    return selArr.concat(hiddenSelArr).map((item) => item.id);
};

/** Returns persons sort setting value */
export const getPersonsSortMode = () => (
    window.app.model.profile.settings.sort_persons
);
