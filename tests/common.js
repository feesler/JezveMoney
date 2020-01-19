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


/*
*	Currencies
*/

// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Currency object constructor
function Currency(props)
{
	this.id = props.id;
	this.format = props.format;
	this.sign = props.sign;
	this.name = props.name;
}


// Format specified value using rules of currency
Currency.prototype.formatValue = function(val)
{
	let nval = normalize(val);

	if (Math.floor(nval) != nval)
		nval = nval.toFixed(2);

	let fmtVal = formatValue(nval);

	if (this.format)
		return this.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + this.sign;
};


// Return currency object for specified id
function getCurrency(curr_id, currList)
{
	let currObj = currList.find(item => item.id == curr_id);
	if (!currObj)
		return null;

	return new Currency(currObj);
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id, currList)
{
	let curr, nval, fmtVal;

	curr = getCurrency(curr_id, currList);
	if (!curr)
		return null;

	nval = normalize(val);
	if (Math.floor(nval) == nval)
		fmtVal = formatValue(nval);
	else
		fmtVal = formatValue(nval.toFixed(2));
	if (curr.format)
		return curr.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + curr.sign;
}


/*
*	Persons
*/
function getPersonByAcc(persons, acc_id)
{
	return persons.find(p =>
	{
		return p.accounts && p.accounts.some(a => a.id == acc_id);
	});
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
		if (str.indexOf('.') === 0 || !str.length)
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


function checkPHPerrors(env, content)
{
	const errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>', 'xdebug-error'];

	if (!env)
		return false;
	if (!content)
		return true;

	let found = errSignatures.some(function(lookupStr)
	{
		return (content.indexOf(lookupStr) !== -1);
	});

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
					isDate,
					isFunction,
					isObject,
					setParam,
					convDate,
					formatDate,
					cutDate,
					fixDate,
					formatValue,
					Currency,
					getCurrency,
					formatCurrency,
					getPersonByAcc,
					fixFloat,
					correct,
					correctExch,
					normalize,
					normalizeExch,
					isValidValue,
					copyObject,
					extend,
					urlJoin,
					checkPHPerrors,
					checkObjValue,
					test };


export { commonModule as common };
