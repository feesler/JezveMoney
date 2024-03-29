import { asArray } from '@jezvejs/types';
import { APIRequest } from './APIRequest.js';

/** Send GET API request */
export const apiGet = (path, data, params) => (
    APIRequest.createGet({ path, data, params }).send()
);

/** Send GET API request */
export const apiPost = (path, data, params) => (
    APIRequest.createPost({ path, data, params }).send()
);

/** Send GET request for items by ids */
export const idsRequest = (path, val) => {
    if (!path) {
        throw new Error('Invalid request path');
    }

    const ids = asArray(val);
    if (ids.length === 0) {
        throw new Error('Invalid request ids');
    }

    return (ids.length === 1)
        ? apiGet(`${path}${ids[0]}`)
        : apiGet(path, { id: ids });
};

export const API = {
    profile: {
        async changePassword(currentPassword, newPassword) {
            return apiPost('profile/changepass', {
                current: currentPassword,
                new: newPassword,
            });
        },

        async changeName(name) {
            return apiPost('profile/changename', { name });
        },

        async reset(options) {
            return apiPost('profile/reset', options);
        },

        async updateSettings(options) {
            return apiPost('profile/updateSettings', options);
        },

        async del() {
            return apiPost('profile/del');
        },
    },

    userCurrency: {
        async list(options = {}) {
            return apiGet('usercurrency/list', options);
        },

        async read(data) {
            return idsRequest('usercurrency/', data);
        },

        async create(data) {
            return apiPost('usercurrency/create', data);
        },

        async update(data) {
            return apiPost('usercurrency/update', data);
        },

        async del(data) {
            return apiPost('usercurrency/delete', data);
        },

        async setPos(data) {
            return apiPost('usercurrency/setpos', data);
        },
    },

    state: {
        async main() {
            return apiGet('state/main');
        },
    },

    account: {
        async list(options = {}) {
            return apiGet('account/list', options);
        },

        async read(data) {
            return idsRequest('account/', data);
        },

        async create(data) {
            return apiPost('account/create', data);
        },

        async update(data) {
            return apiPost('account/update', data);
        },

        async del(data) {
            return apiPost('account/delete', data);
        },

        async show(data) {
            return apiPost('account/show', data);
        },

        async hide(data) {
            return apiPost('account/hide', data);
        },

        async setPos(data) {
            return apiPost('account/setpos', data);
        },
    },

    person: {
        async list(options = {}) {
            return apiGet('person/list', options);
        },

        async read(data) {
            return idsRequest('person/', data);
        },

        async create(data) {
            return apiPost('person/create', data);
        },

        async update(data) {
            return apiPost('person/update', data);
        },

        async del(data) {
            return apiPost('person/delete', data);
        },

        async show(data) {
            return apiPost('person/show', data);
        },

        async hide(data) {
            return apiPost('person/hide', data);
        },

        async setPos(data) {
            return apiPost('person/setpos', data);
        },
    },

    category: {
        async list(options = {}) {
            return apiGet('category/list', options);
        },

        async read(data) {
            return idsRequest('category/', data);
        },

        async create(data) {
            return apiPost('category/create', data);
        },

        async update(data) {
            return apiPost('category/update', data);
        },

        async setPos(data) {
            return apiPost('category/setpos', data);
        },

        async del(data) {
            return apiPost('category/delete', data);
        },
    },

    transaction: {
        async list(options = {}, requestOptions = {}) {
            const data = {
                order: 'desc',
                ...options,
            };

            return apiGet('transaction/list', data, requestOptions);
        },

        async read(data) {
            return idsRequest('transaction/', data);
        },

        async create(data) {
            return apiPost('transaction/create', data);
        },

        async update(data) {
            return apiPost('transaction/update', data);
        },

        async del(data) {
            return apiPost('transaction/delete', data);
        },

        async setCategory(data) {
            return apiPost('transaction/setCategory', data);
        },

        async setPos(data) {
            return apiPost('transaction/setpos', data);
        },

        async statistics(options = {}, requestOptions = {}) {
            return apiGet('transaction/statistics', options, requestOptions);
        },
    },

    schedule: {
        async list(options = {}) {
            return apiGet('schedule/list', options);
        },

        async read(data) {
            return idsRequest('schedule/', data);
        },

        async create(data) {
            return apiPost('schedule/create', data);
        },

        async update(data) {
            return apiPost('schedule/update', data);
        },

        async finish(data) {
            return apiPost('schedule/finish', data);
        },

        async del(data) {
            return apiPost('schedule/delete', data);
        },
    },

    reminder: {
        async list(options = {}) {
            return apiGet('reminder/list', options);
        },

        async read(data) {
            return idsRequest('reminder/', data);
        },

        async upcoming(options = {}) {
            return apiGet('reminder/upcoming', options);
        },

        async confirm(data) {
            return apiPost('reminder/confirm', data);
        },

        async cancel(data) {
            return apiPost('reminder/cancel', data);
        },
    },

    import: {
        async upload(data, requestOptions = {}) {
            return apiPost('import/upload', data, requestOptions);
        },
    },

    importTemplate: {
        async read(data) {
            return idsRequest('importtpl/', data);
        },

        async create(data) {
            return apiPost('importtpl/create', data);
        },

        async update(data) {
            return apiPost('importtpl/update', data);
        },

        async del(data) {
            return apiPost('importtpl/delete', data);
        },

        async list(options = {}) {
            return apiGet('importtpl/list', options);
        },
    },

    importRule: {
        async read(data) {
            return idsRequest('importrule/', data);
        },

        async create(data) {
            return apiPost('importrule/create', data);
        },

        async update(data) {
            return apiPost('importrule/update', data);
        },

        async del(data) {
            return apiPost('importrule/delete', data);
        },

        async list(options = {}) {
            return apiGet('importrule/list', options);
        },
    },
};
