import '@babel/polyfill';
import 'core-js/features/url';
import 'core-js/features/url-search-params';
import 'whatwg-fetch';
import { setParam, formatTime, isFunction } from '../common.js';
import { App } from '../app.js';
import { Environment, visibilityResolver } from './base.js';


class BrowserEnvironment extends Environment
{
	constructor()
	{
		super();

		this.vdoc = null;
		this.viewframe = null;
		this.resContainer = null;
		this.restbl = null;
		this.totalRes = null;
		this.okRes = null
		this.failRes = null;
		this.durationRes = null;
		this.base = null;
	}


	baseUrl()
	{
		return this.base;
	}


	async url()
	{
		return this.viewframe.contentWindow.location.href;
	}


	async parentNode(elem)
	{
		if (!elem)
			return null;

		return elem.parentNode;
	}


	async query(...args)
	{
		if (!args.length)
			return null;

		let parentSpecified = (args.length > 1);
		let selector = parentSpecified ? args[1]: args[0];
		let parent = parentSpecified ? args[0] : this.vdoc.documentElement;

		return (typeof selector === 'string') ? parent.querySelector(selector) : selector;
	}


	async queryAll(...args)
	{
		if (!args.length)
			return null;

		let parentSpecified = (args.length > 1);
		let selector = parentSpecified ? args[1]: args[0];
		let parent = parentSpecified ? args[0] : this.vdoc.documentElement;

		return (typeof selector === 'string') ? Array.from(parent.querySelectorAll(selector)) : selector;
	}


	async closest(element, selector)
	{
		return (typeof selector === 'string') ? element.closest(selector) : selector;
	}


	async prop(elem, prop)
	{
		if (!elem || typeof prop !== 'string')
			return null;

		let res = elem;
		let propPath = prop.split('.');

		for(let propName of propPath)
		{
			if (!res)
				return res;
			res = res[propName];
		}

		return res;
	}


	// Wait for specified selector on page or return by timeout
	async waitForSelector(selector, options = {})
	{
		const {
			timeout = 30000,
			visible = false,
			hidden = false,
		} = options;
		
		if (typeof selector !== 'string')
			throw new Error('Invalid selector specified');
		if (!!visible == !!hidden)
			throw new Error('Invalid options specified');

		return this.waitFor(() =>
		{
			let res;

			let elem = this.vdoc.documentElement.querySelector(selector);
			if (elem)
			{
				let elemVisible = visibilityResolver(elem, true);
				res = ((visible && elemVisible) || (hidden && !elemVisible));
			}
			else
			{
				res = hidden;
			}

			if (res)
				return { value : elem };
			else
				return false;
		}, { timeout });
	}


	async global(prop)
	{
		let res = this.viewframe.contentWindow;
		let propPath = prop.split('.');

		for(let propName of propPath)
		{
			if (!res)
				return res;
			res = res[propName];
		}

		return res;
	}


	async hasClass(elem, cl)
	{
		return elem.classList.contains(cl);
	}


	// elem could be an id string or element handle
	async isVisible(elem, recursive)
	{
		if (typeof elem === 'string')
			elem = await vquery('#' + elem);

		return visibilityResolver(elem, recursive);
	}


	async selectByValue(selectObj, selValue, selBool)
	{
		if (!selectObj || !selectObj.options)
			return -1;

		for(let i = 0, l = selectObj.options.length; i < l; i++)
		{
			if (selectObj.options[i] && selectObj.options[i].value == selValue)
			{
				if (selectObj.multiple)
					selectObj.options[i].selected = (selBool !== undefined) ? selBool : true;
				else
					selectObj.selectedIndex = i;
				return true;
			}
		}

		return false;
	}


	async onChange(elem)
	{
		return elem.onchange();
	}


	async onBlur(elem)
	{
		return elem.onblur();
	}


	async input(elemObj, val)
	{
		if (elemObj.value == '' && val == '')
			return;

		elemObj.value = val;

		let event;
		if (typeof InputEvent !== 'function')
		{
			event = this.vdoc.createEvent('CustomEvent');
			event.initCustomEvent('input', true, true, {});
		}
		else
		{
			event = new InputEvent('input', {
				bubbles: true,
				cancelable: true,
			});
		}
		elemObj.dispatchEvent(event);
	}


	async click(elemObj)
	{
		if (!elemObj)
			return;

		let event;
		if (typeof MouseEvent !== 'function')
		{
			event = this.vdoc.createEvent('MouseEvent');
			event.initMouseEvent('click', 
				true, true, this.viewframe.contentWindow,
				0, 0, 0, 0, 0, false, false, false, false, 0, null);
		}
		else
		{
			event = new MouseEvent('click', {
				view: this.viewframe.contentWindow,
				bubbles: true,
				cancelable: true
			});
		}
		elemObj.dispatchEvent(event);
	}


	async httpReq(method, url, data, headers)
	{
		let supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

		method = method.toLowerCase();
		if (!supportedMethods.includes(method))
			reject('Unexpected method ' + method);

		let options = { method : method, headers : {} };

		if (headers)
			setParam(options.headers, headers);

		if (method == 'post' && data)
		{
			let postData;
			if (typeof data === 'string')
			{
				postData = data;
				options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			}
			else
			{
				postData = JSON.stringify(data);
				options.headers['Content-Type'] = 'application/json';
			}

			options.body = postData;
		}


		let resp = await fetch(url, options);

		let res = { status : resp.status,
		 			headers : resp.headers }

		res.body = await resp.text();

		return res;
	}


