import { test, copyObject } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/apirequest.js';
import { formatProps } from '../../common.js';
import { App } from '../../app.js';

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
export async function create(params) {
    let result = 0;

    await test(`Create import template (${formatProps(params)})`, async () => {
        const resExpected = App.state.createTemplate(params);

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
}

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
export async function update(params) {
    let result = false;
    const props = copyObject(params);

    await test(`Update import template (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateTemplate(props);
        let updParams = {};

        const item = App.state.templates.getItem(props.id);
        if (item) {
            updParams = copyObject(item);
        }

        if (!resExpected) {
            Object.assign(updParams, props);
        }

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
}

/**
 * Delete specified import template(s) and check expected state of app
 * @param {number[]} ids - array of template identifiers
 */
export async function del(ids) {
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
}
