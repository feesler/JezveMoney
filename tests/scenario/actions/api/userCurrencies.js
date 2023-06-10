import {
    test,
    assert,
    asArray,
} from 'jezve-test';
import { api } from '../../../model/api.js';
import { ApiRequestError } from '../../../error/ApiRequestError.js';
import { formatProps } from '../../../common.js';
import { App } from '../../../Application.js';

/**
 * Create user currrency with specified params and check expected state of app
 * @param {Object} params
 * @param {number} params.curr_id - currrency id
 * @param {number} params.flags - flags
 */
export const create = async (params) => {
    let result = 0;
    const isMultiple = params?.data?.length > 1;
    const descr = (isMultiple)
        ? 'Create multiple user currrencies'
        : `Create user currrency (${formatProps(params)})`;

    await test(descr, async () => {
        const resExpected = (isMultiple)
            ? App.state.createMultiple('createUserCurrency', params)
            : App.state.createUserCurrency(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.usercurrency.create(reqParams);
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
 * Reads user currrencies by ids and returns array of results
 * @param {number} id - user currrency id or array of ids
 */
export const read = async (id) => {
    let res = [];

    const ids = asArray(id)
        .filter((item) => !!item)
        .map((item) => item.toString());

    await test(`Read user currrencies [${ids}]`, async () => {
        const resExpected = App.state.userCurrencies.filter((item) => (
            ids.includes(item?.id?.toString())
        ));

        let createRes;
        try {
            createRes = await api.usercurrency.read(id);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        res = createRes ?? resExpected;

        return App.state.fetchAndTest();
    });

    return res;
};

/**
 * Reads list of user currrencies
 * @param {Object} params - list filter object
 */
export const list = async (params) => {
    let res = [];

    await test(`User currencies list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getUserCurrencies(params);

        let listRes;
        try {
            listRes = await api.usercurrency.list(params);
            assert.deepMeet(listRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        res = listRes ?? resExpected;

        return App.state.fetchAndTest();
    });

    return res;
};

/**
 * Update user currency with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - identifier of user currency
 * @param {number} params.curr_id - currrency id
 * @param {number} params.flags - flags
 */
export const update = async (params) => {
    let updateRes = false;
    const props = structuredClone(params);

    await test(`Update user currency (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateUserCurrency(props);

        const item = App.state.userCurrencies.getItem(props.id);
        const updParams = (item) ? structuredClone(item) : {};
        Object.assign(updParams, props);

        const reqParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.usercurrency.update(reqParams);
            assert.deepMeet(updateRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return updateRes;
};

/**
 * Delete specified user currencies and check expected state of app
 * @param {object} params - delete request object
 */
export const del = async (params) => {
    let deleteRes = false;

    await test(`Delete user currencies (${params})`, async () => {
        const resExpected = App.state.deleteUserCurrencies(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            deleteRes = await api.usercurrency.del(reqParams);
            assert.deepMeet(deleteRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return deleteRes;
};

/** Set new position for specified user currency */
export const setPos = async (params) => {
    let result;

    await test(`Set position of user currency (${formatProps(params)})`, async () => {
        const resExpected = App.state.setUserCurrencyPos(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            result = await api.usercurrency.setPos(reqParams);
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
