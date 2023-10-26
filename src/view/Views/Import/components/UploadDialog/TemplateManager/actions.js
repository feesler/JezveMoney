import { isFunction } from '@jezvejs/types';

import { API } from '../../../../../API/index.js';
import { App } from '../../../../../Application/App.js';

import { findValidTemplate, getListDataFromResponse, prepareRequest } from './helpers.js';
import { TPL_CREATE_STATE, TPL_UPDATE_STATE, actions } from './reducer.js';

/** Notifies template form state changed */
const notifyStateChanged = () => ({ getState }) => {
    const state = getState();
    if (isFunction(state.onChangeState)) {
        state.onChangeState(state.id);
    }
};

export const changeMainAccount = (id) => ({ dispatch, getState }) => {
    const state = getState();
    if (state.mainAccount.id === id) {
        return;
    }

    const mainAccount = App.model.accounts.getItem(id);
    dispatch(actions.setMainAccount(mainAccount));

    if (isFunction(state.onAccountChange)) {
        state.onAccountChange(mainAccount.id);
    }
};

/**
 * Set specified template
 * @param {number} value - import template id
 */
export const setTemplate = (value) => ({ dispatch }) => {
    const template = App.model.templates.getItem(value) ?? null;

    if (template?.account_id) {
        dispatch(changeMainAccount(template.account_id));
    }

    dispatch(actions.setTemplate(template));
};

/** Set create template state */
export const createTemplate = () => ({ dispatch }) => {
    dispatch(actions.setCreateTemplateState());
    dispatch(notifyStateChanged());
};

/** Update template button 'click' event handler */
export const updateTemplate = () => ({ dispatch }) => {
    dispatch(actions.setUpdateTemplateState());
    dispatch(notifyStateChanged());
};

/** Set select template state */
export const setSelectState = () => ({ dispatch }) => {
    dispatch(actions.setSelectTemplateState());
    dispatch(notifyStateChanged());
};

/** Copy specified data to component */
export const setRawData = ({ data, filename }) => ({ dispatch, getState }) => {
    dispatch(actions.setFileData({ data, filename }));

    if (App.model.templates.length === 0) {
        dispatch(createTemplate());
        return;
    }

    const state = getState();
    let template = findValidTemplate(state.rawData);
    if (!template) {
        [template] = state.templates;
        if (!template) {
            throw new Error('Invalid selection');
        }
    }

    dispatch(setTemplate(template.id));
    dispatch(actions.selectTemplate(template.id));
    dispatch(setSelectState());
};

const setListData = (data) => ({ dispatch, getState }) => {
    const { templates } = App.model;
    templates.setData(data.templates);
    dispatch(actions.updateTemplates(templates));

    const state = getState();
    if (templates.length > 0) {
        // Find template with same name as currently selected
        let template = null;
        if (state.formRequest) {
            template = templates.find((item) => item.name === state.formRequest.name);
        } else if (state.selectedTemplateId) {
            template = templates.getItem(state.selectedTemplateId);
        }
        if (!template) {
            template = templates.getItemByIndex(0);
        }

        dispatch(setTemplate(template.id));
        dispatch(actions.selectTemplate(template.id));
        dispatch(setSelectState());
    } else {
        dispatch(createTemplate());
    }

    if (data.rules) {
        App.model.rules.setData(data.rules);
    }

    dispatch(actions.stopListLoading());

    if (isFunction(state.onUpdate)) {
        state.onUpdate();
    }
};

/** Send API request to create/update template */
export const requestSubmitTemplate = (data) => async ({ dispatch }) => {
    dispatch(actions.startListLoading(data));

    try {
        const request = prepareRequest(data);
        const response = (data.id)
            ? await API.importTemplate.update(request)
            : await API.importTemplate.create(request);

        const listData = getListDataFromResponse(response);
        dispatch(setListData(listData));
    } catch (e) {
        App.createErrorNotification(e.message);
    }
};

export const cancelTemplate = () => ({ dispatch, getState }) => {
    const state = getState();
    if (state.id !== TPL_CREATE_STATE && state.id !== TPL_UPDATE_STATE) {
        return;
    }

    dispatch(setSelectState());
    // Restore previously selected template
    dispatch(setTemplate(state.selectedTemplateId));
};

/** Send API request to delete template */
export const requestDeleteTemplate = () => async ({ dispatch, getState }) => {
    const state = getState();
    const { id } = state.template;
    if (!id) {
        return;
    }

    dispatch(actions.hideDeleteConfirmDialog());
    dispatch(actions.startListLoading());

    try {
        const request = prepareRequest({ id });
        const response = await API.importTemplate.del(request);
        const listData = getListDataFromResponse(response);
        dispatch(setListData(listData));
    } catch (e) {
        App.createErrorNotification(e.message);
        dispatch(actions.stopListLoading());
    }
};
