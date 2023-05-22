import {
    copyObject,
    baseUrl,
    httpReq,
    assert,
    asArray,
    isObject,
} from 'jezve-test';
import { ApiRequestError } from '../error/ApiRequestError.js';

/* eslint-disable no-console */
async function apiRequest(method, request, data = null) {
    assert(method, 'Method not specified');
    assert(request, 'API method not specified');

    const url = new URL(`${baseUrl()}api/${request}`);
    if (method.toLowerCase() === 'get' && isObject(data)) {
        Object.entries(data).forEach(([prop, value]) => {
            if (Array.isArray(value)) {
                const arrProp = `${prop}[]`;
                value.forEach((item) => url.searchParams.append(arrProp, item));
            } else {
                url.searchParams.set(prop, value);
            }
        });
    }

    const response = await httpReq(method, url.toString(), data);
    if (response.status !== 200) {
        throw new Error(`Invalid status code: ${response.status}`);
    }

    let apiRes = null;
    try {
        apiRes = JSON.parse(response.body);
    } catch (e) {
        throw new Error(`Invalid response: ${response.body}`);
    }

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

    const res = {
        request: base,
    };

    const ids = asArray(val);
    if (ids.length === 1) {
        res.request += ids[0].toString();
    } else {
        res.options = { id: ids };
    }

    return res;
};

export const api = {
    currency: {
        async read(ids) {
            const { request, options } = idsRequest('currency/', ids);
            const { data } = await apiGet(request, options);
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
            const { request, options } = idsRequest('icon/', ids);
            const { data } = await apiGet(request, options);
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
            const { request, options } = idsRequest('usercurrency/', ids);
            const { data } = await apiGet(request, options);
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
            const { data } = await apiGet('usercurrency/list', options);
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
            const { request, options } = idsRequest('account/', ids);
            const { data } = await apiGet(request, options);
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
            const { data } = await apiGet('account/list', options);
            return data;
        },
    },

    person: {
        async read(ids) {
            const { request, options } = idsRequest('person/', ids);
            const { data } = await apiGet(request, options);
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
            const { data } = await apiGet('person/list', options);
            return data;
        },
    },

    category: {
        async read(ids) {
            const { request, options } = idsRequest('category/', ids);
            const { data } = await apiGet(request, options);
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
            const { data } = await apiGet('category/list', options);
            return data;
        },
    },

    transaction: {
        async read(ids) {
            const { request, options } = idsRequest('transaction/', ids);
            const { data } = await apiGet(request, options);
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

            const { data } = await apiGet('transaction/list', reqParams);
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
            const { data } = await apiGet('transaction/statistics', options);
            return data;
        },
    },

    schedule: {
        async read(ids) {
            const { request, options } = idsRequest('schedule/', ids);
            const { data } = await apiGet(request, options);
            return data;
        },

        async create(options) {
            const { data } = await apiPost('schedule/create', options);
            return data;
        },

        async createMultiple(options) {
            const { data } = await apiPost('schedule/createMultiple', options);
            return data;
        },

        async update(options) {
            const response = await apiPost('schedule/update', options);
            return response.data ?? {};
        },

        async del(options) {
            const response = await apiPost('schedule/delete', options);
            return response.data ?? {};
        },

        async list() {
            const { data } = await apiGet('schedule/list');
            return data;
        },
    },

    reminder: {
        async read(ids) {
            const { request, options } = idsRequest('reminder/', ids);
            const { data } = await apiGet(request, options);
            return data;
        },

        async confirm(options) {
            const response = await apiPost('reminder/confirm', options);
            return response.data ?? {};
        },

        async cancel(options) {
            const response = await apiPost('reminder/cancel', options);
            return response.data ?? {};
        },

        async list() {
            const { data } = await apiGet('reminder/list');
            return data;
        },
    },

    importrule: {
        async read(ids) {
            const { request, options } = idsRequest('importrule/', ids);
            const { data } = await apiGet(request, options);
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

        async list(options = {}) {
            const { data } = await apiGet('importrule/list', options);
            return data;
        },
    },

    importcondition: {
        async read(ids) {
            const { request, options } = idsRequest('importcond/', ids);
            const { data } = await apiGet(request, options);
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
            const { request, options } = idsRequest('importaction/', ids);
            const { data } = await apiGet(request, options);
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
            const { request, options } = idsRequest('importtpl/', ids);
            const { data } = await apiGet(request, options);
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
