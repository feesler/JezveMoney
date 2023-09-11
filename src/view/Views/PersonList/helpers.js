import { App } from '../../Application/App.js';

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
    App.model.profile.settings.sort_persons
);
