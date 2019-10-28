var Environment = (function()
{
	var vdoc = null;
	var viewframe = null;
	var restbl = null;
	var totalRes = null, okRes = null, failRes = null;


	async function vquery()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : vdoc;

		return (typeof query === 'string') ? parent.querySelector(query) : query;
	}


	async function vqueryall()
	{
		if (!arguments.length)
			return null;

		let parentSpecified = (arguments.length > 1);
		let query = parentSpecified ? arguments[1]: arguments[0];
		let parent = parentSpecified ? arguments[0] : vdoc;

		return (typeof query === 'string') ? parent.querySelectorAll(query) : query;
	}


	async function inputEmul(elemObj, val)
	{
		elemObj.value = val;
		if (elemObj.oninput)
			elemObj.oninput();
	}


	async function clickEmul(elemObj)
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
		let env = window.Environment;

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

					let view = new pageClass({ environment : env });
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


	function initTests(navHandler)
	{
		var startbtn = ge('startbtn');
		totalRes = ge('totalRes');
		okRes = ge('okRes');
		failRes = ge('failRes');
		viewframe = ge('viewframe');
		restbl = ge('restbl');
		if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
			throw new Error('Fail to init tests');

		startbtn.onclick = function()
		{
			results = { total : 0, ok : 0, fail : 0 };
			addResult('Test initialization', 'OK');

			navigation(function()
			{
				viewframe.src = 'https://jezve.net/money/';
			}, MainPage)
			.then(navHandler);
		};
	}


	return {
		init : initTests,
		navigation : navigation,
		query : vquery,
		queryAll : vqueryall,
		click : clickEmul,
		input : inputEmul,
		addResult : addResult,
	 	setBlock : setBlock
	};
})();
