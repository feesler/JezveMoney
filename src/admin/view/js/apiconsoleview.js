/**
 * Admin currecny list view
 */
function AdminApiConsoleView()
{
    AdminApiConsoleView.parent.constructor.apply(this, arguments);

    this.activeController = null;
    this.activeFormLink = null;
    this.activeForm = null;
}


extend(AdminApiConsoleView, View);


/**
 * View initialization
 */
AdminApiConsoleView.prototype.onStart = function()
{
    AdminApiConsoleView.parent.onStart.apply(this, arguments);

	this.controllersList = ge('controllersList');
	if (this.controllersList)
		this.controllersList.addEventListener('click', this.onContrClick.bind(this));

	this.activeForm = document.querySelector('.request-data-form.active');
	this.activeController = document.querySelector('#controllersList > li.active');
	this.activeFormLink = document.querySelector('#controllersList > li.active > .sub-menu-list > li.active');

    this.resultsContainer = ge('results');
	this.clearResultsBtn = ge('clearResultsBtn');
	if (!this.resultsContainer || !this.clearResultsBtn)
		throw new Error('Fail to init view');

	this.clearResultsBtn.addEventListener('click', this.clearResults.bind(this));
/**
 * Common
 */
	var readStateForm = document.querySelector('#readStateForm > form');
	if (!readStateForm)
		throw new Error('Fail to init view');
	readStateForm.addEventListener('submit', this.onFormSubmit.bind(this));

/**
 * Accounts
 */
	var listAccForm = document.querySelector('#listAccForm > form');
	if (!listAccForm)
		throw new Error('Fail to init view');
	listAccForm.addEventListener('submit', this.getVerifyHandler(isAccountsArray));

	var checkboxes = listAccForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', this.onCheck.bind(this));
	}.bind(this));

	var readaccbtn = ge('readaccbtn');
	if (readaccbtn)
		readaccbtn.addEventListener('click', this.onReadAccountSubmit.bind(this));

	var createAccForm = document.querySelector('#createAccForm > form');
	if (!createAccForm)
		throw new Error('Fail to init view');
	createAccForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var updateAccForm = document.querySelector('#updateAccForm > form');
	if (!updateAccForm)
		throw new Error('Fail to init view');
	updateAccForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var delaccbtn = ge('delaccbtn');
	if (delaccbtn)
		delaccbtn.addEventListener('click', this.onDeleteAccountSubmit.bind(this));

	var resetAccForm = document.querySelector('#resetAccForm > form');
	if (!resetAccForm)
		throw new Error('Fail to init view');
	resetAccForm.addEventListener('submit', this.onFormSubmit.bind(this));

/**
 * Persons
 */
	var listPersonsForm = document.querySelector('#listPersonsForm > form');
	if (!listPersonsForm)
		throw new Error('Fail to init view');
	listPersonsForm.addEventListener('submit', this.getVerifyHandler(isPersonsArray));

	checkboxes = listPersonsForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', this.onCheck.bind(this));
	}.bind(this));

	var readpersonbtn = ge('readpersonbtn');
	if (readpersonbtn)
		readpersonbtn.addEventListener('click', this.onReadPersonSubmit.bind(this));

	var createPersonForm = document.querySelector('#createPersonForm > form');
	if (!createPersonForm)
		throw new Error('Fail to init view');
	createPersonForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var updatePersonForm = document.querySelector('#updatePersonForm > form');
	if (!updatePersonForm)
		throw new Error('Fail to init view');
		updatePersonForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var delpersonbtn = ge('delpersonbtn');
	if (delpersonbtn)
		delpersonbtn.addEventListener('click', this.onDeletePersonSubmit.bind(this));

