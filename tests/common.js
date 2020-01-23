// Types of transactions
const EXPENSE = 1;
const INCOME = 2;
const TRANSFER = 3;
const DEBT = 4;


// Return string for specified type of transaction
function getTransactionTypeStr(type)
{
	const typeToStr = {
		[EXPENSE] : 'expense',
		[INCOME] : 'income',
		[TRANSFER] : 'transfer',
		[DEBT] : 'debt'
	};

	if (!type || !(type in typeToStr))
		throw new Error('Unknown transaction type ' + type);

	return typeToStr[type];
}


// Available tile icons
const tileIcons = [
	{ id : 0, className : null, title : 'No icon' },
	{ id : 1, className : 'purse_icon', title : 'Purse' },
	{ id : 2, className : 'safe_icon', title : 'Safe' },
	{ id : 3, className : 'card_icon', title : 'Card' },
	{ id : 4, className : 'percent_icon', title : 'Percent' },
	{ id : 5, className : 'bank_icon', title : 'Bank' },
	{ id : 6, className : 'cash_icon', title : 'Cash' },
];


/**
 * Find icon by id
 * @param {int} icon - id of icon
 * @return {tileIconObject} or null if not found
 */
function getIcon(icon)
{
	let icon_id = parseInt(icon);
	if (isNaN(icon_id))
		return null;

	let res = tileIcons.find(item => item.id == icon_id);
	if (!res)
		return null;

	return res;
}


/**
 * Try to find icon by title string
 * @param {string} val - icon title
 * @return {tileIconObject}
 */
function findIconByTitle(val)
{
	let noIcon = tileIcons[0];

	if (typeof val !== 'string')
		return noIcon;

	let title = val.toUpperCase();
	let res = tileIcons.find(item => item.title.toUpperCase() == title);
	if (!res)
		return noIcon;

	return res;
}


/**
 * Try to find icon by class property of element
 * @param {string} val - className property of element
 * @return {tileIconObject}
 */
function findIconByClassName(val)
{
	let noIcon = tileIcons[0];

	if (typeof val !== 'string')
		return noIcon;

	let classList = val.split(' ');
	if (!classList.includes('tile_icon'))
		return noIcon;

	for(let item of tileIcons)
	{
		if (classList.includes(item.className))
			return item;
	}

	return noIcon;
}


// Check object is date
function isDate(obj)
{
	return (obj instanceof Date && !isNaN(obj.valueOf()));
}


// Check object is function
function isFunction(obj)
{
	let getType = {};
	return obj && (getType.toString.call(obj) === '[object Function]' || typeof obj === 'function');
}


// Check object is {}
function isObject(o)
{
	return null != o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}


// Set parameters of object
function setParam(obj, params)
{
	let par, val;

	if (!obj || !params || typeof params !== 'object')
		return;

	for(par in params)
	{
		val = params[par];
		if (Array.isArray(val))
		{
			obj[par] = val.map(function(item){ return item; });
		}
		else if (isObject(val))
		{
			if (obj[par] == null || obj[par] === undefined)
				obj[par] = {};

			setParam(obj[par], val);
		}
		else
		{
			try
			{
				obj[par] = val;
			}
			catch(e)
			{
				if (obj.setAttribute)
					obj.setAttribute(par, val);
			}
		}
	}
}


// Convert date string from DD.MM.YYYY to timestamp
function convDate(dateStr)
{
	if (typeof dateStr !== 'string')
		return null;

	let res = Date.parse(dateStr.split('.').reverse().join('-'));
	if (isNaN(res))
		return null;

	return res;
}


// Format date as DD.MM.YYYY
function formatDate(date, month, year)
{
	if (isDate(date) && !month && !year)
	{
		month = date.getMonth();
		year = date.getFullYear();
		date = date.getDate();
	}

	return ((date > 9) ? '' : '0') + date + '.' + ((month + 1 > 9) ? '' : '0') + (month + 1) + '.' + year;
}


// Return timestamp for the start of the day
function cutDate(date)
{
	if (!isDate(date))
		return null;

	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}


// Convert Date object, timestamp or DD.MM.YYYY string to the timestamp of the start of day
function fixDate(date)
{
	if (isDate(date))
		return cutDate(date);
	else if (typeof date === 'number')
		return cutDate(new Date(date));
	else
		return convDate(date);
}



// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


/*
*	Normalized decimal calculations
*/

// Fix string to correct float number format
function fixFloat(str)
{
	if (typeof(str) == "string")
	{
		str = str.replace(/,/g, '.');
		if (str.startsWith('.') || !str.length)
			str = '0' + str;
		return str;
	}
	else if (typeof(str) == "number")
		return str;
	else
		return null;
}


// Correct calculated value
function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
function correctExch(val)
{
	return correct(val, 5);
}


// Normalize monetary value from string
function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
function isValidValue(val)
{
	return (val != undefined && val != null && !isNaN(parseFloat(fixFloat(val))));
}


/*
*	Other
*/

// Return deep copy of object
function copyObject(item)
{
	if (Array.isArray(item))
	{
		return item.map(copyObject);
	}
	else if (isObject(item))
	{
		let res = {};
		for(let key in item)
		{
			res[key] = copyObject(item[key]);
		}

		return res;
	}
	else
	{
		return item;
	}
}


// Extend child prototype by parent
function extend(Child, Parent)
{
	function F(){};

	F.prototype = Parent.prototype;
	Child.prototype = new F();
	Child.prototype.constructor = Child;
	Child.parent = Parent.prototype;
}


// Join parameters and values of object to URL
function urlJoin(obj)
{
	let arr = [], par;

	if (!isObject(obj))
		return '';

	for(par in obj)
	{
		let val = obj[par];
		if (Array.isArray(val))
		{
			val.forEach(function(arrItem)
			{
				if (!isObject(arrItem))
					arr.push(encodeURIComponent(par) + '[]=' + encodeURIComponent(arrItem.toString()));
			});
		}
		else if (!isObject(val))
			arr.push(encodeURIComponent(par) + '=' + encodeURIComponent(val.toString()));
	}

	return arr.join('&');
}


function formatProps(params)
{
	let res = [];
	for(let key in params)
		res.push(key + ': ' + params[key]);

	return res.join(', ');
}


function checkPHPerrors(env, content)
{
	const errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>', 'xdebug-error'];

	if (!env)
		return false;
	if (!content)
		return true;

	let found = errSignatures.some(item => content.includes(item));

	if (found)
		env.addResult('PHP error signature found', false);
}


function checkObjValue(obj, expectedObj, ret = false)
{
	let res = true;

	if (obj === expectedObj)
		return true;

	let value, expected;
	let expectedKeys = Object.getOwnPropertyNames(expectedObj);
	for(let vKey of expectedKeys)
	{
		if (obj === null || !(vKey in obj))
		{
			res = { key : vKey };
			break;
		}

		expected = expectedObj[vKey];
		value = obj[vKey];
		if (isObject(expected) || Array.isArray(expected))
		{
			let res = checkObjValue(value, expected, true);
			if (res !== true)
			{
				res.key = vKey + '.' + res.key;
				break;
			}
		}
		else if (value !== expected)
		{
			res = { key : vKey,
						value : value,
						expected : expected };
			break;
		}
	}

	if (res !== true && !ret)
	{
		if ('expected' in res)
			throw new Error('Not expected value "' + res.value + '" for (' + res.key + ') "' + res.expected  + '" is expected');
		else
			throw new Error('Path (' + res.key + ') not found');
	}

	return res;
}



// Run action, check state and add result to the list
async function test(descr, action, env, state)
{
	try
	{
		let actRes = await action();
		let res;

		if (env && env.checkState)
		{
			let expState = (typeof state === 'undefined') ? env.expectedState : state;
			res = await env.checkState(expState);
		}
		else
		{
			res = actRes;
		}

		env.addResult(descr, res);
	}
	catch(e)
	{
		e.descr = descr;
		throw e;
	}
}


var commonModule = { EXPENSE,
					INCOME,
					TRANSFER,
					DEBT,
					getTransactionTypeStr,
					getIcon,
					findIconByTitle,
					findIconByClassName,
					isDate,
					isFunction,
					isObject,
					setParam,
					convDate,
					formatDate,
					cutDate,
					fixDate,
					formatValue,
					fixFloat,
					correct,
					correctExch,
					normalize,
					normalizeExch,
					isValidValue,
					copyObject,
					extend,
					urlJoin,
					formatProps,
					checkPHPerrors,
					checkObjValue,
					test };


export { commonModule as common };
