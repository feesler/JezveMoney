import { urlJoin, copyObject } from '../common.js';
import { App } from '../app.js';

/** Error class to throw in case of API response with result: fail */
export class ApiRequestError extends Error {
}

function checkFields(fields, expFields) {
    const postData = {};

    if (!fields || !expFields) {
        throw new Error('Invalid parameters');
    }

    for (const f of expFields) {
        if (!(f in fields)) {
            throw new Error(`Expected field: ${f}`);
        }

        postData[f] = fields[f];
    }

    return postData;
}

async function apiRequest(method, url, data = null) {
    if (!App.environment) {
        throw new Error('Environment not set up');
    }

    const reqUrl = `${App.environment.baseUrl()}api/${url}`;
    const response = await App.environment.httpReq(method, reqUrl, data);
    if (response.status !== 200) {
        console.log(`Invalid status code: ${response.status}`);
        return false;
    }

    try {
        return JSON.parse(response.body);
    } catch (e) {
        console.log(response.body);
        throw e;
    }
}

async function apiGet(method) {
    if (!method) {
        throw new Error('Method not specified');
    }

    return apiRequest('GET', method);
}

async function apiPost(method, data = {}) {
    if (!method) {
        throw new Error('Method not specified');
    }

    return apiRequest('POST', method, data);
}

/**
 * User
 */
const userReqFields = ['login', 'password', 'name'];

/**
 * Currency
 */
const currReqFields = ['name', 'sign', 'flags'];

/**
 * Icon
 */
const iconReqFields = ['name', 'file', 'type'];

/**
 * Transactions
 */
const setPosReqFields = ['id', 'pos'];

function idsRequest(base, val) {
    if (!base) {
        throw new ApiRequestError('Invalid request');
    }

    const ids = Array.isArray(val) ? val : [val];

    // Check correctness of ids
    for (const id of ids) {
        const fid = parseInt(id, 10);
        if (!fid || Number.isNaN(fid)) {
            throw new ApiRequestError(`Invalid id specified: ${id}`);
        }
    }

    let res = base;
    if (ids.length === 1) {
        res += ids[0];
    } else {
        res += `?${urlJoin({ id: ids })}`;
    }

    return res;
}

