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


function checkPHPerrors(content)
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>'];

	if (!content)
		return true;

	var found = errSignatures.some(function(lookupStr)
	{
		return (content.indexOf(lookupStr) !== -1);
	});

	if (found)
		Environment.addResult('PHP error signature found', false);
}
