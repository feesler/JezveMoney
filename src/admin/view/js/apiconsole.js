var activeController = null;
var activeFormLink = null;
var activeForm = null;
var clearResultsBtn = null;


var api = (function()
{
	function addRequestItem(reqData)
	{
		var results = ge('results');
		if (!results)
			return null;

		var reqItem = {};

		reqItem.itemContainer = ce('div', { className : 'req_item' });

		reqItem.requestContainer = ce('div', { className : 'req_container collapsed' });
		reqItem.requestContainer.onclick = function()
		{
			reqItem.requestContainer.classList.toggle('collapsed');
		};

		var reqText = reqData.url;
		if (reqText.indexOf(baseURL) === 0)
			reqText = reqText.substr(baseURL.length);

		reqItem.requestContainer.append(ce('div', { className : 'title', innerText : reqData.method + ' ' + reqText }));
		if (reqData.data)
			reqItem.requestContainer.append(ce('div', { className : 'req_details', innerText : reqData.data }));

		reqItem.resultContainer = ce('div', { className : 'res_container res_pending', innerText : 'Pending...' });

		reqItem.itemContainer.append(reqItem.requestContainer, reqItem.resultContainer);

		reqItem.addResult = function(res, title, rawResult)
		{
			this.resultContainer.classList.remove('res_pending')
			this.resultContainer.classList.add('res_container', 'collapsed', (res ? 'res_ok' : 'res_fail'))
			removeChilds(this.resultContainer);

			var titleEl = ce('div', { className : 'title', innerText : title });
			titleEl.onclick = function()
			{
				reqItem.resultContainer.classList.toggle('collapsed');
			}

			this.resultContainer.append(titleEl);

			if (rawResult)
			{
				this.resultContainer.append(ce('div', { className : 'res_details', innerText : rawResult }));
			}

			clearResultsBtn.disabled = false;
		};


		results.append(reqItem.itemContainer);

		return reqItem;
	}


	function ajaxCallback(text, reqItem, verifyCallback)
	{
		var respObj;
		var resText;
		var rawResult = null;
		var res = true;

		try
		{
			respObj = JSON.parse(text);
		}
		catch(e)
		{
			console.log(e.message);
			reqItem.addResult(false, 'Fail to parse response from server', null);
			return;
		}

		if (respObj && respObj.result == 'ok')
		{
			if (isFunction(verifyCallback))
				res = verifyCallback(respObj.data);
			resText = res ? 'Valid response' : 'Invalid response format';
		}
		else
		{
			res = false;
			resText = 'Fail result';
		}
		rawResult = text;

		reqItem.addResult(res, resText, rawResult);
	}


	function postData(data)
	{
		return JSON.stringify(data);
	}


	// Check request data is single id case { id : value | [ value ] } 
	// Return id value if match and false overwise
	function singleIdData(data)
	{
		var keys = Object.keys(data);

		if (keys.length != 1 && keys[0] != 'id')
			return false;

		if (!Array.isArray(data.id))
			return data.id;

		if (data.id.length != 1)
			return false;

		return data.id[0];
	}


	// Convert API request object to request item
	function getRequestItem(request, isPOST)
	{
		if (!isObject(request))
			throw new Error('Invalid request');
		if (typeof request.method !== 'string' || !request.method.length)
			throw new Error('Invalid API request method');

		var prefix = baseURL + 'api/';
		var res = {
			url : + request.method
		};

		if (request.method.indexOf(prefix) === -1)
			res.url = prefix + request.method;
		else
			res.url = request.method;

		res.headers = ('headers' in request) ? request.headers : {};

		if (request.data)
		{
			if (isPOST)
			{
				res.method = 'POST';
				res.data = postData(request.data);
				res.headers['Content-Type'] = 'application/json';
			}
			else
			{
				res.method = 'GET';
				var id = singleIdData(request.data);
				if (id)
				{
					res.url += id;
				}
				else
				{
					var params = urlJoin(request.data);
					if (params.length)
						res.url += '?' + params;
				}
			}
		}

		return res;
	}

	return {
		get : function(request, callback)
		{
			var requestItem = getRequestItem(request);
			var reqContainer = addRequestItem(requestItem);

			requestItem.callback = function(text)
			{
				ajaxCallback(text, reqContainer, callback);
			}

			ajax.get(requestItem);
		},

		post : function(request, callback)
		{
			var requestItem = getRequestItem(request, true);
			var reqContainer = addRequestItem(requestItem);

			requestItem.callback = function(text)
			{
				ajaxCallback(text, reqContainer, callback);
			}

			ajax.post(requestItem);
		}
	};
})();


