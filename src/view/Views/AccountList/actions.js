import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
    getHideableContextIds,
} from '../../utils/utils.js';

import {
    getAccountsSortMode,
    getListDataFromResponse,
    prepareRequest,
} from './helpers.js';
import { actions } from './reducer.js';

export const requestSortMode = (sortMode) => async ({ dispatch }) => {
    const { settings } = App.model.profile;
    if (settings.sort_accounts === sortMode) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        await API.profile.updateSettings({
            sort_accounts: sortMode,
        });
        settings.sort_accounts = sortMode;

        dispatch(actions.changeSortMode(sortMode));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
};

export const setListMode = (listMode) => ({ dispatch, getState }) => {
    dispatch(actions.changeListMode(listMode));

    const state = getState();
    if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
        dispatch(requestSortMode(SORT_MANUALLY));
    }
};

export const toggleSortByName = () => ({ dispatch }) => {
    const current = getAccountsSortMode();
    const sortMode = (current === SORT_BY_NAME_ASC)
        ? SORT_BY_NAME_DESC
        : SORT_BY_NAME_ASC;

    dispatch(requestSortMode(sortMode));
};

export const toggleSortByDate = () => ({ dispatch }) => {
    const current = getAccountsSortMode();
    const sortMode = (current === SORT_BY_CREATEDATE_ASC)
        ? SORT_BY_CREATEDATE_DESC
        : SORT_BY_CREATEDATE_ASC;

    dispatch(requestSortMode(sortMode));
};

export const setListData = ({ dispatch }, data, keepState = false) => {
    App.model.accounts.setData(data);
    App.model.userAccounts = null;
    App.checkUserAccountModels();

    dispatch(actions.listRequestLoaded(keepState));
};

export const showItems = (value = true) => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getHideableContextIds(state);
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids });
        const response = (value)
            ? await API.account.show(request)
            : await API.account.hide(request);

        const data = getListDataFromResponse(response);
        setListData({ dispatch, getState }, data);

        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
};

export const deleteItems = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getHideableContextIds(state);
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.hideDeleteConfirmDialog());
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids });
        const response = await API.account.del(request);

        const data = getListDataFromResponse(response);
        setListData({ dispatch, getState }, data);

        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
};

/**
 * Sent API request to server to change position of account
 * @param {number} id - identifier of item to change position
 * @param {number} pos - new position of item
 */
export const sendChangePosRequest = (id, pos) => async ({ dispatch, getState }) => {
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id, pos });
        const response = await API.account.setPos(request);

        const data = getListDataFromResponse(response);
        setListData({ dispatch, getState }, data, true);

        App.updateProfileFromResponse(response);
    } catch (e) {
        dispatch(actions.cancelPosChange());
        App.createErrorNotification(__('accounts.errors.changePos'));
    }

    dispatch(actions.stopLoading());
};

export const requestItem = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (!state.detailsId) {
        return;
    }

    try {
        const { data } = await API.account.read(state.detailsId);
        const [item] = data;

        dispatch(actions.itemDetailsLoaded(item));
    } catch (e) {
        App.createErrorNotification(e.message);
    }
};

export const showDetails = () => async ({ dispatch }) => {
    dispatch(actions.showDetails());
    dispatch(requestItem());
};
