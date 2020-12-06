import { api } from '../../model/api.js';
import { ApiRequestError } from '../../error/apirequest.js';
import {
    test,
    copyObject,
    setParam,
    formatProps,
} from '../../common.js';
import { App } from '../../app.js';

/**
 * Create account with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.name - name of account
 * @param {number} params.curr_id - currency of account
 * @param {number} params.initbalance - initial balance of account
 * @param {number} params.icon_id - icon identifier
 */
export async function create(params) {
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
}

/**
 * Update account with specified params and check expected state of app
 * @param {Object} params
 * @param {string} params.id - name of account
 * @param {string} params.name - name of account
 * @param {number} params.curr_id - currency of account
 * @param {number} params.initbalance - initial balance of account
 * @param {number} params.icon_id - icon identifier
 */
export async function update(params) {
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
            setParam(updParams, props);
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
}

/**
 * Delete specified account(s) and check expected state of app
 * @param {number[]} ids - array of account identificators
 */
export async function del(ids) {
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
}
