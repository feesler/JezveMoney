var Environment = (function()
{
	var vdoc = null;
	var viewframe = null;
	var restbl = null;
	var totalRes = null, okRes = null, failRes = null;


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


	async function addResult(descr, res, message)
	{
		message = message || '';

		totalRes.innerHTML = ++results.total;
		okRes.innerHTML = (res) ? ++results.ok : results.ok;
		failRes.innerHTML = (res) ? results.fail : ++results.fail;

		restbl.appendChild(ce('tr', {}, [ ce('td', { innerHTML : descr }),
											ce('td', { innerHTML : (res ? 'OK' : 'FAIL') }),
										 	ce('td', { innerHTML : message }) ]));
	}


	async function setBlock(title, category)
	{
		restbl.appendChild(ce('tr', { className : 'res-block-' + category }, ce('td', { colSpan : 3, innerHTML : title }) ));
	}


	async function navigation(action, pageClass)
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
				try
				{
					let pageClass = await route(env, await getUrl());

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
			await action();

		return navPromise;
	}


	async function initTests(url, navHandler)
	{
		var startbtn = ge('startbtn');
		totalRes = ge('totalRes');
		okRes = ge('okRes');
		failRes = ge('failRes');
		viewframe = ge('viewframe');
		restbl = ge('restbl');
		if (!startbtn || !totalRes || !okRes || !failRes || !viewframe || !restbl)
			throw new Error('Fail to init tests');

		startbtn.onclick = async function()
		{
			results = { total : 0, ok : 0, fail : 0 };
			await addResult('Test initialization', 'OK');

			let page = await navigation(async () => viewframe.src = url );
			page = await navHandler(page);
		};
	}


	return {
		init : initTests,
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
		addResult : addResult,
	 	setBlock : setBlock
	};
})();
