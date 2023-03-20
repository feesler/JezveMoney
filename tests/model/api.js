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

        async updateSettings(options) {
            await apiPost('profile/updateSettings', options);
            return true;
        },

        /** Delete current user and all related data */
        async del() {
            await apiPost('profile/delete');
            return true;
        },
    },

    usercurrency: {
        async read(ids) {
            const apiReq = idsRequest('usercurrency/', ids);
            const { data } = await apiGet(apiReq);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('usercurrency/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('usercurrency/createMultiple', options);
            return data;
        },

        async update(options) {
            const response = await apiPost('usercurrency/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('usercurrency/delete', options);
            return response.data ?? {};
        },

        async setPos(options) {
            const response = await apiPost('usercurrency/setpos', options);
            return response.data ?? {};
        },

        async list(options = {}) {
            const apiReq = `usercurrency/list?${urlJoin(options)}`;
            const { data } = await apiGet(apiReq);
            return data;
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
            const response = await apiPost('account/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('account/delete', options);
            return response.data ?? {};
        },

        async show(options) {
            const response = await apiPost('account/show', options);
            return response.data ?? {};
        },

        async hide(options) {
            const response = await apiPost('account/hide', options);
            return response.data ?? {};
        },

        async setPos(options) {
            const response = await apiPost('account/setpos', options);
            return response.data ?? {};
        },

        async list(options = {}) {
            const apiReq = `account/list?${urlJoin(options)}`;
            const { data } = await apiGet(apiReq);
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
            const response = await apiPost('person/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('person/delete', options);
            return response.data ?? {};
        },

        async show(options) {
            const response = await apiPost('person/show', options);
            return response.data ?? {};
        },

        async hide(options) {
            const response = await apiPost('person/hide', options);
            return response.data ?? {};
        },

        async setPos(options) {
            const response = await apiPost('person/setpos', options);
            return response.data ?? {};
        },

        async list(options = {}) {
            const apiReq = `person/list?${urlJoin(options)}`;
            const { data } = await apiGet(apiReq);
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
            const response = await apiPost('category/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('category/delete', options);
            return response.data ?? {};
        },

        async setPos(options) {
            const response = await apiPost('category/setpos', options);
            return response.data ?? {};
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
            const response = await apiPost('transaction/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('transaction/delete', options);
            return response.data ?? {};
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
            const response = await apiPost('transaction/setCategory', options);
            return response.data ?? {};
        },

        async setPos(options) {
            const response = await apiPost('transaction/setpos', options);
            return response.data ?? {};
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
            const response = await apiPost('importrule/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('importrule/delete', options);
            return response.data ?? {};
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
            const response = await apiPost('importcond/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('importcond/delete', options);
            return response.data ?? {};
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
            const response = await apiPost('importaction/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('importaction/delete', options);
            return response.data ?? {};
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
            const response = await apiPost('importtpl/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('importtpl/delete', options);
            return response.data ?? {};
        },

        async list() {
            const reqUrl = 'importtpl/list';
            const { data } = await apiGet(reqUrl);
            return data;
        },
    },
};
