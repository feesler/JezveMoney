import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import { getTransactionListContextIds } from './helpers.js';
import { actions } from './reducer.js';

/** Sends /state/main API request */
export const requestState = () => async ({ dispatch }) => {
    dispatch(actions.startLoading());

    try {
        const result = await API.state.main();
        const { accounts, persons, profile } = result.data;

        App.updateProfile(profile);

        App.model.accounts.setData(accounts.data);
        App.model.userAccounts = null;
        App.checkUserAccountModels();

        App.model.persons.setData(persons.data);
        App.model.visiblePersons = null;
        App.checkPersonModels();

        dispatch(actions.listRequestLoaded(result.data));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const deleteItems = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getTransactionListContextIds(state);
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.hideDeleteConfirmDialog());
    dispatch(actions.startLoading());

    try {
        const request = { id: ids };
        await API.transaction.del(request);
        dispatch(requestState());
    } catch (e) {
        App.createErrorNotification(e.message);
        dispatch(actions.stopLoading());
        dispatch(actions.setRenderTime());
    }
};

/** Send API request to change category of selected transactions */
export const setItemsCategory = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const { ids, categoryId } = state.categoryDialog;
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.closeCategoryDialog());
    dispatch(actions.startLoading());

    try {
        const request = { id: ids, category_id: categoryId };
        await API.transaction.setCategory(request);
        dispatch(requestState());
    } catch (e) {
        App.createErrorNotification(e.message);
        dispatch(actions.stopLoading());
        dispatch(actions.setRenderTime());
    }
};
