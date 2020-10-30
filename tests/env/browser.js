import '@babel/polyfill';
import 'core-js/features/url';
import 'core-js/features/url-search-params';
import 'whatwg-fetch';
import { setParam, formatTime, isFunction } from '../common.js';
import { App } from '../app.js';
import { Environment, visibilityResolver } from './base.js';

/* global ge, ce, onReady */

class BrowserEnvironment extends Environment {
    constructor() {
        super();

        this.vdoc = null;
        this.viewframe = null;
        this.restbl = null;
        this.totalRes = null;
        this.okRes = null;
        this.failRes = null;
        this.durationRes = null;
        this.base = null;
    }

    baseUrl() {
        return this.base;
    }

    async url() {
        return this.viewframe.contentWindow.location.href;
    }

    async parentNode(elem) {
        if (!elem) {
            return null;
        }

        return elem.parentNode;
    }

    async query(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.vdoc.documentElement;

        return (typeof selector === 'string') ? parent.querySelector(selector) : selector;
    }

    async queryAll(...args) {
        if (!args.length) {
            return null;
        }

        const parentSpecified = (args.length > 1);
        const selector = parentSpecified ? args[1] : args[0];
        const parent = parentSpecified ? args[0] : this.vdoc.documentElement;

        return (typeof selector === 'string')
            ? Array.from(parent.querySelectorAll(selector))
            : selector;
    }

    async closest(element, selector) {
        return (typeof selector === 'string') ? element.closest(selector) : selector;
    }

    async prop(elem, prop) {
        if (!elem || typeof prop !== 'string') {
            return null;
        }

        const propPath = prop.split('.');
        const res = propPath.reduce(
            (obj, propName) => (obj ? obj[propName] : null),
            elem,
        );

        return res;
    }

    // Wait for specified selector on page or return by timeout
    async waitForSelector(selector, options = {}) {
        const {
            timeout = 30000,
            visible = false,
            hidden = false,
        } = options;

        if (typeof selector !== 'string') {
            throw new Error('Invalid selector specified');
        }
        if (!!visible === !!hidden) {
            throw new Error('Invalid options specified');
        }

        return this.waitFor(() => {
            let res;

            const elem = this.vdoc.documentElement.querySelector(selector);
            if (elem) {
                const elemVisible = visibilityResolver(elem, true);
                res = ((visible && elemVisible) || (hidden && !elemVisible));
            } else {
                res = hidden;
            }

            if (res) {
                return { value: elem };
            }
            return false;
        }, { timeout });
    }

    async global(prop = '') {
        if (typeof prop !== 'string') {
            throw new Error('Invalid property path');
        }

        const propPath = prop.split('.');
        const res = propPath.reduce(
            (obj, propName) => (obj ? obj[propName] : null),
            this.viewframe.contentWindow,
        );

        return res;
    }

    async hasClass(elem, cl) {
        return elem.classList.contains(cl);
    }

    /** elem could be an id string or element handle */
    async isVisible(elem, recursive) {
        let relem = elem;
        if (typeof relem === 'string') {
            relem = await this.query(`#${relem}`);
        }

        return visibilityResolver(relem, recursive);
    }

    /* eslint-disable no-param-reassign */
    async selectByValue(selectObj, selValue, selBool) {
        if (!selectObj || !selectObj.options) {
            return -1;
        }

        for (let i = 0, l = selectObj.options.length; i < l; i += 1) {
            if (selectObj.options[i] && selectObj.options[i].value === selValue) {
                if (selectObj.multiple) {
                    selectObj.options[i].selected = (selBool !== undefined) ? selBool : true;
                } else {
                    selectObj.selectedIndex = i;
                }
                return true;
            }
        }

        return false;
    }
    /* eslint-enable no-param-reassign */

    async onChange(elem) {
        return elem.onchange();
    }

    async onBlur(elem) {
        return elem.onblur();
    }

