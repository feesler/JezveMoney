import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import { __, getContextIds } from '../../utils/utils.js';

import { getListDataFromResponse, prepareRequest } from './helpers.js';
import { actions } from './reducer.js';

export const setListData = (data, keepState = false) => ({ dispatch }) => {
    App.model.userCurrencies.setData(data);
    dispatch(actions.listRequestLoaded(keepState));
};

/**
 * Sents API request to server to add currency to the list of user
 * @param {Object} data - new user currency entry data
 */
export const sendCreateRequest = (data) => async ({ dispatch }) => {
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest(data);
        const response = await API.userCurrency.create(request);
        const listData = getListDataFromResponse(response);
        dispatch(setListData(listData, true));
    } catch (e) {
        App.createErrorNotification(__('userCurrencies.errors.create'));
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

/**
 * Sent API request to server to change position of account
 * @param {number} id - identifier of item to change position
 * @param {number} pos - new position of item
 */
export const sendChangePosRequest = (id, pos) => async ({ dispatch }) => {
    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id, pos });
        const response = await API.userCurrency.setPos(request);

        const data = getListDataFromResponse(response);
        dispatch(setListData(data, true));

        App.updateProfileFromResponse(response);
    } catch (e) {
        dispatch(actions.cancelPosChange());
        App.createErrorNotification(__('userCurrencies.errors.changePos'));
    }

    dispatch(actions.stopLoading());
};

export const deleteItems = () => async ({ dispatch, getState }) => {
    const state = getState();
    if (state.loading) {
        return;
    }

    const ids = getContextIds(state, 'userCurrencies');
    if (ids.length === 0) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        const request = prepareRequest({ id: ids });
        const response = await API.userCurrency.del(request);
        const data = getListDataFromResponse(response);
        dispatch(setListData(data));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setRenderTime());
};

export const requestDateLocale = (locale) => async ({ dispatch }) => {
    const { settings } = App.model.profile;
    if (settings.date_locale === locale) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        await API.profile.updateSettings({
            date_locale: locale,
        });
        settings.date_locale = locale;

        dispatch(actions.changeDateLocale(locale));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setDateRenderTime());
};

export const requestDecimalLocale = (locale) => async ({ dispatch }) => {
    const { settings } = App.model.profile;
    if (settings.decimal_locale === locale) {
        return;
    }

    dispatch(actions.startLoading());

    try {
        await API.profile.updateSettings({
            decimal_locale: locale,
        });
        settings.decimal_locale = locale;

        dispatch(actions.changeDecimalLocale(locale));
    } catch (e) {
        App.createErrorNotification(e.message);
    }

    dispatch(actions.stopLoading());
    dispatch(actions.setDateRenderTime());
};
