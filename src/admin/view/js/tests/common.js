// Types of transactions
var EXPENSE = 1;
var INCOME = 2;
var TRANSFER = 3;
var DEBT = 4;


// Check object is array
function isArray(obj)
{
	return (Object.prototype.toString.call(obj) === '[object Array]');
}


// Check object is date
function isDate(obj)
{
	return (obj instanceof Date && !isNaN(obj.valueOf()));
}


// Check object is function
function isFunction(obj)
{
	var getType = {};
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
	var par, val;

	if (!obj || !params || typeof params !== 'object')
		return;

	for(par in params)
	{
		val = params[par];
		if (isArray(val))
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


/*
*	Currencies
*/
if (typeof module !== 'undefined' && module.exports)
{
	var currency = null;
}


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
	var nval = normalize(val);

	if (Math.floor(nval) != nval)
		nval = nval.toFixed(2);

	var fmtVal = formatValue(nval);

	if (this.format)
		return this.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + this.sign;
};


// Return currency object for specified id
function getCurrency(curr_id)
{
	var currObj = idSearch(currency, curr_id);
	if (!currObj)
		return null;

	return new Currency(currObj);
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var curr, nval, fmtVal;

	curr = getCurrency(curr_id);
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
*	Search in arrays
*/

// Search for object with specified id and return its position
function getPosById(arr, id)
{
	if (!isArray(arr) || !id)
		return -1;

	return arr.findIndex(item => item && item.id == id);
}


// Search for array of objects by id key
function idSearch(arr, id)
{
	if (!isArray(arr))
		return null;

	var res = arr.find(item => item && item.id == id);
	if (typeof res === 'undefined')
		return null;

	return res;
}


// Return deep copy of object
function copyObject(item)
{
	if (isArray(item))
	{
		return item.map(copyObject);
	}
	else if (isObject(item))
	{
		var res = {};
		for(var key in item)
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


function onAppUpdateCommon(props)
{
	props = props || {};

	let App = props.App;
	if (!App)
		return;

	currency = App.currencies;
}


function checkPHPerrors(env, content)
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>', 'xdebug-error'];

	if (!env)
		return false;
	if (!content)
		return true;

	var found = errSignatures.some(function(lookupStr)
	{
		return (content.indexOf(lookupStr) !== -1);
	});

	if (found)
		env.addResult('PHP error signature found', false);
}


// Run action, check state and add result to the list
function test(descr, action, view, state)
{
	let actPromise = action();
	if (!actPromise)
		throw new Error('Action should return promise');

	return actPromise
			.then(async () =>
			{
				let expState = (typeof state === 'undefined') ? view.expectedState : state;
				let res = await view.checkState(expState);
				view.addResult(descr, res);
			})
			.catch(e =>
			{
				e.descr = descr;
				throw e;
			});
}


var commonModule = { EXPENSE : EXPENSE,
					INCOME : INCOME,
					TRANSFER : TRANSFER,
					DEBT : DEBT,
					isArray : isArray,
					isDate : isDate,
					isFunction : isFunction,
					isObject : isObject,
					setParam : setParam,
					formatDate : formatDate,
					formatValue : formatValue,
					Currency : Currency,
					getCurrency : getCurrency,
					formatCurrency : formatCurrency,
					getPersonByAcc : getPersonByAcc,
					fixFloat : fixFloat,
					correct : correct,
					correctExch : correctExch,
					normalize : normalize,
					normalizeExch : normalizeExch,
					isValidValue : isValidValue,
					getPosById : getPosById,
					idSearch : idSearch,
					copyObject : copyObject,
					extend : extend,
					onAppUpdate : onAppUpdateCommon,
					checkPHPerrors : checkPHPerrors,
					test : test };


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = commonModule;
}
