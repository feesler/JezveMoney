import { App } from '../../Application/App.js';

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
    App.model.profile.settings.sort_accounts
);
