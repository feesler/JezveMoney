import {
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
    } else if (ids.length > 1) {
        res.options = { id: ids };
    }

    return res;
};

const apiGetMethod = (method, defaultOptions = {}) => (name) => async (options = {}) => {
    const { data } = await apiGet(`${name}/${method}`, { ...defaultOptions, ...options });
    return data;
};

const apiPostMethod = (method, defaultOptions = {}) => (name) => async (options = {}) => {
    const response = await apiPost(`${name}/${method}`, { ...defaultOptions, ...options });
    return response.data ?? {};
};

const apiRead = (name) => async (ids) => {
    const { request, options } = idsRequest(`${name}/`, ids);
    const { data } = await apiGet(request, options);
    return data;
};

const apiCreate = apiPostMethod('create');
const apiUpdate = apiPostMethod('update');
const apiDelete = apiPostMethod('delete');
const apiList = apiGetMethod('list');
const apiSetPos = apiPostMethod('setpos');
const apiShow = apiPostMethod('show');
const apiHide = apiPostMethod('show');

const apiController = (name, methods) => {
    const res = {};

    const keys = Object.keys(methods);
    keys.forEach((key) => {
        const method = methods[key];
        res[key] = method(name);
    });

    return res;
};

export const api = {
    currency: apiController('currency', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

    color: apiController('color', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

    icon: apiController('icon', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

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

    profile: apiController('profile', {
        read: apiGetMethod('read'),
        changeName: apiPostMethod('changename'),
        changePassword: apiPostMethod('changepass'),
        resetData: apiPostMethod('reset'),
        updateSettings: apiPostMethod('updateSettings'),
        del: apiDelete,
    }),

    usercurrency: apiController('usercurrency', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        setPos: apiSetPos,
        list: apiList,
    }),

    state: {
        async read() {
            const { data } = await apiGet('state');
            return data;
        },
    },

    account: apiController('account', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        show: apiShow,
        hide: apiHide,
        setPos: apiSetPos,
        list: apiList,
    }),

    person: apiController('person', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        show: apiShow,
        hide: apiHide,
        setPos: apiSetPos,
        list: apiList,
    }),

    category: apiController('category', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        setPos: apiSetPos,
        list: apiList,
    }),

    transaction: apiController('transaction', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        setPos: apiSetPos,
        setCategory: apiPostMethod('setCategory'),
        list: apiGetMethod('list', { onPage: 10 }),
        statistics: apiGetMethod('statistics'),
    }),

    schedule: apiController('schedule', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        finish: apiPostMethod('finish'),
        del: apiDelete,
        list: apiList,
    }),

    reminder: apiController('reminder', {
        read: apiRead,
        confirm: apiPostMethod('confirm'),
        cancel: apiPostMethod('cancel'),
        list: apiList,
        upcoming: apiGetMethod('upcoming'),
    }),

    importrule: apiController('importrule', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

    importcondition: apiController('importcond', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

    importaction: apiController('importaction', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),

    importtemplate: apiController('importtpl', {
        read: apiRead,
        create: apiCreate,
        update: apiUpdate,
        del: apiDelete,
        list: apiList,
    }),
};
