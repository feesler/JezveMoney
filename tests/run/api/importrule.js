import { test, copyObject } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/apirequest.js';
import { formatProps } from '../../common.js';
import { App } from '../../app.js';

/**
 * Create import rule with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.flags
 * @param {Object[]} params.conditions
 * @param {Object[]} params.actions
 */
export async function create(params) {
    let result = 0;

    await test(`Create import rule (${formatProps(params)})`, async () => {
        const resExpected = App.state.createRule(params);

        let createRes;
        try {
            createRes = await api.importrule.create(params);
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
 * Update import rule with specified params and check expected state of app
 * @param {Object} params
 */
export async function update(params) {
    let result = false;
    const props = copyObject(params);

    await test(`Update import rule (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateRule(props);
        let updParams = {};

        const item = App.state.rules.getItem(props.id);
        if (item) {
            updParams = item.toPlain();
        }

        if (!resExpected) {
            updParams.conditions = [];
            updParams.actions = [];
            Object.assign(updParams, props);
        }

        // Send API sequest to server
        try {
            result = await api.importrule.update(updParams);
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
 * Delete specified import rule(s) and check expected state of app
 * @param {number[]} ids - array of template identifiers
 */
export async function del(ids) {
    let result = false;

    await test(`Delete import rule(s) (${ids})`, async () => {
        const resExpected = App.state.deleteRules(ids);

        // Send API sequest to server
        try {
            result = await api.importrule.del(ids);
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
