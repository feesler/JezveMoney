import { test, assert } from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { App } from '../../../Application.js';

/**
 * Create import rule with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.flags
 * @param {Object[]} params.conditions
 * @param {Object[]} params.actions
 */
export const create = async (params) => {
    let result = 0;

    await test('Create import rule', async () => {
        const resExpected = App.state.createRule(params);

        let createRes;
        try {
            createRes = await api.importrule.create(params);
            assert.deepMeet(createRes, resExpected);
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
 * Update import rule with specified params and check expected state of app
 * @param {Object} params
 */
export const update = async (params) => {
    let result = false;
    const props = structuredClone(params);

    await test('Update import rule', async () => {
        const resExpected = App.state.updateRule(props);
        const item = App.state.rules.getItem(props.id);
        const updParams = (item) ? item.toPlain() : {};

        if (!resExpected) {
            updParams.conditions = [];
            updParams.actions = [];
        }

        Object.assign(updParams, props);

        try {
            result = await api.importrule.update(updParams);
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
 * Delete specified import rule(s) and check expected state of app
 * @param {number[]} ids - array of template identifiers
 */
export const del = async (params) => {
    let result = false;

    await test(`Delete import rule(s) (${params})`, async () => {
        const resExpected = App.state.deleteRules(params);

        try {
            result = await api.importrule.del(params);
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
