import { setParam, urlJoin, isFunction, checkPHPerrors } from '../common.js';
import { route } from '../router.js';
import { App } from '../app.js';
import { Environment } from './base.js';


class BrowserEnvironment extends Environment
{
	constructor()
	{
		super();

		this.vdoc = null;
		this.viewframe = null;
		this.restbl = null;
		this.totalRes = null;
		this.okRes = null
		this.failRes = null;
		this.baseURL = null;
	}


	baseUrl()
	{
		return baseURL;
	}


	async url()
	{
		return this.viewframe.contentWindow.location.href;
	}


	async parent(elem)
	{
		if (!elem)
			return null;

		return elem.parentNode;
	}


	async query()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : this.vdoc;

		return (typeof query === 'string') ? parent.querySelector(query) : query;
	}


	async queryAll()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : this.vdoc;

		return (typeof query === 'string') ? parent.querySelectorAll(query) : query;
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


	async wait(selector, options)
	{
		options = options || {};
		let timeout = options.timeout || 30000;
		let visible = options.visible || false;
		let hidden = options.hidden || false;

		return new Promise((resolve, reject) =>
		{
			let qTimer = 0;
			let limit = setTimeout(() =>
			{
				if (qTimer)
					clearTimeout(qTimer);
				throw new Error('wait(' + selector + ') timeout');
			}, timeout);

			async function queryFun()
			{
				let meetCond = false;
				let res = await this.query(selector);
				if (res)
				{
					if (visible || hidden)
					{
						let selVisibility = await this.isVisible(res, true);
						meetCond = ((visible && selVisibility) || (hidden && !selVisibility));
					}
					else
					{
						meetCond = true;
					}
				}

				if (meetCond)
				{
					clearTimeout(limit);
					resolve(res);
				}
				else
				{
					qTimer = setTimeout(queryFun.bind(this), 200);
				}
			}

			queryFun.call(this);
		});
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

		let robj = elem;
		while(robj && robj.nodeType && robj.nodeType != 9)
		{
			if (!robj.style || robj.style.display == 'none')
				return false;

			if (recursive !== true)
				break;

			robj = robj.parentNode;
		}

		return !!robj;
	}


	async selectByValue(selectObj, selValue, selBool)
	{
		let i;

		if (!selectObj || !selectObj.options)
			return -1;

		for(i = 0, l = selectObj.options.length; i < l; i++)
		{
			if (selectObj.options[i] && selectObj.options[i].value == selValue)
			{
				selectObj.options[i].selected = (selBool !== undefined) ? selBool : true;
				return true;
			}
		}

		return false;
	}


	async onChange(elem)
	{
		return elem.onchange();
	}


	async input(elemObj, val)
	{
		elemObj.value = val;
		if (elemObj.oninput)
			elemObj.oninput();
	}


	async click(elemObj)
	{
		if (elemObj.click)
		{
			elemObj.click();
		}
		else if (document.createEvent)
		{
			let evt = document.createEvent('MouseEvents');
			evt.initMouseEvent('click', true, true, this.viewframe.contentWindow,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
			let allowDefault = elemObj.dispatchEvent(evt);
		}
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
			let postData = (typeof data === 'string') ? data : urlJoin(data);

			let encoder = new TextEncoder();
			let uint8Array = encoder.encode(postData);

			setParam(options.headers,
								{ 'Content-Type' : 'application/x-www-form-urlencoded',
									'Content-Length' : uint8Array.length });
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

		if (err)
			console.error(err);
	}


	async setBlock(title, category)
	{
		this.restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
	}


	async navigation(action)
	{
		let navPromise = new Promise((resolve, reject) =>
		{
			this.viewframe.onload = async () =>
			{
				try
				{
					this.vdoc = this.viewframe.contentWindow.document;
					if (!this.vdoc)
						throw new Error('View document not found');

					checkPHPerrors(this, this.vdoc.documentElement.innerHTML);

					let viewClass = await route(this, await this.url());

					this.app.view = new viewClass({ environment : this });
					await this.app.view.parse();

					resolve();
				}
				catch(e)
				{
					reject(e);
				}
			};
		});

		if (isFunction(action))
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
		await this.app.init();

		if (!this.app.config || !this.app.config.url)
			throw new Error('Invalid config: test URL not found');

		let startbtn = ge('startbtn');
		this.totalRes = ge('totalRes');
		this.okRes = ge('okRes');
		this.failRes = ge('failRes');
		this.viewframe = ge('viewframe');
		this.restbl = ge('restbl');
		if (!startbtn || !this.totalRes || !this.okRes || !this.failRes || !this.viewframe || !this.restbl)
			throw new Error('Fail to init tests');

		this.baseURL = this.app.config.url;

		startbtn.onclick = async () =>
		{
			try
			{
				this.results = { total : 0, ok : 0, fail : 0, expected : 0 };

				if (this.app.config.testsExpected)
					this.results.expected = this.app.config.testsExpected;

				await this.addResult('Test initialization', true);

				await this.goTo(this.baseURL);
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