/**
 * Transactions
 */
	var listTrForm = document.querySelector('#listTrForm > form');
	if (!listTrForm)
		throw new Error('Fail to init view');
	listTrForm.addEventListener('submit', this.onListTransactionSubmit.bind(this));

	checkboxes = listTrForm.querySelectorAll('input[type="checkbox"]');
	checkboxes = Array.from(checkboxes);
	checkboxes.forEach(function(elem)
	{
		elem.addEventListener('change', this.onCheck.bind(this));
	}.bind(this));

	var readtransbtn = ge('readtransbtn');
	if (readtransbtn)
		readtransbtn.addEventListener('click', this.onReadTransactionSubmit.bind(this));

	var createTrForm = document.querySelector('#createTrForm > form');
	if (!createTrForm)
		throw new Error('Fail to init view');
	createTrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var createDebtForm = document.querySelector('#createDebtForm > form');
	if (!createDebtForm)
		throw new Error('Fail to init view');
	createDebtForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var updateTrForm = document.querySelector('#updateTrForm > form');
	if (!updateTrForm)
		throw new Error('Fail to init view');
	updateTrForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var updateDebtForm = document.querySelector('#updateDebtForm > form');
	if (!updateDebtForm)
		throw new Error('Fail to init view');
	updateDebtForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var deltransbtn = ge('deltransbtn');
	if (deltransbtn)
		deltransbtn.addEventListener('click', this.onDeleteTransactionSubmit.bind(this));

	var setTrPosForm = document.querySelector('#setTrPosForm > form');
	if (!setTrPosForm)
		throw new Error('Fail to init view');
	setTrPosForm.addEventListener('submit', this.onFormSubmit.bind(this));

/**
 * Currencies
 */
	var getCurrForm = document.querySelector('#listCurrForm > form');
	if (!getCurrForm)
		throw new Error('Fail to init view');
	getCurrForm.addEventListener('submit', this.getVerifyHandler(isCurrenciesArray));

	var readcurrbtn = ge('readcurrbtn');
	if (readcurrbtn)
		readcurrbtn.addEventListener('click', this.onCurrencyReadSubmit.bind(this));

	var createCurrForm = document.querySelector('#createCurrForm > form');
	if (!createCurrForm)
		throw new Error('Fail to init view');
	createCurrForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var updateCurrForm = document.querySelector('#updateCurrForm > form');
	if (!updateCurrForm)
		throw new Error('Fail to init view');
	updateCurrForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var delcurrbtn = ge('delcurrbtn');
	if (delcurrbtn)
		delcurrbtn.addEventListener('click', this.onDeleteCurrencySubmit.bind(this));

/**
 * Icons
 */
	var listIconForm = document.querySelector('#listIconForm > form');
	if (!listIconForm)
		throw new Error('Fail to init view');
	listIconForm.addEventListener('submit', this.getVerifyHandler(isIconsArray));

	var read_icon_btn = ge('read_icon_btn');
	if (read_icon_btn)
		read_icon_btn.addEventListener('click', this.onIconReadSubmit.bind(this));

	var createIconForm = document.querySelector('#createIconForm > form');
	if (!createIconForm)
		throw new Error('Fail to init view');
	createIconForm.addEventListener('submit', this.getVerifyHandler(isCreateResult));

	var updateIconForm = document.querySelector('#updateIconForm > form');
	if (!updateIconForm)
		throw new Error('Fail to init view');
	updateIconForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var deliconbtn = ge('deliconbtn');
	if (deliconbtn)
		deliconbtn.addEventListener('click', this.onDeleteIconsSubmit.bind(this));

/**
 * User
 */
	var loginForm = document.querySelector('#loginForm > form');
	if (!loginForm)
		throw new Error('Fail to init view');
	loginForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var logoutForm = document.querySelector('#logoutForm > form');
	if (!logoutForm)
		throw new Error('Fail to init view');
	logoutForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var registerForm = document.querySelector('#registerForm > form');
	if (!registerForm)
		throw new Error('Fail to init view');
	registerForm.addEventListener('submit', this.onFormSubmit.bind(this));

/**
 * Profile
 */
	var readProfileForm = document.querySelector('#readProfileForm > form');
	if (!readProfileForm)
		throw new Error('Fail to init view');
	readProfileForm.addEventListener('submit', this.getVerifyHandler(isProfile));

	var changeNameForm = document.querySelector('#changeNameForm > form');
	if (!changeNameForm)
		throw new Error('Fail to init view');
	changeNameForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var changePwdForm = document.querySelector('#changePwdForm > form');
	if (!changePwdForm)
		throw new Error('Fail to init view');
	changePwdForm.addEventListener('submit', this.onFormSubmit.bind(this));

	var resetAllForm = document.querySelector('#resetAllForm > form');
	if (!resetAllForm)
		throw new Error('Fail to init view');
	resetAllForm.addEventListener('submit', this.onFormSubmit.bind(this));
};