function activateView(viewTarget)
{
	if (!viewTarget)
		return;

	var newForm = ge(viewTarget);
	if (newForm)
	{
		if (activeForm)
			activeForm.classList.remove('active');
		newForm.classList.add('active');
		activeForm = newForm;
	}
}


function activateMenu(menuElem)
{
	if (!menuElem || !menuElem.parentNode)
		return;

	if (menuElem.tagName == 'BUTTON')
	{
		if (activeController)
			activeController.classList.remove('active');
		if (menuElem.parentNode)
			menuElem.parentNode.classList.add('active');
		activeController = menuElem.parentNode;
	}
	else if (menuElem.tagName == 'LI' && menuElem.parentNode && menuElem.parentNode.classList.contains('sub_list'))
	{
		if (activeFormLink)
			activeFormLink.classList.remove('active');
		activeFormLink = menuElem;
		activeFormLink.classList.add('active');

		var parentElem = menuElem.parentNode.parentNode;
		if (parentElem && !parentElem.classList.contains('active'))
		{
			if (activeController)
				activeController.classList.remove('active');
			parentElem.classList.add('active');
			activeController = parentElem;
		}
	}
}


function onContrClick(e)
{
	e = fixEvent(e);

	var targetEl = e.target;

	activateMenu(targetEl);
	activateView(targetEl.dataset.target);
}


function clearResults()
{
	removeChilds(results);
	clearResultsBtn.disabled = true;
}


function onFormSubmit(e, verifyCallback)
{
	var els = {};

	e = fixEvent(e);

	var formEl = e.target;
	if (!formEl || !formEl.elements)
		return false;

	var inputEl;
	for(var i = 0; i < formEl.elements.length; i++)
	{
		inputEl = formEl.elements[i];

		if (inputEl.disabled || inputEl.name == '')
			continue;

		if ((inputEl.type == 'checkbox' || inputEl.type == 'radio') && !inputEl.checked)
			continue;

		els[inputEl.name] = inputEl.value;
	}

	var request = {
		method : formEl.action,
		data : els
	};

	if (formEl.method == 'get')
		api.get(request, verifyCallback);
	else if (formEl.method == 'post')
		api.post(request, verifyCallback);

	return false;
}


function onCheck(e)
{
	if (!e.target || !e.target.form)
		return;

	var elName = e.target.dataset.target;
	if (!elName)
		return;

	var disableElements = !e.target.checked;
	var frm = e.target.form;
	if (frm.elements[elName])
	{
		var el = frm.elements[elName];
		if (el instanceof NodeList)
		{
			for(var i = 0; i < el.length; i++)
			{
				el[i].disabled = disableElements;
			}
		}
		else
			el.disabled = disableElements;
	}
}


// Concatenate specified ids to URL base
function parseIds(values)
{
	if (typeof values !== 'string' || !values)
		throw new Error('Invalid values specified');

	// Check correctness of ids
	var ids = values.split(',').map(function(item)
	{
		var id = parseInt(item);
		if (!id || isNaN(id))
			throw new Error('Wrong id specified');

		return id;
	});

	return { id : ids };
}



/**
 * Verification of structures
 */


