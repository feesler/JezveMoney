import { test, assert } from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { App } from '../../../Application.js';

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
    const isMultiple = params?.data?.length > 1;
    const descr = (isMultiple)
        ? 'Create multiple import templates'
        : 'Create import template';

    await test(descr, async () => {
        const resExpected = (isMultiple)
            ? App.state.createMultiple('createTemplateFromRequest', params)
            : App.state.createTemplateFromRequest(params);

        let createRes;
        try {
            createRes = await api.importtemplate.create(params);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        if (createRes) {
            result = (isMultiple) ? createRes.ids : createRes.id;
        } else {
            result = resExpected;
        }

        return App.state.fetchAndTest();
    });

    return result;
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
    const props = structuredClone(params);

    await test('Update import template', async () => {
        const expTemplate = App.state.templateFromRequest(props);
        const resExpected = App.state.updateTemplate(expTemplate);
        const updParams = App.state.getUpdateTemplateRequest(props);

        try {
            result = await api.importtemplate.update(updParams);
            assert.deepMeet(result, resExpected);
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
export const del = async (params) => {
    let result = false;

    await test(`Delete import template(s) (${params})`, async () => {
        const resExpected = App.state.deleteTemplates(params);

        try {
            result = await api.importtemplate.del(params);
            assert.deepMeet(result, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return result;
};
