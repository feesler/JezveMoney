import { copyObject } from 'jezve-test';
import { urlJoin } from '../common.js';
import { ApiRequestError } from '../error/ApiRequestError.js';
import { baseUrl, httpReq } from '../env.js';

async function apiRequest(method, url, data = null) {
    const reqUrl = `${baseUrl()}api/${url}`;
    const response = await httpReq(method, reqUrl, data);
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

function idsRequest(base, val) {
    if (!base) {
        throw new ApiRequestError('Invalid request');
    }

    const ids = Array.isArray(val) ? val : [val];
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
            const apiRes = await apiPost('currency/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create currency');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('currency/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update currency');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('currency/delete', { id: itemIds });
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
            const apiRes = await apiPost('icon/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create icon');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('icon/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update icon');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('icon/delete', { id: itemIds });
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
            const apiRes = await apiPost('register', options);
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
            const apiRes = await apiPost('user/create', options);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create user');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('user/update', options);
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
            const apiRes = await apiPost('user/delete', { id: itemIds });
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
            const apiRes = await apiPost('account/delete', { id: itemIds });
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
            const apiRes = await apiPost('person/create', options);
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
            const apiRes = await apiPost('person/delete', { id: itemIds });
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
            const apiRes = await apiPost('transaction/delete', { id: itemIds });
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

            jsonRes.data.items.sort((a, b) => b.pos - a.pos);

            return jsonRes.data;
        },

        async setPos(options) {
            const apiRes = await apiPost('transaction/setpos', options);
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete transaction');
            }

            return true;
        },
    },

    importrule: {
        async read(ids) {
            const apiReq = idsRequest('importrule/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read import rule');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('importrule/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create import rule');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('importrule/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update import rule');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('importrule/delete', { id: itemIds });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete import rule');
            }

            return true;
        },

        async list(params = {}) {
            const reqUrl = `importrule/list?${urlJoin(params)}`;
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of import rules');
            }

            return jsonRes.data;
        },
    },

    importcondition: {
        async read(ids) {
            const apiReq = idsRequest('importcond/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read import condition(s)');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('importcond/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create import condition');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('importcond/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update import condition');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('importcond/delete', { id: itemIds });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete import condition(s)');
            }

            return true;
        },

        async list() {
            const reqUrl = 'importrule/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of import conditions');
            }

            return jsonRes.data;
        },
    },

    importaction: {
        async read(ids) {
            const apiReq = idsRequest('importaction/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read import action');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('importaction/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create import action');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('importaction/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update import action');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('importaction/delete', { id: itemIds });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete import action');
            }

            return true;
        },

        async list() {
            const reqUrl = 'importaction/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of import actions');
            }

            return jsonRes.data;
        },
    },

    importtemplate: {
        async read(ids) {
            const apiReq = idsRequest('importtpl/', ids);
            const jsonRes = await apiGet(apiReq);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to read import template');
            }

            return jsonRes.data;
        },

        async create(options) {
            const apiRes = await apiPost('importtpl/create', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to create import template');
            }

            return apiRes.data;
        },

        async update(options) {
            const apiRes = await apiPost('importtpl/update', options);
            if (!apiRes || !apiRes.result || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to update import template');
            }

            return true;
        },

        async del(ids) {
            const itemIds = Array.isArray(ids) ? ids : [ids];
            const apiRes = await apiPost('importtpl/delete', { id: itemIds });
            if (!apiRes || apiRes.result !== 'ok') {
                throw new ApiRequestError('Fail to delete import template');
            }

            return true;
        },

        async list() {
            const reqUrl = 'importtpl/list';
            const jsonRes = await apiGet(reqUrl);
            if (!jsonRes || jsonRes.result !== 'ok') {
                throw new ApiRequestError('Fail to obtain list of import templates');
            }

            return jsonRes.data;
        },
    },
};
