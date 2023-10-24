import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import { getSeconds } from '../../utils/utils.js';

import { getImportedItemsDateRange } from './helpers.js';
import { actions } from './reducer.js';

/**
 * Sends API request to obtain transactions similar to imported.
 * Compares list of import items with transactions already in DB
 *  and disable import item if same(similar) transaction found
 */
export const requestSimilar = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (
        !state.checkSimilarEnabled
        || !state.items.some((item) => item.originalData)
    ) {
        dispatch(actions.setRenderTime());
        return;
    }

    dispatch(actions.startLoading());

    try {
        const range = getImportedItemsDateRange(state);
        const result = await API.transaction.list({
            onPage: 0,
            startDate: getSeconds(range.start),
            endDate: getSeconds(range.end),
            accounts: state.mainAccount.id,
        });

        dispatch(actions.similarTransactionsLoaded(result.data.items));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const toggleCheckSimilar = () => ({ dispatch, getState }) => {
    dispatch(actions.toggleCheckSimilar());

    const state = getState();
    if (state.checkSimilarEnabled) {
        dispatch(requestSimilar());
    } else {
        dispatch(actions.disableFindSimilar());
        dispatch(actions.setRenderTime());
    }
};

export const toggleEnableRules = () => ({ dispatch }) => {
    dispatch(actions.toggleEnableRules());
    dispatch(actions.setRenderTime());
};

export const toggleCheckReminders = () => ({ dispatch }) => {
    dispatch(actions.toggleCheckReminders());
    dispatch(actions.setRenderTime());
};

export const deleteSelected = () => ({ dispatch, getState }) => {
    const state = getState();
    if (state.listMode !== 'select') {
        return;
    }

    dispatch(actions.deleteSelectedItems());
    dispatch(actions.setRenderTime());
};

export const deleteAll = () => ({ dispatch }) => {
    dispatch(actions.deleteAllItems());
    dispatch(actions.setRenderTime());
};
