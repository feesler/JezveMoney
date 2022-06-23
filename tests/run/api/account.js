import { test, copyObject } from 'jezve-test';
import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/ApiRequestError.js';
import { formatProps } from '../../common.js';
import { App } from '../../Application.js';

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

        let createRes;
        try {
            createRes = await api.account.create(params);
            if (resExpected && (!createRes || !createRes.id)) {
                return false;
            }
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
            expectedResult = [];
            for (const item of params) {
                const resExpected = App.state.createAccount(item);
                if (!resExpected) {
                    App.state.deleteAccounts(expectedResult);
                    expectedResult = false;
                    break;
                }

                expectedResult.push(resExpected);
            }
        }

        // Send API sequest to server
        let createRes;
        try {
            createRes = await api.account.createMultiple(params);
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
    const props = copyObject(params);

    await test(`Update account (${formatProps(props)})`, async () => {
        const resExpected = App.state.updateAccount(props);
        let updParams = {};

        const item = App.state.accounts.getItem(props.id);
        if (item) {
            updParams = copyObject(item);
        }

        if (!resExpected) {
            Object.assign(updParams, props);
        }

        // Send API sequest to server
        try {
            updateRes = await api.account.update(updParams);
            if (resExpected !== updateRes) {
                return false;
            }
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
export const del = async (ids) => {
    let deleteRes = false;

    await test(`Delete account (${ids})`, async () => {
        const resExpected = App.state.deleteAccounts(ids);

        // Send API sequest to server
        try {
            deleteRes = await api.account.del(ids);
            if (resExpected !== deleteRes) {
                return false;
            }
        } catch (e) {
            if (!(e instanceof ApiRequestError) || resExpected) {
                throw e;
            }
        }

        return App.state.fetchAndTest();
    });

    return deleteRes;
};
