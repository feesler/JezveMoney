if (typeof module !== 'undefined' && module.exports)
{
	const _ = require('../../../../view/js/common.js');
	var isArray = _.isArray;
	var isObject = _.isObject;
}


// Check object is date
function isDate(obj)
{
	return (obj instanceof Date && !isNaN(obj.valueOf()));
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


function getPosById(arr, id)
{
	var pos = -1;

	if (!isArray(arr) || !id)
		return -1;

	arr.some(function(item, ind)
	{
		var cond = (id == item.id);
		if (cond)
			pos = ind;

		return cond;
	});

	return pos;
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


function checkPHPerrors(env, content)
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>'];

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
function test(descr, action, page, state)
{
	let actPromise = action();
	if (!actPromise)
		throw new Error('Action should return promise');

	return actPromise
			.then(async () =>
			{
				let expState = (typeof state === 'undefined') ? page.expectedState : state;
				let res = await page.checkState(expState);
				page.addResult(descr, res);
			})
			.catch(e => page.addResult(descr, false, e.message));
}


if (typeof module !== 'undefined' && module.exports)
{
	module.exports = { formatDate : formatDate,
						getPosById : getPosById,
						copyObject : copyObject,
						checkPHPerrors : checkPHPerrors,
					 	test : test };
}