    /* eslint-disable no-param-reassign */
    async input(elem, val) {
        if (elem.value === '' && val === '') {
            return;
        }

        elem.value = val;

        let event;
        if (typeof InputEvent !== 'function') {
            event = this.vdoc.createEvent('CustomEvent');
            event.initCustomEvent('input', true, true, {});
        } else {
            event = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
            });
        }

        elem.dispatchEvent(event);
    }
    /* eslint-enable no-param-reassign */

    async click(elem) {
        if (!elem) {
            return;
        }

        let event;
        if (typeof MouseEvent !== 'function') {
            event = this.vdoc.createEvent('MouseEvent');
            event.initMouseEvent('click',
                true, true, this.viewframe.contentWindow,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
        } else {
            event = new MouseEvent('click', {
                view: this.viewframe.contentWindow,
                bubbles: true,
                cancelable: true,
            });
        }

        elem.dispatchEvent(event);
    }

    async httpReq(method, url, data, headers) {
        const supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

        if (typeof method !== 'string') {
            throw new Error('Invalid method parameter specified');
        }

        const lmethod = method.toLowerCase();
        if (!supportedMethods.includes(lmethod)) {
            throw new Error(`Unexpected method ${lmethod}`);
        }

        const options = {
            method: lmethod,
            headers: {},
        };

        if (headers) {
            setParam(options.headers, headers);
        }

        if (lmethod === 'post' && data) {
            let postData;
            if (typeof data === 'string') {
                postData = data;
                options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }

            options.body = postData;
        }

        const resp = await fetch(url, options);
        const res = {
            status: resp.status,
            headers: resp.headers,
            body: await resp.text(),
            url: resp.url,
        };

        return res;
    }

    async addResult(descr, res) {
        const result = {
            descr,
            res,
            err: null,
            message: '',
        };

        if (result.descr instanceof Error) {
            result.err = result.descr;
            result.descr = result.err.descr;
            delete result.err.descr;
            result.res = false;
            result.message = result.err.message;
        }

        this.results.total += 1;
        if (res) {
            this.results.ok += 1;
        } else {
            this.results.fail += 1;
        }

        if (this.results.expected) {
            this.totalRes.textContent = `${this.results.total}/${this.results.expected}`;
        } else {
            this.totalRes.textContent = this.results.total;
        }
        this.okRes.textContent = this.results.ok;
        this.failRes.textContent = this.results.fail;

        const resStr = (result.res) ? 'OK' : 'FAIL';

        this.restbl.appendChild(
            ce('tr', {}, [
                ce('td', { textContent: result.descr }),
                ce('td', { textContent: resStr }),
                ce('td', { textContent: result.message }),
            ]),
        );

        if (result.err) {
            console.error(result.err);
        }
    }

    async setBlock(title, category) {
        this.restbl.appendChild(
            ce(
                'tr',
                { className: `res-block-${category}` },
                ce('td', { colSpan: 3, textContent: title }),
            ),
        );
    }

    setDuration(duration) {
        this.durationRes.textContent = formatTime(duration);
    }

    async getContent() {
        if (!this.vdoc || !this.vdoc.documentElement) {
            return '';
        }

        return this.vdoc.documentElement.innerHTML;
    }

    /* eslint-disable */
    scopedQuerySelectorPolyfill(view) {
        try {
            // test for scope support
            view.document.querySelector(':scope *');
        } catch (error) {
            (function (ElementPrototype) {
                // scope regex
                var scope = /:scope(?![\w-])/gi;

                // polyfill Element#querySelector
                var querySelectorWithScope = polyfill(ElementPrototype.querySelector);

                ElementPrototype.querySelector = function querySelector(selectors) {
                    return querySelectorWithScope.apply(this, arguments);
                };

                // polyfill Element#querySelectorAll
                var querySelectorAllWithScope = polyfill(ElementPrototype.querySelectorAll);

                ElementPrototype.querySelectorAll = function querySelectorAll(selectors) {
                    return querySelectorAllWithScope.apply(this, arguments);
                };

                // polyfill Element#matches
                if (ElementPrototype.matches) {
                    var matchesWithScope = polyfill(ElementPrototype.matches);

                    ElementPrototype.matches = function matches(selectors) {
                        return matchesWithScope.apply(this, arguments);
                    };
                }

                // polyfill Element#closest
                if (ElementPrototype.closest) {
                    var closestWithScope = polyfill(ElementPrototype.closest);

                    ElementPrototype.closest = function closest(selectors) {
                        return closestWithScope.apply(this, arguments);
                    };
                }

                function polyfill(qsa) {
                    return function (selectors) {
                        // whether the selectors contain :scope
                        var hasScope = selectors && scope.test(selectors);

                        if (hasScope) {
                            // fallback attribute
                            var attr = 'q' + Math.floor(Math.random() * 9000000) + 1000000;

                            // replace :scope with the fallback attribute
                            arguments[0] = selectors.replace(scope, '[' + attr + ']');

                            // add the fallback attribute
                            this.setAttribute(attr, '');

                            // results of the qsa
                            var elementOrNodeList = qsa.apply(this, arguments);

                            // remove the fallback attribute
                            this.removeAttribute(attr);

                            // return the results of the qsa
                            return elementOrNodeList;
                        }

                        // return the results of the qsa
                        return qsa.apply(this, arguments);
                    };
                }
            })(view.Element.prototype);
        }
    }
    /* eslint-enable */

    /** Apply polyfills not required by application, but needed for test engine */
    applyPolyfills(view) {
        this.scopedQuerySelectorPolyfill(view);
    }

    async navigation(action) {
        if (!isFunction(action)) {
            throw new Error('Wrong action specified');
        }

        const navPromise = new Promise((resolve, reject) => {
            this.viewframe.addEventListener('load', async () => {
                try {
                    this.vdoc = this.viewframe.contentWindow.document;
                    if (!this.vdoc) {
                        throw new Error('View document not found');
                    }

                    this.applyPolyfills(this.viewframe.contentWindow);

                    await this.onNavigate();

                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });

        await action();

        return navPromise;
    }

    async goTo(url) {
        await this.navigation(() => {
            this.viewframe.src = url;
        });
    }

    async init(appInstance) {
        if (!appInstance) {
            throw new Error('Invalid App');
        }

        this.app = appInstance;
        this.app.environment = this;

        const { origin } = window.location;
        this.base = origin;
        if (origin.includes('jezve.net')) {
            this.base += '/money/';
        } else {
            this.base += '/';
        }

        await this.app.init();

        this.startbtn = ge('startbtn');
        this.totalRes = ge('totalRes');
        this.okRes = ge('okRes');
        this.failRes = ge('failRes');
        this.durationRes = ge('durationRes');
        this.viewframe = ge('viewframe');
        this.restbl = ge('restbl');
        if (!this.startbtn
            || !this.totalRes
            || !this.okRes
            || !this.failRes
            || !this.durationRes
            || !this.viewframe
            || !this.restbl
        ) {
            throw new Error('Fail to init tests');
        }

        this.startbtn.addEventListener('click', async () => {
            try {
                this.results = {
                    total: 0,
                    ok: 0,
                    fail: 0,
                    expected: 0,
                };

                if (this.app.config.testsExpected) {
                    this.results.expected = this.app.config.testsExpected;
                }

                this.addResult('Test initialization', true);

                await this.goTo(this.base);
                await this.app.startTests();
            } catch (e) {
                this.addResult(e);
            }
        });
    }
}

onReady(() => {
    const env = new BrowserEnvironment();
    env.init(App);
});
