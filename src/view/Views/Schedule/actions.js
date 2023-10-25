import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import { getContextIds } from '../../utils/utils.js';

import { getListDataFromResponse, prepareRequest } from './helpers.js';
import { actions } from './reducer.js';

export const setListMode = (listMode) => ({ dispatch }) => {
    dispatch(actions.changeListMode(listMode));
    dispatch(actions.setRenderTime());
};

export const setListData = (data, keepState = false) => ({ dispatch }) => {
    App.model.schedule.setData(data);
    dispatch(actions.listRequestLoaded(keepState));
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

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids });
        const response = await API.schedule.del(request);

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
        const { data } = await API.schedule.read(state.detailsId);
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

/** Sends finish API request for selected items */
export const finishSelected = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getContextIds(state);
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids });
        const response = await API.schedule.finish(request);

        const data = getListDataFromResponse(response);
        dispatch(setListData(data));

        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};
