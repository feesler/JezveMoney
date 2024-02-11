import { App } from '../Application/App.js';

/** Strings */
const MSG_REQUEST_FAIL = 'API request failed';

const defaultProps = {
    method: 'GET',
    data: null,
    cancelable: false,
    params: {},
    timeout: 30000,
    retryCount: 0,
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

        this.remainingTries = this.props.retryCount;
        this.requestTimeout = 0;
    }

    setAbortController() {
        let signal = null;
        if (this.props.cancelable) {
            this.abortController = new AbortController();
            ({ signal } = this.abortController);
        }

        this.reqOptions.signal = signal;
    }

    setupTimeout() {
        this.resetTimeout();

        const timeout = parseInt(this.props.timeout ?? 0, 10);
        if (timeout === 0) {
            return;
        }

        this.requestTimeout = setTimeout(() => {
            this.requestTimeout = 0;

            if (this.remainingTries > 0) {
                this.remainingTries -= 1;
            } else {
                throw new Error('Timeout');
            }

            this.send();
        }, timeout);
    }

    resetTimeout() {
        if (this.requestTimeout) {
            clearTimeout(this.requestTimeout);
            this.requestTimeout = 0;
        }
    }

    async send() {
        try {
            this.cancel();
            this.setAbortController();
            this.setupTimeout();

            this.response = await fetch(this.url, this.reqOptions);
            this.resetTimeout();
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
