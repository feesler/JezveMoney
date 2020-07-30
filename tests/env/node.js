import process from 'process';
import http from 'http';
import https from 'https';
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import { setParam, formatTime, isFunction } from '../common.js';
import { Environment, visibilityResolver } from './base.js'


export class NodeEnvironment extends Environment
{
	constructor(...args)
	{
		super(...args);

		this.page = null;
		this.base = null;
		this.reqCookies = {};
		this.results = { total : 0, ok : 0, fail : 0, expected : 0 };
	}


	baseUrl()
	{
		return this.base;
	}


	async url()
	{
		return this.page.url();
	}


	async parentNode(elem)
	{
		if (!elem)
			return null;

		return elem.evaluateHandle((el) => el.parentNode);
	}


	async query(...args)
	{
		if (!args.length)
			return null;

		let parentSpecified = (args.length > 1);
		let selector = parentSpecified ? args[1]: args[0];
		let parent = parentSpecified ? args[0] : this.page;

		return (typeof selector === 'string') ? parent.$(selector) : selector;
	}


	async queryAll(...args)
	{
		if (!args.length)
			return null;

		let parentSpecified = (args.length > 1);
		let selector = parentSpecified ? args[1]: args[0];
		let parent = parentSpecified ? args[0] : this.page;

		return (typeof selector === 'string') ? parent.$$(selector) : selector;
	}


	async closest(elem, selector)
	{
		if (!elem || typeof selector !== 'string')
			return null;

		let res = await elem.evaluateHandle((el, sel) => el.closest(sel), selector);
		return res.asElement();
	}


	async prop(elem, prop)
	{
		if (!elem || typeof prop !== 'string')
			return null;

		return elem.evaluate((el, prop) =>
		{
			let res = el;
			let propPath = prop.split('.');

			for(let propName of propPath)
			{
				if (!res)
					return res;
				res = res[propName];
			}

			return res;
		}, prop);
	}


	async waitForSelector(selector, options)
	{
		return this.page.waitForSelector(selector, options);
	}


	async global(prop)
	{
		let windowHandle = await this.page.evaluateHandle(() => window);

		return this.page.evaluate((w, prop) =>
		{
			let res = w;
			let propPath = prop.split('.');

			for(let propName of propPath)
			{
				if (!res)
					return res;
				res = res[propName];
			}

			return res;
		}, windowHandle, prop);
	}


	async hasClass(elem, cl)
	{
		return elem.evaluate((el, cl) => el.classList.contains(cl), cl);
	}


	// elem could be an id string or element handle
	async isVisible(elem, recursive)
	{
		if (typeof elem === 'string')
			elem = await this.page.$('#' + elem);

		return elem.evaluate(visibilityResolver, recursive);
	}


	// Select item with specified value if exist
	async selectByValue(selectObj, selValue, selBool)
	{
		if (!selectObj)
			return false;

		let options = await this.prop(selectObj, 'options');
		if (!options)
			return false;

		for(let i = 0, l = options.length; i < l; i++)
		{
			let option = options[i];
			if (option && await this.prop(option, 'value') == selValue)
			{
				await option.evaluate((el, sel) => el.selected = (sel !== undefined) ? sel : true, selBool);
				return true;
			}
		}

		return false;
	}


	async click(elem)
	{
		return elem.click();
	}


	async input(elem, val)
	{
		if (val == '')
		{
			await elem.focus();
			await this.page.keyboard.down('ControlLeft');
			await this.page.keyboard.press('KeyA');
			await this.page.keyboard.up('ControlLeft');
			return this.page.keyboard.press('Delete');
		}
		else
		{
			await elem.evaluate(el => el.value = '');
			return elem.type(val);
		}
	}


	async onChange(elem)
	{
		return elem.evaluate(el => el.onchange());
	}


	async onBlur(elem)
	{
		return elem.evaluate(el => el.onblur());
	}


	// Split attribute-value string divided by separator
	splitSep(str, sep)
	{
		let sepPos = str.indexOf(sep);
		if (sepPos === -1)
			return null;

		return { name : str.substr(0, sepPos),
					value : str.substr(sepPos + 1) };
	}


	parseCookies(headers)
	{
		if (!headers)
			return null;

		let res = [];

		if (!('set-cookie' in headers))
			return res;

		let cookies = headers['set-cookie'];

		if (!Array.isArray(cookies))
			cookies = [ cookies ];

		for(let cookieStr of cookies)
		{
			let cookieAttributes = cookieStr.split(';');
			let cookieObj = {};

			for(let attr of cookieAttributes)
			{
				attr = this.splitSep(attr.trim(), '=');
				if (!attr)
					continue;

				if (typeof cookieObj.name === 'undefined')
				{
					cookieObj.name = attr.name;
					cookieObj.value = attr.value;
					cookieObj.attr = [];
				}
				else
				{
					cookieObj.attr[attr.name] = attr.value;
				}
			}

			res.push(cookieObj);
		}

		return res;
	}