function verifyObject(obj, expected, optional)
{
	var verifyFunc;

	if (!isObject(obj) || !isObject(expected))
		return false;

	// Check no excess members in the object
	for(var key in obj)
	{
		if (!(key in expected) && optional && !(key in optional))
		{
			console.log('Unexpected key: ' + key);
			return false;
		}
	}

	// Check all expected members are present in the object and have correct types
	for(var key in expected)
	{
		if (!(key in obj))
		{
			console.log('Not found expected key: ' + key);
			return false;
		}

		verifyFunc = expected[key];
		if (!isFunction(verifyFunc) || !verifyFunc(obj[key]))
		{
			console.log('Wrong type of value ' + key);
			return false;
		}
	}

	// Check optional members have correct types if present in the object
	if (!optional)
		return true;

	for(var key in optional)
	{
		if (key in obj)
		{
			verifyFunc = optional[key];
			if (!isFunction(verifyFunc) || !verifyFunc(obj[key]))
			{
				console.log('Wrong type of value ' + key);
				return false;
			}
		}
	}

	return true;
}


function isCreateResult(obj)
{
	return verifyObject(obj, { id : isInt });
}


function isString(obj)
{
	return (typeof obj === 'string');
}


function isArrayOf(data, verifyFunc)
{
	if (!Array.isArray(data) || !isFunction(verifyFunc))
		return false;

	return data.every(verifyFunc);
}


function isDateString(obj)
{
	return checkDate(obj);
}


function isAccount(obj)
{
	return verifyObject(obj, {
			id : isInt,
			owner_id : isInt,
			curr_id : isInt,
			balance : isNum,
			initbalance : isNum,
			name : isString,
			icon : isInt,
			flags : isInt,
		}, {
			user_id : isInt,
			createdate : isInt,
			updatedate : isInt,
		});
}


function isAccountsArray(obj){ return isArrayOf(obj, isAccount); }


function isTransaction(obj)
{
	return verifyObject(obj, {
			id : isInt,
			type : isInt,
			src_id : isInt,
			dest_id : isInt,
			src_amount : isNum,
			dest_amount : isNum,
			src_curr : isInt,
			dest_curr : isInt,
			src_result : isNum,
			dest_result : isNum,
			date : isDateString,
			comment : isString,
			pos : isInt,
		}, {
			user_id : isInt,
			createdate : isInt,
			updatedate : isInt,
		});
}


function isTransactionsArray(obj){ return isArrayOf(obj, isTransaction); }


function isCurrency(obj)
{
	return verifyObject(obj, {
			id : isInt,
			name : isString,
			sign : isString,
			flags : isInt,
		}, {
			createdate : isInt,
			updatedate : isInt,
		});
}


function isCurrenciesArray(obj){ return isArrayOf(obj, isCurrency); }


function isPersonAccount(obj)
{
	return verifyObject(obj, {
			id : isInt,
			curr_id : isInt,
			balance : isNum,
		}, {
			owner_id : isInt,
			initbalance : isNum,
			name : isString,
			icon : isInt,
			flags : isInt,
			user_id : isInt,
			createdate : isInt,
			updatedate : isInt,
		});
}


function isPersonAccountsArray(obj){ return isArrayOf(obj, isPersonAccount); }


function isPerson(obj)
{
	return verifyObject(obj, {
			id : isInt,
			name : isString,
			flags : isInt,
		}, {
			accounts : isPersonAccountsArray,
			user_id: isInt,
			createdate : isInt,
			updatedate : isInt,
		});
}


function isPersonsArray(obj){ return isArrayOf(obj, isPerson); }


function isProfile(obj)
{
	return verifyObject(obj, {
			login : isString,
			user_id : isInt,
			owner_id : isInt,
			name : isString,
		});
}


/**
 * Form event handlers
 */


function onReadAccountSubmit()
{
	var accInp = ge('readaccid');
	if (!accInp)
		return;

	api.get({
		method : 'account/',
		data : parseIds(accInp.value),
		verify : isAccountsArray
	});
}


function onDeleteAccountSubmit()
{
	var accountsInp = ge('delaccounts');
	if (!accountsInp)
		return;

	api.post({
		method : 'account/delete',
		data : parseIds(accountsInp.value)
	});
}


function onCurrencyReadSubmit()
{
	var curr_id_inp = ge('read_curr_id');
	if (!curr_id_inp)
		return;

	api.get({
		method : 'currency/',
		data : parseIds(curr_id_inp.value),
		verify : isCurrenciesArray
	});
}


