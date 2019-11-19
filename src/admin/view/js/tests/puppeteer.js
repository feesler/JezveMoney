const process = require('process');
const puppeteer = require('puppeteer');
const chalk = require('chalk');
const common = require('./common.js');
const route = require('./router.js');
const main = require('./main.js');


var Environment = (function()
{
	var browserPage = null;
	var baseURL = null;
	var results = null;


	function getBaseUrl()
	{
		return baseURL;
	}


	async function getUrl()
	{
		return browserPage.url();
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
		let parent = parentSpecified ? arguments[0] : browserPage;

		return (typeof query === 'string') ? parent.$(query) : query;
	}


	async function vqueryall()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : browserPage;

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


	async function getGlobal(prop)
	{
		let windowHandle = await browserPage.evaluateHandle(() => window);

		return browserPage.evaluate((w, prop) =>
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
			elem = browserPage.$('#' + elem);

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
			await browserPage.keyboard.down('ControlLeft');
			await browserPage.keyboard.press('KeyA');
			await browserPage.keyboard.up('ControlLeft');
			return browserPage.keyboard.press('Delete');
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


	function addResult(descr, res, message)
	{
		if (res)
			results.ok++;
		else
			results.fail++;

		let counter = ++results.total;
		if (results.expected)
			counter += '/' + results.expected;

		console.log('[' + counter + '] ' + descr + ': ' + (res ? chalk.green('OK') : chalk.red('FAIL')) + (message ? ' ' + message : ''));
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
			browserPage.once('load', async () =>
			{
				let content = await browserPage.content();

				common.checkPHPerrors(Environment, content);

				let viewClass = await route(Environment, await getUrl());

				let view = new viewClass({ environment : Environment });
				resolve(view.parse());
			});
		});

		await action();

		return navPromise;
	}


	async function initTests(config, navHandler)
	{
		let res = 1;
		let view;
		let browser;

		try
		{
			results = { total : 0, ok : 0, fail : 0, expected : 0 };

			if (!config || !config.url)
				throw new Error('Invalid config: test URL not found');

			baseURL = config.url;

			if (config.testsExpected)
				results.expected = config.testsExpected;

			browser = await puppeteer.launch({ headless : true,
												args : [ '--proxy-server="direct://"',
															'--proxy-bypass-list=*' ] });
			let allPages = await browser.pages();
			browserPage = (allPages.length) ? allPages[0] : await browser.newPage();
			browserPage.setDefaultNavigationTimeout(0);

			await addResult('Test initialization', true);

			view = await navigation(() => browserPage.goto(baseURL));
			view = await navHandler(view);
			res = 0;
		}
		catch(msg)
		{
			addResult(msg, false);
		}

		if (browser)
			await browser.close();

		process.exit(res);
	}


	return { init : initTests,
				baseUrl : getBaseUrl,
				url : getUrl,
				navigation : navigation,
				parent : vparent,
				query : vquery,
				queryAll : vqueryall,
				hasClass : hasClass,
				isVisible : isVisible,
				selectByValue : selectByValue,
				onChange : onChangeEmul,
				prop : vprop,
				global : getGlobal,
				click : clickEmul,
				input : inputEmul,
				addResult : addResult,
				setBlock : setBlock };
})();


Environment.init(main.config, main.startTests);
