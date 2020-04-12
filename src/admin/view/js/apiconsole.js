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
		if (reqData.postdata)
			reqItem.requestContainer.append(ce('div', { className : 'req_details', innerText : reqData.postdata }));

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


	return {
		get : function(link, callback)
		{
			var reqContainer = addRequestItem({ url : link, method : 'GET' });

			ajax.get(link, function(text)
			{
				ajaxCallback(text, reqContainer, callback);
			});
		},

		post : function(link, params, callback)
		{
			var reqContainer = addRequestItem({ url : link, method : 'POST', postdata : params });

			ajax.post(link, params, function(text)
			{
				ajaxCallback(text, reqContainer, callback);
			});
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
	var link, els = {}, params;

	e = fixEvent(e);

	var formEl = e.target;
	if (!formEl || !formEl.elements)
		return false;

	for(i = 0; i < formEl.elements.length; i++)
	{
		if (!formEl.elements[i].disabled && formEl.elements[i].name != '')
			els[formEl.elements[i].name] = formEl.elements[i].value;
	}

	if (formEl.method == 'get')
	{
		params = urlJoin(els);
		link = formEl.action;
		if (params != '')
			link += ((link.indexOf('?') != -1) ? '&' : '?') + params;
		api.get(link, verifyCallback);
	}
	else if (formEl.method == 'post')
	{
		params = urlJoin(els);
		link = formEl.action;
		api.post(link, params, verifyCallback);
	}

	return false;
}


function onCheck(obj, elName)
{
	var frm, el;

	if (!obj || !obj.form || !elName)
		return;

	frm = obj.form;
	if (frm.elements[elName])
	{
		el = frm.elements[elName];
		el.disabled = !obj.checked;
	}
}


function csToIds(values)
{
	if (!values || !values.length)
		return null;

	var ids = values.split(',');
	if (!isArray(ids))
		return null;

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
			format : isInt,
		}, {
			createdate : isInt,
			updatedate : isInt,
		});
}


function isCurrenciesArray(obj){ return isArrayOf(obj, isCurrency); }


function isPerson(obj)
{
	return verifyObject(obj, {
			id : isInt,
			name : isString,
		}, {
			accounts : isAccountsArray,
			user_id: isInt,
			createdate : isInt,
			updatedate : isInt,
		});
}


function isPersonsArray(obj){ return isArrayOf(obj, isPerson); }


