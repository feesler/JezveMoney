import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import {
    SORT_BY_CREATEDATE_ASC,
    SORT_BY_CREATEDATE_DESC,
    SORT_BY_NAME_ASC,
    SORT_BY_NAME_DESC,
    SORT_MANUALLY,
    __,
    getContextIds,
} from '../../utils/utils.js';

import {
    getCategoriesSortMode,
    getListDataFromResponse,
    prepareRequest,
} from './helpers.js';
import { actions } from './reducer.js';

export const requestSortMode = (sortMode) => async ({ dispatch }) => {
    const { settings } = App.model.profile;
    if (settings.sort_categories === sortMode) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        await API.profile.updateSettings({
            sort_categories: sortMode,
        });
        settings.sort_categories = sortMode;

        dispatch(actions.changeSortMode(sortMode));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const setListMode = (listMode) => ({ dispatch, getState }) => {
    dispatch(actions.changeListMode(listMode));

    const state = getState();
    if (listMode === 'sort' && state.sortMode !== SORT_MANUALLY) {
        dispatch(requestSortMode(SORT_MANUALLY));
    } else {
        dispatch(actions.setRenderTime());
    }
};

export const toggleSortByName = () => ({ dispatch }) => {
    const current = getCategoriesSortMode();
    const sortMode = (current === SORT_BY_NAME_ASC)
        ? SORT_BY_NAME_DESC
        : SORT_BY_NAME_ASC;

    dispatch(requestSortMode(sortMode));
};

export const toggleSortByDate = () => ({ dispatch }) => {
    const current = getCategoriesSortMode();
    const sortMode = (current === SORT_BY_CREATEDATE_ASC)
        ? SORT_BY_CREATEDATE_DESC
        : SORT_BY_CREATEDATE_ASC;

    dispatch(requestSortMode(sortMode));
};

export const setListData = ({ dispatch }, data, keepState = false) => {
    App.model.categories.setData(data);
    dispatch(actions.listRequestLoaded(keepState));
};

export const deleteItems = (removeChild = true) => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getContextIds(state);
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.hideDeleteConfirmDialog());
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids, removeChild });
        const response = await API.category.del(request);

        const data = getListDataFromResponse(response);
        setListData({ dispatch, getState }, data);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

/**
 * Sent API request to server to change position of category
 * @param {object} request - request object
 */
export const sendChangePosRequest = (request) => async ({ dispatch, getState }) => {
    dispatch(actions.startLoading());

    try {
        const prepared = prepareRequest(request);
        const response = await API.category.setPos(prepared);

        const data = getListDataFromResponse(response);
        setListData({ dispatch, getState }, data, true);
    } catch (e) {
        dispatch(actions.cancelPosChange());
        App.createErrorNotification(__('categories.errors.changePos'));
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const requestItem = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (!state.detailsId) {
        return;
    }

    try {
        const { data } = await API.category.read(state.detailsId);
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