	async httpReq(method, url, data, headers)
	{
		return new Promise((resolve, reject) =>
		{
			let supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

			method = method.toLowerCase();
			if (!supportedMethods.includes(method))
				reject(`Unexpected method ${method}`);

			let postData = null;
			let options = { method : method, headers : {} };

			if (headers)
				setParam(options.headers, headers);

			options.headers['Cookie'] = [];
			for(let cookieName in this.reqCookies)
			{
				let cookieVal = this.reqCookies[cookieName];
				options.headers['Cookie'].push(cookieName + '=' + cookieVal);
			}

			if (method == 'post' && data)
			{
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

				options.headers['Content-Length'] = Buffer.byteLength(postData);
			}

			const targetURL = new URL(url);
			const client = (targetURL.protocol.toLowerCase() === 'https:') ? https : http;

			let req = client.request(url, options, res =>
			{
				let body = '';

				res.setEncoding('utf8');
				res.on('data', chunk => body += chunk);
				res.on('end', () =>
				{
					let newCookies = this.parseCookies(res.headers);

					for(let cookie of newCookies)
					{
						if (cookie.value == '' || cookie.value == 'deleted')
							delete this.reqCookies[cookie.name];
						else
							this.reqCookies[cookie.name] = cookie.value;
					}

					resolve({ status : res.statusCode,
								headers : res.headers,
								body : body });
				});
			});

			if (postData)
				req.write(postData);

			req.on('error', e => reject(e.message));
			req.end();
		});
	}


	addResult(descr, res)
	{
		let err = null;
		let resStr;
		let message = null;

		if (descr instanceof Error)
		{
			err = descr;
			descr = err.descr;
			delete err.descr;
			res = false;
			message = err.message;
		}

		descr = (descr) ? descr + ': ' : '';
		message = (message) ? ' ' + message : '';

		if (res)
		{
			this.results.ok++;
			resStr = chalk.green('OK');
		}
		else
		{
			this.results.fail++;
			resStr = chalk.red('FAIL');
		}

		let counter = ++this.results.total;
		if (this.results.expected)
			counter += '/' + this.results.expected;

		console.log('[' + counter + '] ' + descr + resStr + message);

		if (err)
			console.error(err);
	}


	setBlock(title, category)
	{
		if (category == 1)
			title = chalk.whiteBright.bgBlue(' ' + title + ' ');
		else if (category == 2)
			title = chalk.black.bgGreen(' ' + title + ' ');
		else if (category == 3)
			title = chalk.cyan(' ' + title + ' ');

		console.log(title);
	}


	setDuration(duration)
	{
		console.log('Duration of tests: ' + formatTime(duration));
	}


	async getContent()
	{
		return this.page.content();
	}


	async navigation(action)
	{
		if (!isFunction(action))
			throw new Error('Wrong action specified');

		let navPromise = new Promise((resolve, reject) =>
		{
			this.page.once('load', async () =>
			{
				try
				{
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
		await this.navigation(() => this.page.goto(url));
	}


	async init(appInstance)
	{
		let res = 1;
		let browser;

		try
		{
			if (!appInstance)
				throw new Error('Invalid App');

			this.app = appInstance;
			this.app.environment = this;

			if (!this.app.config || !this.app.config.nodeURL)
				throw new Error('Invalid config: test URL not found');
			this.base = this.app.config.nodeURL;

			this.results = { total : 0, ok : 0, fail : 0, expected : 0 };

			if (this.app.config.testsExpected)
				this.results.expected = this.app.config.testsExpected;

			await this.app.init();

			browser = await puppeteer.launch({ headless : true,
												args : [ '--proxy-server="direct://"',
															'--proxy-bypass-list=*' ] });
			let allPages = await browser.pages();
			this.page = (allPages.length) ? allPages[0] : await browser.newPage();

			await this.addResult('Test initialization', true);

			await this.goTo(this.base);
			await this.app.startTests();
			res = 0;
		}
		catch(e)
		{
			this.addResult(e);
		}

		if (browser)
			await browser.close();

		console.log(`Total: ${this.results.total} Passed: ${this.results.ok} Failed: ${this.results.fail}`);

		process.exit(res);
	}


}
