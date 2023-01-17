import {
    copyObject,
    baseUrl,
    httpReq,
    assert,
    asArray,
} from 'jezve-test';
import { urlJoin } from '../common.js';
import { ApiRequestError } from '../error/ApiRequestError.js';

/* eslint-disable no-console */
async function apiRequest(method, url, data = null) {
    assert(method, 'Method not specified');
    assert(url, 'API method not specified');

    const reqUrl = `${baseUrl()}api/${url}`;
    const response = await httpReq(method, reqUrl, data);
    if (response.status !== 200) {
        throw new Error(`Invalid status code: ${response.status}`);
    }

    const apiRes = JSON.parse(response.body);
    if (apiRes?.result !== 'ok') {
        const msg = apiRes?.msg ?? 'API request failed';
        throw new ApiRequestError(msg);
    }

    return apiRes;
}
/* eslint-enable no-console */

const apiGet = (...args) => apiRequest('GET', ...args);
const apiPost = (...args) => apiRequest('POST', ...args);

const idsRequest = (base, val) => {
    if (!base) {
        throw new ApiRequestError('Invalid request');
    }

    const ids = asArray(val);
    return (ids.length === 1)
        ? `${base}${ids[0]}`
        : `${base}?${urlJoin({ id: ids })}`;
};

export const api = {
    currency: {
        async read(ids) {
            const apiReq = idsRequest('currency/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('currency/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('currency/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('currency/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('currency/delete', { id: asArray(ids) });
            return true;
        },

        async list() {
            const { data } = await apiGet('currency/list');
            return data;
        },
    },

    icon: {
        async read(ids) {
            const apiReq = idsRequest('icon/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('icon/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('icon/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('icon/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('icon/delete', { id: asArray(ids) });
            return true;
        },

        async list() {
            const { data } = await apiGet('icon/list');
            return data;
        },
    },

    user: {
        // Try to login user and return boolean result
        async login({ login, password }) {
            await apiPost('login', { login, password });
            return true;
        },

        async logout() {
            await apiPost('logout');
            return true;
        },

        async register(options) {
            await apiPost('register', options);
            return true;
        },

        /**
         * Admin methods
         */

        async list() {
            const { data } = await apiGet('user/list');
            return data;
        },

        async create(options) {
            const { data } = await apiPost('user/create', options);
            return data;
        },

        async update(options) {
            await apiPost('user/update', options);
            return true;
        },

        async changePassword(id, password) {
            await apiPost('user/changePassword', { id, password });
            return true;
        },

        /** Delete user and all related data */
        async del(ids) {
            await apiPost('user/delete', { id: asArray(ids) });
            return true;
        },
    },

    profile: {
        /** Read profile data of current user */
        async read() {
            const { data } = await apiGet('profile/read');
            return data;
        },

        async changeName({ name }) {
            await apiPost('profile/changename', { name });
            return true;
        },

        async changePassword({ oldPassword, newPassword }) {
            await apiPost('profile/changepass', { current: oldPassword, new: newPassword });
            return true;
        },

        /** Reset data of current user and return boolean result */
        async resetData(options) {
            await apiPost('profile/reset', options);
            return true;
        },

        /** Delete current user and all related data */
        async del() {
            await apiPost('profile/delete');
            return true;
        },
    },

    state: {
        async read() {
            const { data } = await apiGet('state');
            return data;
        },
    },

    account: {
        async read(ids) {
            const apiReq = idsRequest('account/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('account/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('account/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('account/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('account/delete', { id: asArray(ids) });
            return true;
        },

        async show(ids) {
            await apiPost('account/show', { id: asArray(ids) });
            return true;
        },

        async hide(ids) {
            await apiPost('account/hide', { id: asArray(ids) });
            return true;
        },

        async list(full) {
            let reqUrl = 'account/list';
            if (full) {
                reqUrl += '?owner=all';
            }

            const { data } = await apiGet(reqUrl);
            return data;
        },
    },

    person: {
        async read(ids) {
            const apiReq = idsRequest('person/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('person/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('person/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('person/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('person/delete', { id: asArray(ids) });
            return true;
        },

        async show(ids) {
            await apiPost('person/show', { id: asArray(ids) });
            return true;
        },

        async hide(ids) {
            await apiPost('person/hide', { id: asArray(ids) });
            return true;
        },

        async list() {
            const { data } = await apiGet('person/list');
            return data;
        },
    },

    category: {
        async read(ids) {
            const apiReq = idsRequest('category/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('category/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('category/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('category/update', options);
            return true;
        },

        async del(ids, removeChild = true) {
            await apiPost('category/delete', { id: asArray(ids), removeChild });
            return true;
        },

        async list(options = {}) {
            const apiReq = `category/list?${urlJoin(options)}`;
            const { data } = await apiGet(apiReq);
            return data;
        },
    },

    transaction: {
        async read(ids) {
            const apiReq = idsRequest('transaction/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('transaction/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('transaction/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('transaction/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('transaction/delete', { id: asArray(ids) });
            return true;
        },

        async list(params = {}) {
            const reqParams = copyObject(params);
            if (!('count' in reqParams)) {
                reqParams.count = 0;
            }

            const apiReq = `transaction/list?${urlJoin(reqParams)}`;
            const { data } = await apiGet(apiReq);
            return data;
        },

        async setCategory(options) {
            await apiPost('transaction/setCategory', options);
            return true;
        },

        async setPos(options) {
            await apiPost('transaction/setpos', options);
            return true;
        },

        async statistics(options = {}) {
            const apiReq = `transaction/statistics?${urlJoin(options)}`;
            const { data } = await apiGet(apiReq);
            return data;
        },
    },

    importrule: {
        async read(ids) {
            const apiReq = idsRequest('importrule/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('importrule/create', options);
            return data;
        },

        async update(options) {
            await apiPost('importrule/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('importrule/delete', { id: asArray(ids) });
            return true;
        },

        async list(params = {}) {
            const reqUrl = `importrule/list?${urlJoin(params)}`;
            const { data } = await apiGet(reqUrl);
            return data;
        },
    },

    importcondition: {
        async read(ids) {
            const apiReq = idsRequest('importcond/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('importcond/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('importcond/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('importcond/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('importcond/delete', { id: asArray(ids) });
            return true;
        },

        async list() {
            const reqUrl = 'importrule/list';
            const { data } = await apiGet(reqUrl);
            return data;
        },
    },

    importaction: {
        async read(ids) {
            const apiReq = idsRequest('importaction/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('importaction/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('importaction/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('importaction/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('importaction/delete', { id: asArray(ids) });
            return true;
        },

        async list() {
            const reqUrl = 'importaction/list';
            const { data } = await apiGet(reqUrl);
            return data;
        },
    },

    importtemplate: {
        async read(ids) {
            const apiReq = idsRequest('importtpl/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('importtpl/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('importtpl/createMultiple', options);
            return data;
        },

        async update(options) {
            await apiPost('importtpl/update', options);
            return true;
        },

        async del(ids) {
            await apiPost('importtpl/delete', { id: asArray(ids) });
            return true;
        },

        async list() {
            const reqUrl = 'importtpl/list';
            const { data } = await apiGet(reqUrl);
            return data;
        },
    },
};
