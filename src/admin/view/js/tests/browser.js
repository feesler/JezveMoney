var vdoc = null;
var viewframe = null;
var restbl = null;
var totalRes = null, okRes = null, failRes = null;



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


function inputEmul(elemObj, val)
{
	elemObj.value = val;
	if (elemObj.oninput)
		elemObj.oninput();
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


function addResult(descr, res, message)
{
	message = message || '';

	totalRes.innerHTML = ++results.total;
	okRes.innerHTML = (res) ? ++results.ok : results.ok;
	failRes.innerHTML = (res) ? results.fail : ++results.fail;

	restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
										ce('td', { innerHTML : (res ? 'OK' : 'FAIL') }),
									 	ce('td', { innerHTML : message }) ]));
}


function setBlock(title, category)
{
	restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
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

			checkPHPerrors(vdoc.body.innerHTML);
			try
			{
				if (pageClass === undefined)
					pageClass = TestPage;

				let view = new pageClass({ navigation : navigation,
											vquery : vquery,
											vqueryall : vqueryall,
										 	clickEmul : clickEmul,
											inputEmul : inputEmul,
											addResult : addResult });
				resolve(view.parse());
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


function initTests()
{
	var startbtn = ge('startbtn');
	totalRes = ge('totalRes');
	okRes = ge('okRes');
	failRes = ge('failRes');
	viewframe = ge('viewframe');
	restbl = ge('restbl');
	if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
		throw new Error('Fail to init tests');

	startbtn.onclick = onStartClick;
}


function onStartClick()
{
	results = { total : 0, ok : 0, fail : 0 };
	addResult('Test initialization', 'OK');

	navigation(function()
	{
		viewframe.src = 'https://jezve.net/money/';
	}, MainPage)
	.then(startTests);
}
