const process = require('process');
const puppeteer = require('puppeteer');
const _ = require('../../../../view/js/common.js');
const common = require('./common.js');
const route = require('./router.js');

const main = require('./main.js');
var browserPage = null;


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
	console.log(descr + ': ' + (res ? 'OK' : 'FAIL') + (message ? ' ' + message : ''));
}


function setBlock(title, category)
{
	console.log(title);
}


async function navigation(action)
{
	if (!_.isFunction(action))
		throw new Error('Wrong action specified');

	let navPromise = new Promise((resolve, reject) =>
	{
		browserPage.once('load', async () =>
		{
			let content = await browserPage.content();

			common.checkPHPerrors(content);

			let pageClass = await route(Environment, await getUrl());

			let view = new pageClass({ environment : Environment });
			resolve(view.parse());
		});
	});

	await action();

	return navPromise;
}


var Environment = { init : async () => {},
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

(async () =>
{
	let res = 1;
	let page;
	let browser;

	try
	{
		browser = await puppeteer.launch();
		browserPage = await browser.newPage();

		page = await navigation(() => browserPage.goto('https://jezve.net/money/'));
		page = await main.startTests(page);
		res = 0;
	}
	catch(msg)
	{
		addResult(msg, false);
	}

	if (browser)
		await browser.close();

	process.exit(res);
})();
