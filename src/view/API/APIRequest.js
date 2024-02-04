import { App } from '../Application/App.js';

/** Strings */
const MSG_REQUEST_FAIL = 'API request failed';

const defaultProps = {
    method: 'GET',
    data: null,
    cancelable: false,
    params: {},
};

/**
 * API request class
 */
export class APIRequest {
    static create(props = {}) {
        return new this(props);
    }

    static createGet(props = {}) {
        return this.create({ method: 'GET', ...props });
    }

    static createPost(props = {}) {
        return this.create({ method: 'POST', ...props });
    }

    constructor(props = {}) {
        this.props = {
            ...defaultProps,
            ...props,
        };

        let signal = null;
        if (this.props.cancelable) {
            this.abortController = new AbortController();
            ({ signal } = this.abortController);
        }

        const {
            method,
            path,
            data,
            params,
        } = this.props;
        const isPOST = method.toLowerCase() === 'post';
        this.url = App.getURL(`api/${path}`);
        this.reqOptions = {
            method,
            headers: {},
            ...params,
            signal,
        };

        if (isPOST) {
            if (data instanceof FormData) {
                this.reqOptions.body = data;
            } else {
                this.reqOptions.headers['Content-Type'] = 'application/json';
                this.reqOptions.body = JSON.stringify(data);
            }
        } else if (data) {
            Object.entries(data).forEach(([name, value]) => {
                if (Array.isArray(value)) {
                    const arrayName = `${name}[]`;
                    value.forEach((item) => this.url.searchParams.append(arrayName, item));
                } else if (typeof value !== 'undefined' && value !== null) {
                    this.url.searchParams.set(name, value.toString());
                }
            });
        }
    }

    async send() {
        try {
            this.response = await fetch(this.url, this.reqOptions);
            this.apiResult = await this.response.json();

            if (this.apiResult?.result !== 'ok') {
                const errorMessage = (this.apiResult?.msg)
                    ? this.apiResult.msg
                    : MSG_REQUEST_FAIL;
                throw new Error(errorMessage);
            }

            return this.apiResult;
        } catch (e) {
            const aborted = e.name === 'AbortError';
            if (aborted) {
                return null;
            }

            throw e;
        }
    }

    cancel() {
        if (!this.props.cancelable) {
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
    }
}