export const api = {
    currency: {
        async read(ids) {
            const apiReq = idsRequest('currency/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read currency');
            }

            return jsonRes.data;
        },

        async create(options) {
            const postData = checkFields(options, currReqFields);
            const apiRes = await apiPost('currency/create', postData);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create currency');
            }

            return apiRes.data;
        },

        async update(id, options) {
            const itemId = parseInt(id, 10);
            if (!itemId || Number.isNaN(itemId)) {
                throw new ApiRequestError('Wrong id specified');
            }

            const postData = checkFields(options, currReqFields);
            postData.id = itemId;

            const apiRes = await apiPost('currency/update', postData);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update currency');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            for (const id of itemIds) {
                const fid = parseInt(id, 10);
                if (!fid || Number.isNaN(fid)) {
                    throw new ApiRequestError(`Invalid id specified: ${id}`);
                }
            }

            const postData = { id: ids };
            const apiRes = await apiPost('currency/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete currency');
            }

            return true;
        },

        async list() {
            const reqUrl = 'currency/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of currencies');
            }

            return jsonRes.data;
        },
    },

    icon: {
        async read(ids) {
            const apiReq = idsRequest('icon/', ids);

            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read icons');
            }

            return jsonRes.data;
        },

        async create(options) {
            const postData = checkFields(options, iconReqFields);
            const apiRes = await apiPost('icon/create', postData);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create icon');
            }

            return apiRes.data;
        },

        async update(id, options) {
            const itemId = parseInt(id, 10);
            if (!itemId || Number.isNaN(itemId)) {
                throw new ApiRequestError(`Invalid id specified: ${id}`);
            }

            const postData = checkFields(options, iconReqFields);
            postData.id = itemId;

            const apiRes = await apiPost('icon/update', postData);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update icon');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];

            for (const id of itemIds) {
                const fid = parseInt(id, 10);
                if (!fid || Number.isNaN(fid)) {
                    throw new ApiRequestError(`Invalid id specified: ${id}`);
                }
            }

            const postData = { id: ids };
            const apiRes = await apiPost('icon/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete icon');
            }

            return true;
        },

        async list() {
            const reqUrl = 'icon/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of icons');
            }

            return jsonRes.data;
        },
    },

    user: {
        // Try to login user and return boolean result
        async login({ login, password }) {
            const apiRes = await apiPost('login', { login, password });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to login user');
            }

            return true;
        },

        async logout() {
            const apiRes = await apiPost('logout');
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to logout user');
            }

            return true;
        },

        async register(options) {
            const postData = checkFields(options, userReqFields);
            const apiRes = await apiPost('register', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to register user');
            }

            return true;
        },

        /**
         * Admin methods
         */

        async list() {
            const reqUrl = 'user/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                const msg = (jsonRes && jsonRes.msg)
                    ? jsonRes.msg
                    : 'Fail to obtain list of users';
                throw new ApiRequestError(msg);
            }

            return jsonRes.data;
        },

        async create(options) {
            const postData = checkFields(options, userReqFields);
            const apiRes = await apiPost('user/create', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create user');
            }

            return apiRes.data;
        },

        async update(id, options) {
            const itemId = parseInt(id, 10);
            if (!itemId || Number.isNaN(itemId)) {
                throw new ApiRequestError('Wrong id specified');
            }

            const postData = checkFields(options, userReqFields);
            postData.id = id;

            const apiRes = await apiPost('user/update', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update user');
            }

            return true;
        },

        async changePassword(id, password) {
            const apiRes = await apiPost('user/changePassword', { id, password });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to change password');
            }

            return true;
        },

        /** Delete user and all related data */
        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            for (const id of itemIds) {
                const fid = parseInt(id, 10);
                if (!fid || Number.isNaN(fid)) {
                    throw new ApiRequestError(`Invalid id specified: ${id}`);
                }
            }

            const postData = { id: itemIds };
            const apiRes = await apiPost('user/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete user');
            }

            return true;
        },
    },

    profile: {
        /** Read profile data of current user */
        async read() {
            const apiRes = await apiGet('profile/read');
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read user profile data');
            }

            return apiRes.data;
        },

        async changeName({ name }) {
            const apiRes = await apiPost('profile/changename', { name });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to change user name');
            }

            return true;
        },

        async changePassword({ oldPassword, newPassword }) {
            const apiRes = await apiPost('profile/changepass', { current: oldPassword, new: newPassword });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to change password');
            }

            return true;
        },

        /** Reset all data of current user and return boolean result */
        async reset() {
            const apiRes = await apiPost('profile/reset');
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to reset user profile');
            }

            return true;
        },

        /** Delete current user and all related data */
        async del() {
            const apiRes = await apiPost('profile/delete');
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete user');
            }

            return true;
        },
    },

    state: {
        async read() {
            const jsonRes = await apiGet('state');
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read state');
            }

            return jsonRes.data;
        },
    },

    account: {
        async read(ids) {
            const apiReq = idsRequest('account/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read account');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('account/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create account');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('account/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update account');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            for (const id of itemIds) {
                const fid = parseInt(id, 10);
                if (!fid || Number.isNaN(fid)) {
                    throw new ApiRequestError(`Invalid id specified: ${id}`);
                }
            }

            const postData = { id: itemIds };
            const apiRes = await apiPost('account/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete account');
            }

            return true;
        },

        async list(full) {
            let reqUrl = 'account/list';
            if (full) {
                reqUrl += '?full=1';
            }

            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of accounts');
            }

            return jsonRes.data;
        },

        async reset() {
            const jsonRes = await apiGet('account/reset');
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to reset accounts');
            }

            return true;
        },
    },

    person: {
        async read(ids) {
            const apiReq = idsRequest('person/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read person');
            }

            return jsonRes.data;
        },

        async create(options) {
            const postData = copyObject(options);
            const apiRes = await apiPost('person/create', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create person');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('person/update', options);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update person');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const postData = { id: itemIds };
            const apiRes = await apiPost('person/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete person');
            }

            return true;
        },

        async list() {
            const jsonRes = await apiGet('person/list');
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of persons');
            }

            return jsonRes.data;
        },
    },

    transaction: {
        async read(ids) {
            const apiReq = idsRequest('transaction/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read transaction');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('transaction/create', options);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create transaction');
            }

            return apiRes.data;
        },

        async createMultiple(data) {
            const transactions = Array.isArray(data) ? data : [data];
            const apiRes = await apiPost('transaction/createMultiple', transactions);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create transactions');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('transaction/update', options);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update transaction');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const postData = { id: itemIds };
            const apiRes = await apiPost('transaction/delete', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete transaction');
            }

            return true;
        },

        async list(params = {}) {
            const reqParams = copyObject(params);
            if (!('count' in reqParams)) {
                reqParams.count = 0;
            }

            const apiReq = `transaction/list?${urlJoin(reqParams)}`;
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of transactions');
            }

            jsonRes.data.sort((a, b) => b.pos - a.pos);

            return jsonRes.data;
        },

        async setPos(options) {
            const postData = checkFields(options, setPosReqFields);
            const apiRes = await apiPost('transaction/setpos', postData);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete transaction');
            }

            return true;
        },
    },
};
