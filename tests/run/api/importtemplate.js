import { test, copyObject } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { formatProps } from '../../common.js';
import { App } from '../../Application.js';

/**
 * Create import template with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name
 * @param {number} params.type
 * @param {number} params.account_amount_col
 * @param {number} params.account_curr_col
 * @param {number} params.trans_amount_col
 * @param {number} params.trans_curr_col
 * @param {number} params.date_col
 * @param {number} params.comment_col
 */
export const create = async (params) => {
    let result = 0;

    await test(`Create import template (${formatProps(params)})`, async () => {
        const expTemplate = App.state.templateFromRequest(params);
        const resExpected = App.state.createTemplate(expTemplate);

        let createRes;
        try {
            createRes = await api.importtemplate.create(params);
            if (resExpected && (!createRes || !createRes.id)) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        result = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return result;
};

/**
 * Create multiple import templates with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple import templates', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = [];
            for (const item of params) {
                const expTemplate = App.state.templateFromRequest(item);
                const resExpected = App.state.createTemplate(expTemplate);
                if (!resExpected) {
                    App.state.deleteTemplates(expectedResult);
                    expectedResult = false;
                    break;
                }

                expectedResult.push(resExpected);
            }
        }

        // Send API sequest to server
        let createRes;
        try {
            createRes = await api.importtemplate.createMultiple(params);
            if (expectedResult && (!createRes || !createRes.ids)) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || expectedResult) {
                throw e;
            }
        }

        ids = (createRes) ? createRes.ids : expectedResult;

        return App.state.fetchAndTest();
    });

    return ids;
};

/**
 * Update import template with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name
 * @param {number} params.type
 * @param {number} params.account_amount_col
 * @param {number} params.account_curr_col
 * @param {number} params.trans_amount_col
 * @param {number} params.trans_curr_col
 * @param {number} params.date_col
 * @param {number} params.comment_col
 */
export const update = async (params) => {
    let result = false;
    const props = copyObject(params);

    await test(`Update import template (${formatProps(props)})`, async () => {
        const expTemplate = App.state.templateFromRequest(props);
        const resExpected = App.state.updateTemplate(expTemplate);
        const updParams = App.state.getUpdateTemplateRequest(props);

        // Send API sequest to server
        try {
            result = await api.importtemplate.update(updParams);
            if (resExpected !== result) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return result;
};

/**
 * Delete specified import template(s) and check expected state of app
 * @param {number[]} ids - array of template identifiers
 */
export const del = async (ids) => {
    let result = false;

    await test(`Delete import template(s) (${ids})`, async () => {
        const resExpected = App.state.deleteTemplates(ids);

        // Send API sequest to server
        try {
            result = await api.importtemplate.del(ids);
            if (resExpected !== result) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return result;
};
