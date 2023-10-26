import { isFunction } from '@jezvejs/types';

import { App } from '../../../Application/App.js';
import { API } from '../../../API/index.js';
import { getContextIds } from '../../../utils/utils.js';

import {
    getListDataFromResponse,
    getRequestData,
    getUpcomingDataFromResponse,
    prepareRequest,
} from './helpers.js';
import { actions } from './reducer.js';

const notifyUpdate = (state) => {
    if (isFunction(state.onUpdate)) {
        state.onUpdate(state);
    }
};

export const setListMode = (listMode) => ({ dispatch, getState }) => {
    dispatch(actions.changeListMode(listMode));

    dispatch(actions.setRenderTime());
    notifyUpdate(getState());
};

export const selectAllItems = () => ({ dispatch, getState }) => {
    dispatch(actions.selectAllItems());
    notifyUpdate(getState());
};

export const deselectAllItems = () => ({ dispatch, getState }) => {
    dispatch(actions.deselectAllItems());
    notifyUpdate(getState());
};

export const setListDataFromResponse = (response, keepState = false) => ({ dispatch }) => {
    const reminders = getListDataFromResponse(response);
    const upcoming = getUpcomingDataFromResponse(response);

    App.model.reminders.setData(reminders);

    dispatch(actions.listRequestLoaded({ upcoming, keepState }));
};

export const requestUpcoming = (options = {}) => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const {
        keepState = false,
        isLoadingMore = false,
        ...request
    } = options;

    dispatch(actions.startLoading(isLoadingMore));

    try {
        const { data: upcoming } = await API.reminder.upcoming(request);
        dispatch(actions.listRequestLoaded({ upcoming, keepState }));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
    notifyUpdate(getState());
};

/** Creates transactions for selected reminders */
export const confirmReminder = () => async ({ dispatch, getState }) => {
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
        const request = prepareRequest(getRequestData(state), state);
        const response = await API.reminder.confirm(request);

        dispatch(setListDataFromResponse(response));
        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
    notifyUpdate(getState());
};

/** Cancels selected reminders */
export const cancelReminder = () => async ({ dispatch, getState }) => {
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
        const request = prepareRequest(getRequestData(state), state);
        const response = await API.reminder.cancel(request);

        dispatch(setListDataFromResponse(response));
        App.updateProfileFromResponse(response);
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
    notifyUpdate(getState());
};

export const requestItem = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (!state.detailsId) {
        return;
    }

    try {
        const { data } = await API.reminder.read(state.detailsId);
        const [item] = data;

        dispatch(actions.itemDetailsLoaded(item));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    notifyUpdate(getState());
};

export const showDetails = () => async ({ dispatch }) => {
    dispatch(actions.showDetails());
    dispatch(requestItem());
};