/**
 * Return form submit event handler binded to specified verification function
 * @param {function} verifyFunc 
 */
AdminApiConsoleView.prototype.getVerifyHandler = function(verifyFunc)
{
    return function(e)
    {
        return this.onFormSubmit(e, verifyFunc);
    }.bind(this);
};


/**
 * Activate view
 * @param {string} viewTarget 
 */
AdminApiConsoleView.prototype.activateView = function(viewTarget)
{
	if (!viewTarget)
		return;

	var newForm = ge(viewTarget);
	if (newForm)
	{
		if (this.activeForm)
			this.activeForm.classList.remove('active');
		newForm.classList.add('active');
		this.activeForm = newForm;
	}
};


/**
 * Activate specified menu item, expand sub menu if available and collapse submenus of other items
 * @param {Element} menuElem - menu item element to activate
 */
AdminApiConsoleView.prototype.activateMenu = function(menuElem)
{
	if (!menuElem || !menuElem.parentNode)
		return;

	if (menuElem.tagName == 'BUTTON')
	{
		if (this.activeController)
			this.activeController.classList.remove('active');
		if (menuElem.parentNode)
			menuElem.parentNode.classList.add('active');
		this.activeController = menuElem.parentNode;
	}
	else if (menuElem.tagName == 'LI' && menuElem.parentNode && menuElem.parentNode.classList.contains('sub-menu-list'))
	{
		if (this.activeFormLink)
			this.activeFormLink.classList.remove('active');
		this.activeFormLink = menuElem;
		this.activeFormLink.classList.add('active');

		var parentElem = menuElem.parentNode.parentNode;
		if (parentElem && !parentElem.classList.contains('active'))
		{
			if (this.activeController)
				this.activeController.classList.remove('active');
			parentElem.classList.add('active');
			this.activeController = parentElem;
		}
	}
};


/**
 * Controller title click event handler
 * @param {Event} e - click event object
 */
AdminApiConsoleView.prototype.onContrClick = function(e)
{
	var targetEl = e.target;

	this.activateMenu(targetEl);
	this.activateView(targetEl.dataset.target);
};


/**
 * Clear all items from request log container
 */
AdminApiConsoleView.prototype.clearResults = function()
{
	removeChilds(this.resultsContainer);
	this.clearResultsBtn.disabled = true;
};


/**
 * Obtain request data of specified form element
 * @param {HTMLFormElement} form - form element to obtain data from
 */
AdminApiConsoleView.prototype.getFormData = function(form)
{
	if (!form || !form.elements)
		return null;

	var res = {};

	for(var i = 0; i < form.elements.length; i++)
	{
		var inputEl = form.elements[i];
		if (inputEl.disabled || inputEl.name == '')
			continue;

		if ((inputEl.type == 'checkbox' || inputEl.type == 'radio') && !inputEl.checked)
			continue;

		res[inputEl.name] = inputEl.value;
	}

	return res;
};


/**
 * Form submit event handler
 * @param {Event} e - submit event object
 * @param {Function} verifyCallback - response verification callback
 */
AdminApiConsoleView.prototype.onFormSubmit = function(e, verifyCallback)
{
    e.preventDefault();

	var formEl = e.target;
	var frmData = this.getFormData(formEl);
	if (!frmData)
		return;

	var request = {
		method : formEl.action,
		data : frmData
	};

	if (formEl.method == 'get')
		this.apiGet(request, verifyCallback);
	else if (formEl.method == 'post')
		this.apiPost(request, verifyCallback);
};


/**
 * Checkbox change event handler
 * @param {Event} e - submit event object
 * @param {Function} verifyCallback - response verification callback
 */
AdminApiConsoleView.prototype.onCheck = function(e)
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
};


/**
 * Concatenate specified ids to URL base
 * @param {*} values 
 */
