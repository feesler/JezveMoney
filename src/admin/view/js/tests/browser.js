var Environment = (function()
{
	var vdoc = null;
	var viewframe = null;
	var restbl = null;
	var totalRes = null, okRes = null, failRes = null;
	var baseURL = null;
	var results = null;


	function getBaseUrl()
	{
		return baseURL;
	}


	async function getUrl()
	{
		return viewframe.contentWindow.location.href;
	}


	async function vparent(elem)
	{
		if (!elem)
			return null;

		return elem.parentNode;
	}


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


	async function vprop(elem, prop)
	{
		if (!elem || typeof prop !== 'string')
			return null;

		let res = elem;
		let propPath = prop.split('.');

		for(let propName of propPath)
		{
			if (!res)
				return res;
			res = res[propName];
		}

		return res;
	}


	async function getGlobal(prop)
	{
		let res = viewframe.contentWindow;
		let propPath = prop.split('.');

		for(let propName of propPath)
		{
			if (!res)
				return res;
			res = res[propName];
		}

		return res;
	}


	async function hasClass(elem, cl)
	{
		return elem.classList.contains(cl);
	}


	// elem could be an id string or element handle
	async function isVisible(elem, recursive)
	{
		if (typeof elem === 'string')
			elem = await vquery('#' + elem);

		let robj = elem;
		while(robj && robj.nodeType && robj.nodeType != 9)
		{
			if (!robj.style || robj.style.display == 'none')
				return false;

			if (recursive !== true)
				break;

			robj = robj.parentNode;
		}

		return !!robj;
	}


	async function selectByValue(selectObj, selValue, selBool)
	{
		var i;

		if (!selectObj || !selectObj.options)
			return -1;

		for(i = 0, l = selectObj.options.length; i < l; i++)
		{
			if (selectObj.options[i] && selectObj.options[i].value == selValue)
			{
				selectObj.options[i].selected = (selBool !== undefined) ? selBool : true;
				return true;
			}
		}

		return false;
	}


	async function onChange(elem)
	{
		return elem.onchange();
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


	async function httpRequest(method, url, data, headers)
	{
		let supportedMethods = ['get', 'head', 'post', 'put', 'delete', 'options'];

		method = method.toLowerCase();
		if (supportedMethods.indexOf(method) == -1)
			reject('Unexpected method ' + method);

		let postData = null;
		let options = { method : method, headers : {} };

		if (headers)
			common.setParam(options.headers, headers);

		if (method == 'post' && data)
		{
			postData = common.urlJoin(data);

			let encoder = new TextEncoder();
			let uint8Array = encoder.encode(postData);

			common.setParam(options.headers,
								{ 'Content-Type' : 'application/x-www-form-urlencoded',
									'Content-Length' : uint8Array.length });
			options.body = postData;
		}


		let resp = await fetch(url, options);

		let res = { status : resp.status,
		 			headers : resp.headers }

		res.body = await resp.text();

		return res;
	}


	async function addResult(descr, res)
	{
		var err = null;
		var resStr;
		var message = '';

		if (descr instanceof Error)
		{
			err = descr;
			descr = err.descr;
			delete err.descr;
			res = false;
			message = err.message;
		}

		if (results.expected)
			totalRes.innerHTML = ++results.total + '/' + results.expected;
		else
			totalRes.innerHTML = ++results.total;
		okRes.innerHTML = (res) ? ++results.ok : results.ok;
		failRes.innerHTML = (res) ? results.fail : ++results.fail;

		resStr = (res ? 'OK' : 'FAIL');

		restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
											ce('td', { innerHTML : resStr }),
										 	ce('td', { innerHTML : message }) ]));

		if (err)
			console.error(err);
	}


	async function setBlock(title, category)
	{
		restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
	}


	async function navigation(action)
	{
		let env = window.Environment;

		var navPromise = new Promise(function(resolve, reject)
		{
			viewframe.onload = async function()
			{
				vdoc = viewframe.contentWindow.document;
				if (!vdoc)
					throw new Error('View document not found');

				checkPHPerrors(env, vdoc.documentElement.innerHTML);

				let viewClass = await route(env, await getUrl());

				let view = new viewClass({ environment : env });
				resolve(view.parse());
			};
		});

		if (isFunction(action))
			await action();

		return navPromise;
	}


	async function initTests(config, navHandler)
	{
		var startbtn = ge('startbtn');
		totalRes = ge('totalRes');
		okRes = ge('okRes');
		failRes = ge('failRes');
		viewframe = ge('viewframe');
		restbl = ge('restbl');
		if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
			throw new Error('Fail to init tests');

		if (!config || !config.url)
			throw new Error('Invalid config: test URL not found');

		baseURL = config.url;

		startbtn.onclick = async function()
		{
			try
			{
				results = { total : 0, ok : 0, fail : 0, expected : 0 };

				if (config.testsExpected)
					results.expected = config.testsExpected;

				await addResult('Test initialization', true);

				let view = await navigation(async () => viewframe.src = baseURL );
				view = await navHandler(view);
			}
			catch(e)
			{
				addResult(e);
			}
		};
	}


	return {
		init : initTests,
		baseUrl : getBaseUrl,
		url : getUrl,
		navigation : navigation,
		parent : vparent,
		query : vquery,
		queryAll : vqueryall,
		prop : vprop,
		global : getGlobal,
		hasClass : hasClass,
		isVisible : isVisible,
		selectByValue : selectByValue,
		click : clickEmul,
		input : inputEmul,
		onChange : onChange,
		httpReq : httpRequest,
		addResult : addResult,
	 	setBlock : setBlock
	};
})();
