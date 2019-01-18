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
	var results;

	results = ge('results');
	if (!results)
		return;

	results.innerHTML = text;
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


function initControls()
{
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
}