AdminApiConsoleView.prototype.parseIds = function(values)
{
	if (typeof values !== 'string')
		throw new Error('Invalid values specified');

	// Check correctness of ids
	var ids = values.split(',');

	return { id : ids };
};


AdminApiConsoleView.prototype.addRequestItem = function(reqData)
{
    var reqItem = {
        view: this
    };

    reqItem.itemContainer = ce('div', { className : 'request-item' });

    reqItem.requestContainer = ce('div', { className : 'request-container collapsed' });
    reqItem.requestContainer.addEventListener('click', function()
    {
        this.requestContainer.classList.toggle('collapsed');
    }.bind(reqItem));

    var reqText = reqData.url;
    if (reqText.indexOf(baseURL) === 0)
        reqText = reqText.substr(baseURL.length);

    reqItem.requestContainer.append(ce('div', { className : 'title', textContent : reqData.method + ' ' + reqText }));
    if (reqData.data)
        reqItem.requestContainer.append(ce('div', { className : 'request-details', textContent : reqData.data }));

    reqItem.resultContainer = ce('div', { className : 'response-container response-container_pending', textContent : 'Pending...' });

    reqItem.itemContainer.append(reqItem.requestContainer, reqItem.resultContainer);

    reqItem.addResult = function(res, title, rawResult)
    {
        this.resultContainer.classList.remove('response-container_pending')
        this.resultContainer.classList.add('response-container', 'collapsed', (res ? 'ok-result' : 'fail-result'))
        removeChilds(this.resultContainer);

        var titleEl = ce('div', { className : 'title', textContent : title });
        titleEl.addEventListener('click', function()
        {
            this.resultContainer.classList.toggle('collapsed');
        }.bind(reqItem));

        this.resultContainer.append(titleEl);

        if (rawResult)
        {
            this.resultContainer.append(ce('div', { className : 'response-details', textContent : rawResult }));
        }

        this.view.clearResultsBtn.disabled = false;
    };

    this.resultsContainer.append(reqItem.itemContainer);

    return reqItem;
};


/**
 * API request callback
 * @param {string} text - response text
 * @param {object} reqItem - request item object
 * @param {Function} verifyCallback - verification function
 */
AdminApiConsoleView.prototype.ajaxCallback = function(text, reqItem, verifyCallback)
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
};


/**
 * Convert data for POST request
 * @param {object} data - request data object
 */
AdminApiConsoleView.prototype.postData = function(data)
{
    return JSON.stringify(data);
};


/**
 * Check request data is single id case { id : value | [ value ] }
 * @param {object} data - request data object
 * @returns id value if match and false overwise
 */
AdminApiConsoleView.prototype.singleIdData = function(data)
{
    var keys = Object.keys(data);

    if (keys.length != 1 && keys[0] != 'id')
        return false;

    if (!Array.isArray(data.id))
        return data.id;

    if (data.id.length != 1)
        return false;

    return data.id[0];
};


/**
 * Convert API request object to request item
 * @param {object} request - API request object
 * @param {boolean} isPOST - if set to true POST request method is assumed
 */
AdminApiConsoleView.prototype.getRequestItem = function(request, isPOST)
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
            res.data = this.postData(request.data);
            res.headers['Content-Type'] = 'application/json';
        }
        else
        {
            res.method = 'GET';
            var id = this.singleIdData(request.data);
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
};


/**
 * Send GET request to API
 * @param {object} request - API request object
 * @param {Function} callback - user callback function
 */
AdminApiConsoleView.prototype.apiGet = function(request, callback)
{
    var requestItem = this.getRequestItem(request);
    var reqContainer = this.addRequestItem(requestItem);

    requestItem.callback = function(text)
    {
        this.ajaxCallback(text, reqContainer, callback);
    }.bind(this);

    ajax.get(requestItem);
};


/**
 * Send POST request to API
 * @param {object} request - API request object
 * @param {Function} callback - user callback function
 */
AdminApiConsoleView.prototype.apiPost = function(request, callback)
{
    var requestItem = this.getRequestItem(request, true);
    var reqContainer = this.addRequestItem(requestItem);

    requestItem.callback = function(text)
    {
        this.ajaxCallback(text, reqContainer, callback);
    }.bind(this);

    ajax.post(requestItem);
};