function isProfile(obj)
{
	return verifyObject(obj, {
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

	var link = baseURL + 'api/account/';

	var idsPar = csToIds(accInp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	api.get(link, isAccountsArray);
}


function onCreateAccountSubmit()
{
	var nameInp = ge('create_account_name');
	var initbalanceInput = ge('create_account_initbalance');
	var currencyInput = ge('create_account_curr');
	var iconInput = ge('create_account_icon');

	if (!nameInp || !initbalanceInput || !currencyInput || !iconInput)
		return;

	var link = baseURL + 'api/account/create';

	var params = {};

	params.name = nameInp.value;
	params.initbalance = initbalanceInput.value;
	params.curr_id = currencyInput.value;
	params.icon = iconInput.value;

 	var data = urlJoin(params);

	api.post(link, data, isCreateResult);
}


function onUpdateAccountSubmit()
{
	var idInp = ge('update_account_id');
	var nameInp = ge('update_account_name');
	var initbalanceInput = ge('update_account_initbalance');
	var currencyInput = ge('update_account_curr');
	var iconInput = ge('update_account_icon');

	if (!idInp || !nameInp || !initbalanceInput || !currencyInput || !iconInput)
		return;

	var link = baseURL + 'api/account/update';

	var params = {};

	params.id = idInp.value;
	params.name = nameInp.value;
	params.initbalance = initbalanceInput.value;
	params.curr_id = currencyInput.value;
	params.icon = iconInput.value;

 	var data = urlJoin(params);

	api.post(link, data);
}


function onDeleteAccountSubmit()
{
	var accountsInp = ge('delaccounts');

	if (!accountsInp)
		return;

	var link = baseURL + 'api/account/delete';

	var idsPar = csToIds(accountsInp.value);
	data = urlJoin(idsPar);

	api.post(link, data);
}


function onCurrencyReadSubmit()
{
	var curr_id_inp = ge('read_curr_id');

	if (!curr_id_inp)
		return;

	var link = baseURL + 'api/currency/';

	var idsPar = csToIds(curr_id_inp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	api.get(link, isCurrenciesArray);
}


function onDeleteCurrencySubmit()
{
	var id_inp = ge('delcurrencies');
	if (!id_inp)
		return;

	var idsPar = csToIds(id_inp.value);
	var data = urlJoin(idsPar);

	api.post(baseURL + 'api/currency/delete', data);
}


function onReadPersonSubmit()
{
	var id_inp = ge('read_person_id');

	if (!id_inp)
		return;

	var link = baseURL + 'api/person/';

	var idsPar = csToIds(id_inp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	api.get(link, isPersonsArray);
}


function onDeletePersonSubmit()
{
	var persondInp = ge('delpersons');

	if (!persondInp)
		return;

	var link = baseURL + 'api/person/delete';

	var idsPar = csToIds(persondInp.value);
	data = urlJoin(idsPar);

	api.post(link, data);
}


function onReadTransactionSubmit()
{
	var transInp = ge('read_trans_id');

	if (!transInp)
		return;

	var link = baseURL + 'api/transaction/';

	var idsPar = csToIds(transInp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	api.get(link, isTransactionsArray);
}


function onDeleteTransactionSubmit()
{
	var transInp = ge('deltransactions');

	if (!transInp)
		return;

	var link = baseURL + 'api/transaction/delete';

	var idsPar = csToIds(transInp.value);
	data = urlJoin(idsPar);

	api.post(link, data);
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
 * Accounts
 */
	var getAccForm = ge('getAccForm');
	if (!getAccForm)
		throw new Error('Fail to init view');
	var form = getAccForm.querySelector('form');
	if (form)
		form.onsubmit = function(e){ return onFormSubmit(e, isAccountsArray); };

	var readaccbtn = ge('readaccbtn');
	if (readaccbtn)
		readaccbtn.onclick = onReadAccountSubmit;

	var accbtn = ge('accbtn');
	if (accbtn)
		accbtn.onclick = onCreateAccountSubmit;

	var updaccbtn = ge('updaccbtn');
	if (updaccbtn)
		updaccbtn.onclick = onUpdateAccountSubmit;

	var delaccbtn = ge('delaccbtn');
	if (delaccbtn)
		delaccbtn.onclick = onDeleteAccountSubmit;

/**
 * Persons
 */
	var getPersonsForm = document.querySelector('#getPersonsForm > form');
	if (!getPersonsForm)
		throw new Error('Fail to init view');
	getPersonsForm.onsubmit = function(e){ return onFormSubmit(e, isPersonsArray); };

	var readpersonbtn = ge('readpersonbtn');
	if (readpersonbtn)
		readpersonbtn.onclick = onReadPersonSubmit;

	var createPersonForm = document.querySelector('#createPersonForm > form');
	if (!createPersonForm)
		throw new Error('Fail to init view');
	createPersonForm.onsubmit = function (e) { return onFormSubmit(e, isCreateResult); };

	var editPersonForm = document.querySelector('#editPersonForm > form');
	if (!editPersonForm)
		throw new Error('Fail to init view');
	editPersonForm.onsubmit = onFormSubmit;

	var delpersonbtn = ge('delpersonbtn');
	if (delpersonbtn)
		delpersonbtn.onclick = onDeletePersonSubmit;

/**
 * Transactions
 */
	var getTrForm = document.querySelector('#getTrForm > form');
	if (!getTrForm)
		throw new Error('Fail to init view');
	getTrForm.onsubmit = function(e){ return onFormSubmit(e, isTransactionsArray); };

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

	var editTrForm = document.querySelector('#editTrForm > form');
	if (!editTrForm)
		throw new Error('Fail to init view');
	editTrForm.onsubmit = onFormSubmit;

	var editDebtForm = document.querySelector('#editDebtForm > form');
	if (!editDebtForm)
		throw new Error('Fail to init view');
	editDebtForm.onsubmit = onFormSubmit;

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
	var getCurrForm = document.querySelector('#getCurrForm > form');
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

	var editCurrForm = document.querySelector('#editCurrForm > form');
	if (!editCurrForm)
		throw new Error('Fail to init view');
	editCurrForm.onsubmit = onFormSubmit;

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
