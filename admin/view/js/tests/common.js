var vdoc = null;
var viewframe = null;


function vge(a)
{
	return (typeof a == 'string') ? vdoc.getElementById(a) : a;
}


function vquery(a)
{
	return (typeof a == 'string') ? vdoc.querySelector(a) : a;
}


function vqueryall(a)
{
	return (typeof a == 'string') ? vdoc.querySelectorAll(a) : a;
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


function clickEmul(elemObj)
{
	if (elemObj.click)
	{
		elemObj.click();
	}
	else if (document.createEvent)
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, viewframe.contentWindow,
		0, 0, 0, 0, 0, false, false, false, false, 0, null);
		var allowDefault = elemObj.dispatchEvent(evt);
	}
}


function inputEmul(elemObj, val)
{
	elemObj.value = val;
	if (elemObj.oninput)
		elemObj.oninput();
}


function navigation(action, pageClass)
{
	var navPromise = new Promise(function(resolve, reject)
	{
		viewframe.onload = function()
		{
			vdoc = viewframe.contentWindow.document;
			if (!vdoc)
				throw new Error('View document not found');

			checkPHPerrors();
			try
			{
				if (pageClass === undefined)
					pageClass = TestPage;

				resolve(new pageClass());
			}
			catch(e)
			{
				reject(e.message, false);
			}
		};
	});

	if (isFunction(action))
		action();

	return navPromise;
}


function checkPHPerrors()
{
	var errSignatures = ['<b>Notice</b>', '<b>Parse error</b>', '<b>Fatal error</b>'];

	if (!vdoc || !vdoc.body)
		return true;

	var found = errSignatures.some(function(lookupStr)
	{
		return (vdoc.body.innerHTML.indexOf(lookupStr) !== -1);
	});

	if (found)
		addResult('PHP error signature found', false);
}
