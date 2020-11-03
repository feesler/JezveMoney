import { isFunction, checkPHPerrors } from '../common.js';
import { route } from '../router.js';

export function visibilityResolver(elem, recursive) {
    let robj = elem;

    while (robj && robj.nodeType && robj.nodeType !== 9) {
        const cStyle = getComputedStyle(robj, '');
        if (
            !cStyle
            || cStyle.display === 'none'
            || cStyle.visibility === 'hidden'
        ) {
            return false;
        }

        if (recursive !== true) {
            break;
        }

        robj = robj.parentNode;
    }

    return !!robj;
}

export class Environment {
    constructor() {
        this.app = null;
        this.results = null;

        this.interface = [
            'baseUrl',
            'url',
            'navigation',
            'goTo',
            'parentNode',
            'query',
            'queryAll',
            'closest',
            'hasClass',
            'isVisible',
            'selectByValue',
            'onChange',
            'onBlur',
            'prop',
            'waitForSelector',
            'waitForFunction',
            'wait',
            'timeout',
            'global',
            'click',
            'input',
            'httpReq',
            'addResult',
            'setBlock',
            'setDuration',
            'getContent',
        ];
    }

    inject(target) {
        if (!this.app) {
            throw new Error('Environment is not initialized');
        }

        this.interface.forEach((method) => {
            if (!isFunction(this[method])) {
                throw new Error(`Method ${method} not implemented`);
            }

            if (!(method in target)) {
                Object.defineProperty(target, method, {
                    value: this[method].bind(this),
                    writable: false,
                    enumerable: false,
                });
            }
        });
    }

    async onNavigate() {
        const content = await this.getContent();
        checkPHPerrors(content);

        const ViewClass = await route(this, await this.url());
        this.app.view = new ViewClass({ environment: this });
        await this.app.view.parse();
    }

    async wait(condition, options) {
        if (typeof condition === 'string') {
            return this.waitForSelector(condition, options);
        }

        if (isFunction(condition)) {
            return this.waitForFunction(condition, options);
        }

        throw new Error('Invalid type of condition');
    }

    /** Wait for specified function until it return truly result or throw by timeout */
    async waitForFunction(condition, options = {}) {
        if (!options) {
            throw new Error('Invalid options specified');
        }
        if (!isFunction(condition)) {
            throw new Error('Invalid options specified');
        }

        return this.waitFor(async () => {
            const res = await condition();

            if (res) {
                return { value: res };
            }

            return false;
        }, options);
    }

    async waitFor(conditionFunc, options = {}) {
        const {
            timeout = 30000,
            polling = 200,
        } = options;

        return new Promise((resolve, reject) => {
            let qTimer = 0;
            const limit = setTimeout(() => {
                if (qTimer) {
                    clearTimeout(qTimer);
                }
                reject(new Error('Wait timeout'));
            }, timeout);

            async function queryCondition(condition) {
                const res = await condition();

                if (res) {
                    clearTimeout(limit);
                    resolve(res.value);
                } else {
                    qTimer = setTimeout(() => queryCondition(condition), polling);
                }
            }

            queryCondition.call(this, conditionFunc);
        });
    }

    async timeout(ms) {
        const delay = parseInt(ms, 10);
        if (Number.isNaN(delay)) {
            throw new Error('Invalid timeout specified');
        }

        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }

    /* eslint-disable-next-line no-unused-vars, no-empty-function */
    async init(appInstance) {
    }
}
