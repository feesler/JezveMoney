import process from 'process';
import http from 'http';
import puppeteer from 'puppeteer';
import chalk from 'chalk';
import { common } from './common.js';
import { route } from './router.js';
import { App } from './main.js';


var Environment = (function()
{
	let page = null;
	let baseURL = null;
	let results = null;
	let app = null;
	let reqCookies = {};


	function getBaseUrl()
	{
		return baseURL;
	}


	async function getUrl()
	{
		return page.url();
	}


	async function vparent(elem)
	{
		if (!elem)
			return null;

		return elem.evaluateHandle((el) => el.parentNode);
	}


	async function vquery()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : page;

		return (typeof query === 'string') ? parent.$(query) : query;
	}


	async function vqueryall()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : page;

		return (typeof query === 'string') ? parent.$$(query) : query;
	}


	async function vprop(elem, prop)
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


	async function waitFor(selector, options)
	{
		return page.waitForSelector(selector, options);
	}


	async function getGlobal(prop)
	{
		let windowHandle = await page.evaluateHandle(() => window);

		return page.evaluate((w, prop) =>
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


	async function hasClass(elem, cl)
	{
		return elem.evaluate((el, cl) => el.classList.contains(cl), cl);
	}


	// elem could be an id string or element handle
	async function isVisible(elem, recursive)
	{
		if (typeof elem === 'string')
			elem = page.$('#' + elem);

		return elem.evaluate((el, r) =>
		{
			let robj = el;
			while(robj && robj.nodeType && robj.nodeType != 9)
			{
				if (!robj.style || robj.style.display == 'none')
					return false;

				if (r !== true)
					break;

				robj = robj.parentNode;
			}

			return !!robj;
		}, recursive);
	}


	// Select item with specified value if exist
	async function selectByValue(selectObj, selValue, selBool)
	{
		if (!selectObj)
			return false;

		let options = await vprop(selectObj, 'options');
		if (!options)
			return false;

		for(let i = 0, l = options.length; i < l; i++)
		{
			let option = options[i];
			if (option && await vprop(option, 'value') == selValue)
			{
				await option.evaluate((el, sel) => el.selected = (sel !== undefined) ? sel : true, selBool);
				return true;
			}
		}

		return false;
	}


	async function clickEmul(elem)
	{
		return elem.click();
	}


	async function inputEmul(elem, val)
	{
		if (val == '')
		{
			await elem.focus();
			await page.keyboard.down('ControlLeft');
			await page.keyboard.press('KeyA');
			await page.keyboard.up('ControlLeft');
			return page.keyboard.press('Delete');
		}
		else
		{
			await elem.evaluate(el => el.value = '');
			return elem.type(val);
		}
	}


	async function onChangeEmul(elem)
	{
		return elem.evaluate(el => el.onchange());
	}


	// Split attribute-value string divided by separator
	function splitSep(str, sep)
	{
		let sepPos = str.indexOf(sep);
		if (sepPos === -1)
			return null;

		return { name : str.substr(0, sepPos),
					value : str.substr(sepPos + 1) };
	}


	function parseCookies(headers)
	{
		if (!headers)
			return null;

		let res = [];

		if (!('set-cookie' in headers))
			return res;

		let cookies = headers['set-cookie'];

		if (!common.isArray(cookies))
			cookies = [ cookies ];

		for(let cookieStr of cookies)
		{
			let cookieAttributes = cookieStr.split(';');
			let cookieObj = {};

			for(let attr of cookieAttributes)
			{
				attr = splitSep(attr.trim(), '=');
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


	async function httpRequest(method, url, data, headers)
	{
		return new Promise((resolve, reject) =>
		{
			let supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

			method = method.toLowerCase();
			if (supportedMethods.indexOf(method) == -1)
				reject('Unexpected method ' + method);

			let postData = null;
			let options = { method : method, headers : {} };

			if (headers)
				common.setParam(options.headers, headers);

			options.headers['Cookie'] = [];
			for(let cookieName in reqCookies)
			{
				let cookieVal = reqCookies[cookieName];
				options.headers['Cookie'].push(cookieName + '=' + cookieVal);
			}

			if (method == 'post' && data)
			{
				postData = common.urlJoin(data);

				common.setParam(options.headers,
									{ 'Content-Type' : 'application/x-www-form-urlencoded',
										'Content-Length' : Buffer.byteLength(postData) });
			}


			let req = http.request(url, options, res =>
			{
				let body = '';

				res.setEncoding('utf8');
				res.on('data', chunk => body += chunk);
				res.on('end', () =>
				{
					let newCookies = parseCookies(res.headers);

					for(let cookie of newCookies)
					{
						if (cookie.value == '')
							delete reqCookies[cookie.name];
						else
							reqCookies[cookie.name] = cookie.value;
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


	function addResult(descr, res)
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
			results.ok++;
			resStr = chalk.green('OK');
		}
		else
		{
			results.fail++;
			resStr = chalk.red('FAIL');
		}

		let counter = ++results.total;
		if (results.expected)
			counter += '/' + results.expected;

		console.log('[' + counter + '] ' + descr + resStr + message);

		if (err)
			console.error(err);
	}


	function setBlock(title, category)
	{
		if (category == 1)
			title = chalk.whiteBright.bgBlue(' ' + title + ' ');
		else if (category == 2)
			title = chalk.whiteBright.bgBlueBright(' ' + title + ' ');
		else if (category == 3)
			title = chalk.whiteBright(' ' + title + ' ');

		console.log(title);
	}


	async function navigation(action)
	{
		if (!common.isFunction(action))
			throw new Error('Wrong action specified');

		let navPromise = new Promise((resolve, reject) =>
		{
			page.once('load', async () =>
			{
				let content = await page.content();

				common.checkPHPerrors(Environment, content);

				let viewClass = await route(Environment, await getUrl());

				app.view = new viewClass({ app : app, environment : Environment });
				await app.view.parse();

				resolve();
			});
		});

		await action();

		return navPromise;
	}


	async function goTo(url)
	{
		await navigation(() => page.goto(url));
	}


	async function initTests(appInstance)
	{
		let res = 1;
		let view;
		let browser;

		try
		{
			app = appInstance;

			results = { total : 0, ok : 0, fail : 0, expected : 0 };

			if (!app)
				throw new Error('Invalid App');

			if (!app.config || !app.config.url)
				throw new Error('Invalid config: test URL not found');

			baseURL = app.config.url;

			if (app.config.testsExpected)
				results.expected = app.config.testsExpected;

			browser = await puppeteer.launch({ headless : true,
												args : [ '--proxy-server="direct://"',
															'--proxy-bypass-list=*' ] });
			let allPages = await browser.pages();
			page = (allPages.length) ? allPages[0] : await browser.newPage();

			await addResult('Test initialization', true);

			await goTo(baseURL);
			await app.startTests();
			res = 0;
		}
		catch(e)
		{
			addResult(e);
		}

		if (browser)
			await browser.close();

		console.log('Total: ' + results.total + ' Passed: ' + results.ok + ' Failed: ' + results.fail);

		process.exit(res);
	}


	return { init : initTests,
				baseUrl : getBaseUrl,
				url : getUrl,
				navigation,
				goTo,
				parent : vparent,
				query : vquery,
				queryAll : vqueryall,
				hasClass,
				isVisible,
				selectByValue,
				onChange : onChangeEmul,
				prop : vprop,
				wait : waitFor,
				global : getGlobal,
				click : clickEmul,
				input : inputEmul,
				httpReq : httpRequest,
				addResult,
				setBlock };
})();


Environment.init(App);
