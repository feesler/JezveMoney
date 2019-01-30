var actilveController = null;
var activeFormLink = null;
var activeForm = null;

var clearResultsBtn = null;

function onContrClick(e)
{
	e = fixEvent(e);

	if (e.target.tagName == 'BUTTON')
	{
		if (actilveController)
			removeClass(actilveController, 'active');
		addClass(e.target.parentNode, 'active');
		actilveController = e.target.parentNode;
	}
	else if (e.target.tagName == 'LI' && hasClass(e.target.parentNode, 'sub_list'))
	{
		if (activeFormLink)
			removeClass(activeFormLink, 'active');
		activeFormLink = e.target;
		addClass(activeFormLink, 'active');

		var formTarget = e.target.dataset.target;

		var newForm = ge(formTarget);
		if (newForm)
		{
			show(activeForm, false);
			show(newForm, true);
			activeForm = newForm;
		}
	}
}


function clearResults()
{
	removeChilds(results);
	show(clearResultsBtn, false);
}


function addResult(text)
{
	var results = ge('results');
	if (!results)
		return;

	var resCont = ce('div', { className : 'res_container' });

	resCont.innerHTML = text;

	results.appendChild(resCont);

	show(clearResultsBtn, true);
}


function onFormSubmit(obj)
{
	var link, els = {}, params;

	if (!obj || !obj.elements)
		return false;

	for(i = 0; i < obj.elements.length; i++)
	{
		if (!obj.elements[i].disabled && obj.elements[i].name != '')
			els[obj.elements[i].name] = obj.elements[i].value;
	}

	if (obj.method == 'get')
	{
		params = urlJoin(els);
		link = obj.action;
		if (params != '')
			link += ((link.indexOf('?') != -1) ? '&' : '?') + params;
		ajax.get(link, ajaxCallback);
	}
	else if (obj.method == 'post')
	{
		params = urlJoin(els);
		link = obj.action;
		ajax.post(link, params, ajaxCallback);
	}

	return false;
}


function ajaxCallback(text)
{
	addResult(text);
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


function onReadAccountSubmit()
{
	var accInp = ge('readaccid');

	if (!accInp)
		return;

	var link = baseURL + 'api/account/';

	var idsPar = csToIds(accInp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	ajax.get(link, ajaxCallback);
}


function onCreateAccountSubmit()
{
	var nameInp = ge('accname');
	var balanceInput = ge('accbalance');
	var currencyInput = ge('acccurrency');
	var iconInput = ge('accicon');

	if (!nameInp || !balanceInput || !currencyInput || !iconInput)
		return;

	var link = baseURL + 'api/account/create';

	var params = {};

	params.name = nameInp.value;
	params.balance = balanceInput.value;
	params.currency = currencyInput.value;
	params.icon = iconInput.value;

 	var data = urlJoin(params);

	ajax.post(link, data, ajaxCallback);
}


function onUpdateAccountSubmit()
{
	var idInp = ge('updaccid');
	var nameInp = ge('updaccname');
	var balanceInput = ge('updaccbalance');
	var currencyInput = ge('updacccurrency');
	var iconInput = ge('updaccicon');

	if (!idInp || !nameInp || !balanceInput || !currencyInput || !iconInput)
		return;

	var link = baseURL + 'api/account/update';

	var params = {};

	params.id = idInp.value;
	params.name = nameInp.value;
	params.balance = balanceInput.value;
	params.currency = currencyInput.value;
	params.icon = iconInput.value;

 	var data = urlJoin(params);

	ajax.post(link, data, ajaxCallback);
}


function onDeleteAccountSubmit()
{
	var accountsInp = ge('delaccounts');

	if (!accountsInp)
		return;

	var link = baseURL + 'api/account/delete';

	var idsPar = csToIds(accountsInp.value);
	data = urlJoin(idsPar);

	ajax.post(link, data, ajaxCallback);
}


function onCurrencyReadSubmit()
{
	var curr_id_inp = ge('curr_id');

	if (!curr_id_inp)
		return;

	var link = baseURL + 'api/currency/';

	var idsPar = csToIds(curr_id_inp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	ajax.get(link, ajaxCallback);
}


function onReadPersonSubmit()
{
	var id_inp = ge('readpid');

	if (!id_inp)
		return;

	var link = baseURL + 'api/person/';

	var idsPar = csToIds(id_inp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	ajax.get(link, ajaxCallback);
}


function onDeletePersonSubmit()
{
	var persondInp = ge('delpersons');

	if (!persondInp)
		return;

	var link = baseURL + 'api/person/delete';

	var idsPar = csToIds(persondInp.value);
	data = urlJoin(idsPar);

	ajax.post(link, data, ajaxCallback);
}


function onReadTransactionSubmit()
{
	var transInp = ge('readtransid');

	if (!transInp)
		return;

	var link = baseURL + 'api/transaction/';

	var idsPar = csToIds(transInp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	ajax.get(link, ajaxCallback);
}


function onDeleteTransactionSubmit()
{
	var transInp = ge('deltransactions');

	if (!transInp)
		return;

	var link = baseURL + 'api/transaction/delete';

	var idsPar = csToIds(transInp.value);
	data = urlJoin(idsPar);

	ajax.post(link, data, ajaxCallback);
}


function initControls()
{
	var controllersList = ge('controllersList');
	if (controllersList)
		controllersList.onclick = onContrClick;

	clearResultsBtn = ge('clearResultsBtn');
	if (clearResultsBtn)
		clearResultsBtn.onclick = clearResults;

	var readaccbtn = ge('readaccbtn');
	if (readaccbtn)
		readaccbtn.onclick = onReadAccountSubmit;

	var accbtn = ge('accbtn');
	if (accbtn)
		accbtn.onclick = onCreateAccountSubmit;

	var accbtn = ge('accbtn');
	if (accbtn)
		accbtn.onclick = onCreateAccountSubmit;

	var updaccbtn = ge('updaccbtn');
	if (updaccbtn)
		updaccbtn.onclick = onUpdateAccountSubmit;

	var delaccbtn = ge('delaccbtn');
	if (delaccbtn)
		delaccbtn.onclick = onDeleteAccountSubmit;

	var readpersonbtn = ge('readpersonbtn');
	if (readpersonbtn)
		readpersonbtn.onclick = onReadPersonSubmit;

	var delpersonbtn = ge('delpersonbtn');
	if (delpersonbtn)
		delpersonbtn.onclick = onDeletePersonSubmit;

	var readtransbtn = ge('readtransbtn');
	if (readtransbtn)
		readtransbtn.onclick = onReadTransactionSubmit;

	var deltransbtn = ge('deltransbtn');
	if (deltransbtn)
		deltransbtn.onclick = onDeleteTransactionSubmit;
}
