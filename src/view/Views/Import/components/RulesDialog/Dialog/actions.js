import { isFunction } from 'jezvejs';

import { API } from '../../../../../API/index.js';
import { App } from '../../../../../Application/App.js';

import { getListDataFromResponse, prepareRequest } from './helpers.js';
import { actions } from './reducer.js';

const setListData = (data) => ({ dispatch, getState }) => {
    App.model.rules.setData(data);
    dispatch(actions.listRequestLoaded());

    const state = getState();
    if (isFunction(state.onUpdate)) {
        state.onUpdate();
    }
};

/** Send create/update import rule request to API */
export const submitRule = (data) => async ({ dispatch }) => {
    if (!data) {
        throw new Error('Invalid data');
    }

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest(data);
        const response = (data.id)
            ? await API.importRule.update(request)
            : await API.importRule.create(request);

        const rules = getListDataFromResponse(response);
        dispatch(setListData(rules));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
};

/** Send delete import rule request to API */
export const deleteRule = (ruleId) => async ({ dispatch }) => {
    const id = parseInt(ruleId, 10);
    if (!id) {
        throw new Error('Invalid rule id');
    }

    dispatch(actions.hideDeleteConfirmDialog());
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id });
        const response = await API.importRule.del(request);
        const rules = getListDataFromResponse(response);
        dispatch(setListData(rules));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
};