function onDeleteCurrencySubmit()
{
	var id_inp = ge('delcurrencies');
	if (!id_inp)
		return;

	api.post({
		method : 'currency/delete',
		data : parseIds(id_inp.value)
	});
}


function onReadPersonSubmit()
{
	var id_inp = ge('read_person_id');
	if (!id_inp)
		return;

	api.get({
		method : 'person/',
		data : parseIds(id_inp.value),
		verify : isPersonsArray
	});
}


function onDeletePersonSubmit()
{
	var persondInp = ge('delpersons');
	if (!persondInp)
		return;

	api.post({
		method : 'person/delete',
		data : parseIds(persondInp.value)
	});
}


function onReadTransactionSubmit()
{
	var transInp = ge('read_trans_id');
	if (!transInp)
		return;

	api.get({
		method : 'transaction/',
		data : parseIds(transInp.value),
		verify : isTransactionsArray
	});
}


function onDeleteTransactionSubmit()
{
	var transInp = ge('deltransactions');
	if (!transInp)
		return;

	api.post({
		method : 'transaction/delete',
		data : parseIds(transInp.value)
	});
}


function initControls()
{
	var controllersList = ge('controllersList');
	if (controllersList)
		controllersList.onclick = onContrClick;

	activeForm = document.querySelector('.test_form.active');
	activeController = document.querySelector('#controllersList > li.active');
	activeFormLink = document.querySelector('#controllersList > li.active > .sub_list > li.active');

	clearResultsBtn = ge('clearResultsBtn');
	if (clearResultsBtn)
		clearResultsBtn.onclick = clearResults;
/**
 * Common
 */
	var readStateForm = document.querySelector('#readStateForm > form');
	if (!readStateForm)
		throw new Error('Fail to init view');
	readStateForm.onsubmit = onFormSubmit;

/**
 * Accounts
 */
	var listAccForm = document.querySelector('#listAccForm > form');
	if (!listAccForm)
		throw new Error('Fail to init view');
	listAccForm.onsubmit = function(e){ return onFormSubmit(e, isAccountsArray); };

	var checkboxes = listAccForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', onCheck);
	});

	var readaccbtn = ge('readaccbtn');
	if (readaccbtn)
		readaccbtn.onclick = onReadAccountSubmit;

	var createAccForm = document.querySelector('#createAccForm > form');
	if (!createAccForm)
		throw new Error('Fail to init view');
	createAccForm.onsubmit = function(e){ return onFormSubmit(e, isCreateResult); };

	var updateAccForm = document.querySelector('#updateAccForm > form');
	if (!updateAccForm)
		throw new Error('Fail to init view');
	updateAccForm.onsubmit = onFormSubmit;

	var delaccbtn = ge('delaccbtn');
	if (delaccbtn)
		delaccbtn.onclick = onDeleteAccountSubmit;

	var resetAccForm = document.querySelector('#resetAccForm > form');
	if (!resetAccForm)
		throw new Error('Fail to init view');
	resetAccForm.onsubmit = onFormSubmit;

/**
 * Persons
 */
	var listPersonsForm = document.querySelector('#listPersonsForm > form');
	if (!listPersonsForm)
		throw new Error('Fail to init view');
	listPersonsForm.onsubmit = function(e){ return onFormSubmit(e, isPersonsArray); };

	checkboxes = listPersonsForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', onCheck);
	});

	var readpersonbtn = ge('readpersonbtn');
	if (readpersonbtn)
		readpersonbtn.onclick = onReadPersonSubmit;

	var createPersonForm = document.querySelector('#createPersonForm > form');
	if (!createPersonForm)
		throw new Error('Fail to init view');
	createPersonForm.onsubmit = function (e) { return onFormSubmit(e, isCreateResult); };

	var updatePersonForm = document.querySelector('#updatePersonForm > form');
	if (!updatePersonForm)
		throw new Error('Fail to init view');
		updatePersonForm.onsubmit = onFormSubmit;

	var delpersonbtn = ge('delpersonbtn');
	if (delpersonbtn)
		delpersonbtn.onclick = onDeletePersonSubmit;

