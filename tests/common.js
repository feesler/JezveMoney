


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
export function getIcon(icon)
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
export function findIconByTitle(val)
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
export function findIconByClassName(val)
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
export function isDate(obj)
{
	return (obj instanceof Date && !isNaN(obj.valueOf()));
}


// Check object is function
export function isFunction(obj)
{
	let getType = {};
	return obj && (getType.toString.call(obj) === '[object Function]' || typeof obj === 'function');
}


// Check object is {}
export function isObject(o)
{
	return null != o && typeof o === 'object' && Object.prototype.toString.call(o) === '[object Object]';
}


// Set parameters of object
export function setParam(obj, params)
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
export function convDate(dateStr)
{
	if (typeof dateStr !== 'string')
		return null;

	let res = Date.parse(dateStr.split('.').reverse().join('-'));
	if (isNaN(res))
		return null;

	return res;
}


// Format date as DD.MM.YYYY
export function formatDate(date, month, year)
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
export function cutDate(date)
{
	if (!isDate(date))
		return null;

	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}


// Convert Date object, timestamp or DD.MM.YYYY string to the timestamp of the start of day
export function fixDate(date)
{
	if (isDate(date))
		return cutDate(date);
	else if (typeof date === 'number')
		return cutDate(new Date(date));
	else
		return convDate(date);
}



// Format specified value
export function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


/*
*	Normalized decimal calculations
*/

// Fix string to correct float number format
export function fixFloat(str)
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
export function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
export function correctExch(val)
{
	return correct(val, 5);
}


// Normalize monetary value from string
export function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
export function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
export function isValidValue(val)
{
	return (val != undefined && val != null && !isNaN(parseFloat(fixFloat(val))));
}


/*
*	Other
*/

// Return deep copy of object
export function copyObject(item)
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


// Join parameters and values of object to URL
export function urlJoin(obj)
{
	let arr = [], par;

	if (!isObject(obj))
		return '';

	for(par in obj)
	{
		let val = obj[par];

		if (typeof val === 'undefined')
			continue;

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


export function formatProps(params)
{
	let res = [];
	for(let key in params)
		res.push(key + ': ' + params[key]);

	return res.join(', ');
}


export function checkPHPerrors(env, content)
{
	const errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>', 'xdebug-error'];

	if (!content)
		return true;

	let found = errSignatures.some(item => content.includes(item));

	if (found)
		throw new Error('PHP error signature found');
}


export function checkObjValue(obj, expectedObj, ret = false)
{
	let res = true;

	// undefined means no care
	if (typeof expectedObj === 'undefined')
		return true;

	if (!isObject(expectedObj) && !Array.isArray(expectedObj))
	{
		if (obj === expectedObj)
			return true;

		if (ret)
		{
		 	return { key : '',
						value : obj,
						expected : expectedObj };
		}
		else
		{
			throw new Error('Not expected value "' + obj + '", "' + expectedObj  + '" is expected');
		}
	}

	if (obj === expectedObj)
		return true;

	let value, expected;
	let expectedKeys = Object.getOwnPropertyNames(expectedObj);
	for(let vKey of expectedKeys)
	{
		if (obj == null || !(vKey in obj))
		{
			res = { key : vKey };
			break;
		}

		expected = expectedObj[vKey];
		value = obj[vKey];
		if (isObject(expected) || Array.isArray(expected))
		{
			res = checkObjValue(value, expected, true);
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
export async function test(descr, action, env, state)
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