	async addResult(descr, res)
	{
		let err = null;
		let resStr;
		let message = '';

		if (descr instanceof Error)
		{
			err = descr;
			descr = err.descr;
			delete err.descr;
			res = false;
			message = err.message;
		}

		if (this.results.expected)
			this.totalRes.innerHTML = ++this.results.total + '/' + this.results.expected;
		else
			this.totalRes.innerHTML = ++this.results.total;
		this.okRes.innerHTML = (res) ? ++this.results.ok : this.results.ok;
		this.failRes.innerHTML = (res) ? this.results.fail : ++this.results.fail;

		resStr = (res ? 'OK' : 'FAIL');

		this.restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
											ce('td', { innerHTML : resStr }),
										 	ce('td', { innerHTML : message }) ]));

		this.resContainer.scrollTop = this.resContainer.scrollHeight;

		if (err)
			console.error(err);
	}


	async setBlock(title, category)
	{
		this.restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
	}


	setDuration(duration)
	{
		this.durationRes.innerText = formatTime(duration);
	}


	async getContent()
	{
		if (!this.vdoc || !this.vdoc.documentElement)
			return '';

		return this.vdoc.documentElement.innerHTML;
	}


	scopedQuerySelectorPolyfill(view)
	{
		try
		{
			// test for scope support
			view.document.querySelector(':scope *');
		}
		catch(error)
		{
			(function(ElementPrototype)
			{
				// scope regex
				var scope = /:scope(?![\w-])/gi;

				// polyfill Element#querySelector
				var querySelectorWithScope = polyfill(ElementPrototype.querySelector);

				ElementPrototype.querySelector = function querySelector(selectors)
				{
					return querySelectorWithScope.apply(this, arguments);
				};

				// polyfill Element#querySelectorAll
				var querySelectorAllWithScope = polyfill(ElementPrototype.querySelectorAll);

				ElementPrototype.querySelectorAll = function querySelectorAll(selectors)
				{
					return querySelectorAllWithScope.apply(this, arguments);
				};

				// polyfill Element#matches
				if (ElementPrototype.matches)
				{
					var matchesWithScope = polyfill(ElementPrototype.matches);

					ElementPrototype.matches = function matches(selectors)
					{
						return matchesWithScope.apply(this, arguments);
					};
				}

				// polyfill Element#closest
				if (ElementPrototype.closest)
				{
					var closestWithScope = polyfill(ElementPrototype.closest);

					ElementPrototype.closest = function closest(selectors)
					{
						return closestWithScope.apply(this, arguments);
					};
				}

				function polyfill(qsa)
				{
					return function(selectors)
					{
						// whether the selectors contain :scope
						var hasScope = selectors && scope.test(selectors);

						if (hasScope)
						{
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
						else
						{
							// return the results of the qsa
							return qsa.apply(this, arguments);
						}
					};
				}
			})(view.Element.prototype);
		}
	}


	// Apply polyfills not required by application, but needed for test engine
	applyPolyfills(view)
	{
		this.scopedQuerySelectorPolyfill(view);
	}


	async navigation(action)
	{
		if (!isFunction(action))
			throw new Error('Wrong action specified');

		let navPromise = new Promise((resolve, reject) =>
		{
			this.viewframe.addEventListener('load', async () =>
			{
				try
				{
					this.vdoc = this.viewframe.contentWindow.document;
					if (!this.vdoc)
						throw new Error('View document not found');

					this.applyPolyfills(this.viewframe.contentWindow);

					await this.onNavigate();

					resolve();
				}
				catch(e)
				{
					reject(e);
				}
			});
		});

		await action();

		return navPromise;
	}


	async goTo(url)
	{
		await this.navigation(() => this.viewframe.src = url);
	}


	async init(appInstance)
	{
		if (!appInstance)
			throw new Error('Invalid App');

		this.app = appInstance;
		this.app.environment = this;

		const origin = window.location.origin;
		if (origin.includes('jezve.net'))
			this.base = origin + '/money/';
		else
			this.base = origin + '/';

		await this.app.init();

		let startbtn = ge('startbtn');
		this.totalRes = ge('totalRes');
		this.okRes = ge('okRes');
		this.failRes = ge('failRes');
		this.durationRes = ge('durationRes');
		this.viewframe = ge('viewframe');
		this.resContainer = document.querySelector('.tbl_container');
		this.restbl = ge('restbl');
		if (!startbtn || !this.totalRes || !this.okRes || !this.failRes || !this.durationRes || !this.viewframe || !this.resContainer || !this.restbl)
			throw new Error('Fail to init tests');

		startbtn.onclick = async () =>
		{
			try
			{
				this.results = { total : 0, ok : 0, fail : 0, expected : 0 };

				if (this.app.config.testsExpected)
					this.results.expected = this.app.config.testsExpected;

				await this.addResult('Test initialization', true);

				await this.goTo(this.base);
				await this.app.startTests();
			}
			catch(e)
			{
				this.addResult(e);
			}
		};
	}

}

onReady(() =>
{
	let env = new BrowserEnvironment();
	env.init(App);
});
