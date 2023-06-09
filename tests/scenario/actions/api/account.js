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
 * Create account with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name - name of account
 * @param {number} params.curr_id - currency of account
 * @param {number} params.initbalance - initial balance of account
 * @param {number} params.icon_id - icon identifier
 */
export const create = async (params) => {
    let accountId = 0;

    await test(`Create account (${formatProps(params)})`, async () => {
        const resExpected = App.state.createAccount(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        let createRes;
        try {
            createRes = await api.account.create(reqParams);
            assert.deepMeet(createRes, resExpected);
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        accountId = (createRes) ? createRes.id : resExpected;

        return App.state.fetchAndTest();
    });

    return accountId;
};

/**
 * Create multiple accounts with specified params and check expected state of app
 */
export const createMultiple = async (params) => {
    let ids = [];

    await test('Create multiple accounts', async () => {
        let expectedResult = false;
        if (Array.isArray(params)) {
            expectedResult = { ids: [] };
            for (const item of params) {
                const resExpected = App.state.createAccount(item);
                if (!resExpected) {
                    App.state.deleteAccounts({ id: expectedResult.ids });
                    expectedResult = false;
                    break;
                }

                expectedResult.ids.push(resExpected.id);
            }
        }

        let createRes;
        try {
            createRes = await api.account.createMultiple(params);
            assert.deepMeet(createRes, expectedResult);
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
 * Reads accounts by ids and returns array of results
 * @param {number} id - account id or array of ids
 */
export const read = async (id) => {
    let res = [];

    const ids = asArray(id)
        .filter((item) => !!item)
        .map((item) => item.toString());

    await test(`Read account(s) [${ids}]`, async () => {
        const resExpected = App.state.accounts.filter((item) => (
            ids.includes(item?.id?.toString())
        ));

        let createRes;
        try {
            createRes = await api.account.read(id);
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
 * Reads list of accounts
 * @param {Object} params - list filter object
 */
export const list = async (params) => {
    let res = [];

    await test(`Accounts list (${formatProps(params)})`, async () => {
        const { data: resExpected } = App.state.getAccounts(params);

        let listRes;
        try {
            listRes = await api.account.list(params);
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
 * Update account with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - name of account
 * @param {string} params.name - name of account
 * @param {number} params.curr_id - currency of account
 * @param {number} params.initbalance - initial balance of account
 * @param {number} params.icon_id - icon identifier
 */
export const update = async (params) => {
    let updateRes = false;
    const props = structuredClone(params);

    await test(`Update account (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateAccount(props);

        const item = App.state.accounts.getItem(props.id);
        let updParams = (item) ? structuredClone(item) : {};
        Object.assign(updParams, props);

        updParams = App.state.prepareChainedRequestData(updParams);

        try {
            updateRes = await api.account.update(updParams);
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
 * Delete specified account(s) and check expected state of app
 * @param {number[]} ids - array of account identificators
 */
export const del = async (options) => {
    let deleteRes = false;

    await test(`Delete account (${options})`, async () => {
        const resExpected = App.state.deleteAccounts(options);
        const reqParams = App.state.prepareChainedRequestData(options);

        try {
            deleteRes = await api.account.del(reqParams);
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

/** Set new position for specified account */
export const setPos = async (params) => {
    let result;

    await test(`Set position of account (${formatProps(params)})`, async () => {
        const resExpected = App.state.setAccountPos(params);
        const reqParams = App.state.prepareChainedRequestData(params);

        try {
            result = await api.account.setPos(reqParams);
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