/**
 * Transactions
 */
	var listTrForm = document.querySelector('#listTrForm > form');
	if (!listTrForm)
		throw new Error('Fail to init view');
	listTrForm.onsubmit = function(e){ return onFormSubmit(e, isTransactionsArray); };

	checkboxes = listTrForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', onCheck);
	});

	var readtransbtn = ge('readtransbtn');
	if (readtransbtn)
		readtransbtn.onclick = onReadTransactionSubmit;

	var createTrForm = document.querySelector('#createTrForm > form');
	if (!createTrForm)
		throw new Error('Fail to init view');
	createTrForm.onsubmit = function(e){ return onFormSubmit(e, isCreateResult); };

	var createDebtForm = document.querySelector('#createDebtForm > form');
	if (!createDebtForm)
		throw new Error('Fail to init view');
	createDebtForm.onsubmit = function(e){ return onFormSubmit(e, isCreateResult); };

	var updateTrForm = document.querySelector('#updateTrForm > form');
	if (!updateTrForm)
		throw new Error('Fail to init view');
	updateTrForm.onsubmit = onFormSubmit;

	var updateDebtForm = document.querySelector('#updateDebtForm > form');
	if (!updateDebtForm)
		throw new Error('Fail to init view');
	updateDebtForm.onsubmit = onFormSubmit;

	var deltransbtn = ge('deltransbtn');
	if (deltransbtn)
		deltransbtn.onclick = onDeleteTransactionSubmit;

	var setTrPosForm = document.querySelector('#setTrPosForm > form');
	if (!setTrPosForm)
		throw new Error('Fail to init view');
	setTrPosForm.onsubmit = onFormSubmit;

/**
 * Currencies
 */
	var getCurrForm = document.querySelector('#listCurrForm > form');
	if (!getCurrForm)
		throw new Error('Fail to init view');
	getCurrForm.onsubmit = function(e){ return onFormSubmit(e, isCurrenciesArray); };

	var readcurrbtn = ge('readcurrbtn');
	if (readcurrbtn)
		readcurrbtn.onclick = onCurrencyReadSubmit;

	var createCurrForm = document.querySelector('#createCurrForm > form');
	if (!createCurrForm)
		throw new Error('Fail to init view');
	createCurrForm.onsubmit = function(e){ return onFormSubmit(e, isCreateResult); };

	var updateCurrForm = document.querySelector('#updateCurrForm > form');
	if (!updateCurrForm)
		throw new Error('Fail to init view');
	updateCurrForm.onsubmit = onFormSubmit;

	var delcurrbtn = ge('delcurrbtn');
	if (delcurrbtn)
		delcurrbtn.onclick = onDeleteCurrencySubmit;
/**
 * User
 */
	var loginForm = document.querySelector('#loginForm > form');
	if (!loginForm)
		throw new Error('Fail to init view');
	loginForm.onsubmit = onFormSubmit;

	var logoutForm = document.querySelector('#logoutForm > form');
	if (!logoutForm)
		throw new Error('Fail to init view');
	logoutForm.onsubmit = onFormSubmit;

	var registerForm = document.querySelector('#registerForm > form');
	if (!registerForm)
		throw new Error('Fail to init view');
	registerForm.onsubmit = onFormSubmit;

/**
 * Profile
 */
	var readProfileForm = document.querySelector('#readProfileForm > form');
	if (!readProfileForm)
		throw new Error('Fail to init view');
	readProfileForm.onsubmit = function(e){ return onFormSubmit(e, isProfile); };

	var changeNameForm = document.querySelector('#changeNameForm > form');
	if (!changeNameForm)
		throw new Error('Fail to init view');
	changeNameForm.onsubmit = onFormSubmit;

	var changePwdForm = document.querySelector('#changePwdForm > form');
	if (!changePwdForm)
		throw new Error('Fail to init view');
	changePwdForm.onsubmit = onFormSubmit;

	var resetAllForm = document.querySelector('#resetAllForm > form');
	if (!resetAllForm)
		throw new Error('Fail to init view');
	resetAllForm.onsubmit = onFormSubmit;
}
