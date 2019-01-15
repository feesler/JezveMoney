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


function onCurrencyReadSubmit()
{
	var params = {};
	var curr_id_inp = ge('curr_id');

	if (!curr_id_inp)
		return;

	var link = baseURL + 'api/currency/';

	var idsPar = csToIds(curr_id_inp.value);
	if (idsPar)
		link += '?' + urlJoin(idsPar);

	ajax.get(link, ajaxCallback);
}
