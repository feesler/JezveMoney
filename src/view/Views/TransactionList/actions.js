import { App } from '../../Application/App.js';
import { API } from '../../API/index.js';
import {
    __,
    getContextIds,
} from '../../utils/utils.js';

import {
    getListDataFromResponse,
    prepareRequest,
} from './helpers.js';
import { actions } from './reducer.js';

export const requestGroupByDate = (groupByDate) => async ({ dispatch }) => {
    const { settings } = App.model.profile;
    if (settings.tr_group_by_date === groupByDate) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        await API.profile.updateSettings({
            tr_group_by_date: groupByDate,
        });
        settings.tr_group_by_date = groupByDate;

        dispatch(actions.toggleGroupByDate());
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const toggleGroupByDate = () => ({ dispatch }) => {
    const { settings } = App.model.profile;
    const groupByDate = (settings.tr_group_by_date === 0) ? 1 : 0;
    dispatch(requestGroupByDate(groupByDate));
};

export const setListMode = (listMode) => ({ dispatch }) => {
    dispatch(actions.changeListMode(listMode));
    dispatch(actions.setRenderTime());
};

export const setListData = (data, keepState = false) => ({ dispatch }) => {
    const payload = {
        ...data,
        keepState,
    };

    dispatch(actions.listRequestLoaded(payload));
};

export const deleteItems = () => async ({ dispatch, getState }) => {
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
        const request = prepareRequest({ id: ids }, state);
        const response = await API.transaction.del(request);

        const data = getListDataFromResponse(response);
        dispatch(setListData(data));

        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

/**
 * Sent API request to server to change position of transaction
 * @param {number} id - identifier of item to change position
 * @param {number} pos - new position of item
 */
export const sendChangePosRequest = (id, pos) => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id, pos }, state);
        const response = await API.transaction.setPos(request);

        const data = getListDataFromResponse(response);
        dispatch(setListData(data, true));

        App.updateProfileFromResponse(response);
    } catch (e) {
        dispatch(actions.cancelPosChange());
        App.createErrorNotification(__('transactions.errors.changePos'));
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
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
        const request = prepareRequest({ id: ids, category_id: categoryId }, state);
        const response = await API.transaction.setCategory(request);

        const data = getListDataFromResponse(response);
        dispatch(setListData(data));

        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
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
        const { data } = await API.transaction.read(state.detailsId);
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