/**
 * Form event handlers
 */

AdminApiConsoleView.prototype.onReadAccountSubmit = function(e)
{
    e.preventDefault();

	var accInp = ge('readaccid');
	if (!accInp)
		return;

	this.apiGet({
		method : 'account/',
		data : this.parseIds(accInp.value),
		verify : isAccountsArray
	});
};


AdminApiConsoleView.prototype.onDeleteAccountSubmit = function(e)
{
    e.preventDefault();

	var accountsInp = ge('delaccounts');
	if (!accountsInp)
		return;

	this.apiPost({
		method : 'account/delete',
		data : this.parseIds(accountsInp.value)
	});
};


AdminApiConsoleView.prototype.onCurrencyReadSubmit = function(e)
{
    e.preventDefault();

	var curr_id_inp = ge('read_curr_id');
	if (!curr_id_inp)
		return;

	this.apiGet({
		method : 'currency/',
		data : this.parseIds(curr_id_inp.value),
		verify : isCurrenciesArray
	});
};


AdminApiConsoleView.prototype.onDeleteCurrencySubmit = function(e)
{
    e.preventDefault();

	var id_inp = ge('delcurrencies');
	if (!id_inp)
		return;

	this.apiPost({
		method : 'currency/delete',
		data : this.parseIds(id_inp.value)
	});
};


AdminApiConsoleView.prototype.onIconReadSubmit = function(e)
{
    e.preventDefault();

	var icon_id_inp = ge('read_icon_id');
	if (!icon_id_inp)
		return;

	this.apiGet({
		method : 'icon/',
		data : this.parseIds(icon_id_inp.value),
		verify : isIconsArray
	});
};


AdminApiConsoleView.prototype.onDeleteIconsSubmit = function(e)
{
    e.preventDefault();

	var id_inp = ge('del_icons');
	if (!id_inp)
		return;

	this.apiPost({
		method : 'icon/delete',
		data : this.parseIds(id_inp.value)
	});
};


AdminApiConsoleView.prototype.onReadPersonSubmit = function(e)
{
    e.preventDefault();

	var id_inp = ge('read_person_id');
	if (!id_inp)
		return;

	this.apiGet({
		method : 'person/',
		data : this.parseIds(id_inp.value),
		verify : isPersonsArray
	});
};


AdminApiConsoleView.prototype.onDeletePersonSubmit = function(e)
{
    e.preventDefault();

	var persondInp = ge('delpersons');
	if (!persondInp)
		return;

	this.apiPost({
		method : 'person/delete',
		data : this.parseIds(persondInp.value)
	});
};


AdminApiConsoleView.prototype.onListTransactionSubmit = function(e)
{
    e.preventDefault();

	var frmData = this.getFormData(e.target);
	if (!frmData)
		return false;

	if ('type' in frmData)
	{
		if (frmData.type)
			frmData.type = this.parseIds(frmData.type).id;
	}
	if ('acc_id' in frmData)
		frmData.acc_id = this.parseIds(frmData.acc_id).id;

	this.apiGet({
		method : 'transaction/list',
		data : frmData,
		verify : isTransactionsArray
	});

	return false;
};


AdminApiConsoleView.prototype.onReadTransactionSubmit = function(e)
{
    e.preventDefault();

	var transInp = ge('read_trans_id');
	if (!transInp)
		return;

	this.apiGet({
		method : 'transaction/',
		data : this.parseIds(transInp.value),
		verify : isTransactionsArray
	});
};


AdminApiConsoleView.prototype.onDeleteTransactionSubmit = function(e)
{
    e.preventDefault();

	var transInp = ge('deltransactions');
	if (!transInp)
		return;

	this.apiPost({
		method : 'transaction/delete',
		data : this.parseIds(transInp.value)
	});
};



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
			icon_id : isInt,
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


function isIcon(obj)
{
	return verifyObject(obj, {
			id : isInt,
			name : isString,
			file : isString,
			type : isInt,
		}, {
			createdate : isInt,
			updatedate : isInt,
		});
}


function isIconsArray(obj){ return isArrayOf(obj, isIcon); }


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
