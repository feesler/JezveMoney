/** Strings */
const MSG_REQUEST_FAIL = 'API request failed';

/** Send API request */
const apiRequest = async (method, path, data = null, headers = {}) => {
    const { baseURL } = window.app;
    const isPOST = method.toLowerCase() === 'post';
    const url = new URL(`${baseURL}api/${path}`);
    const options = { method, headers };

    if (isPOST) {
        if (data instanceof FormData) {
            options.body = data;
        } else {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(data);
        }
    } else if (data) {
        Object.entries(data).forEach(([name, value]) => {
            if (Array.isArray(value)) {
                const arrayName = `${name}[]`;
                value.forEach((item) => url.searchParams.append(arrayName, item));
            } else {
                url.searchParams.set(name, value.toString());
            }
        });
    }

    const response = await fetch(url, options);
    const apiResult = await response.json();
    if (apiResult?.result !== 'ok') {
        const errorMessage = (apiResult?.msg) ? apiResult.msg : MSG_REQUEST_FAIL;
        throw new Error(errorMessage);
    }

    return apiResult;
};

/** Send GET API request */
const apiGet = (...args) => apiRequest('GET', ...args);
/** Send GET API request */
const apiPost = (...args) => apiRequest('POST', ...args);

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
    },

    transaction: {
        async createMultiple(data) {
            return apiPost('transaction/createMultiple', data);
        },

        async list(options = {}) {
            const requestOptions = {
                order: 'desc',
                ...options,
            };

            return apiGet('transaction/list', requestOptions);
        },

        async setPos(id, pos) {
            return apiPost('transaction/setpos', { id, pos });
        },
    },

    import: {
        async upload(data, headers = {}) {
            return apiPost('import/upload', data, headers);
        },
    },

    importTemplate: {
        async create(data) {
            return apiPost('importtpl/create', data);
        },

        async update(data) {
            return apiPost('importtpl/update', data);
        },

        async del(id) {
            return apiPost('importtpl/delete', { id });
        },

        async list(options = {}) {
            return apiGet('importtpl/list', options);
        },
    },

    importRule: {
        async create(data) {
            return apiPost('importrule/create', data);
        },

        async update(data) {
            return apiPost('importrule/update', data);
        },

        async del(id) {
            return apiPost('importrule/delete', { id });
        },

        async list(options = {}) {
            return apiGet('importrule/list', options);
        },
    },
};