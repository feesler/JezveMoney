var selectedItem = null;


// Update fields with specified currency
function setCurrencyValues(currObj)
{
	var curr_id, curr_name, curr_sign, isbefore, isafter;

	curr_id = ge('curr_id');
	curr_name = ge('curr_name');
	curr_sign = ge('curr_sign');
	isbefore = ge('isbefore');
	isafter = ge('isafter');
	if (!curr_id || !curr_name || !curr_sign || !isbefore || !isafter)
		return;

	if (currObj)
	{
		curr_id.value = currObj.id;
		curr_name.value = currObj.name;
		curr_sign.value = currObj.sign;
		isbefore.checked = (currObj.format == 1);
		isafter.checked = (currObj.format == 0);
	}
	else			// clean
	{
		curr_id.value = '';
		curr_name.value = '';
		curr_sign.value = '';
		isbefore.checked = false;
		isafter.checked = true;
	}
}


// Process currency selection
function selectCurrency(id)
{
	var curr_frm, currObj;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	currObj = getCurrency(id);
	selectedItem = currObj;
	if (currObj)
	{
		curr_frm.action = baseURL + 'api/currency/update';
		setCurrencyValues(currObj);
	}
	else			// clean
	{
		setCurrencyValues(null);
	}

	show('del_btn', (currObj != null));
	show('updbtn', (currObj != null));
}


// New currency button click handler
function newCurr()
{
	var curr_frm;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	curr_frm.action = baseURL + 'api/currency/create';
	setCurrencyValues(null);

	dwPopup.show();
}


// Update currency button click handler
function updateCurr()
{
	if (dwPopup)
		dwPopup.show();
}


// Delete currency button click handler
function deleteCurr()
{
	if (!selectedItem || !selectedItem.id)
		return;

	if (confirm('Are you sure want to delete selected currency?'))
	{
		ajax.post({
			url : baseURL + 'api/currency/del',
			data : JSON.stringify({ id : selectedItem.id }),
			headers : { 'Content-Type' : 'application/json' },
			callback : onSubmitResult
		});
	}
}


function onFormSubmit()
{
	var els = {};
	var formEl = this;

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

	if (formEl.method == 'get')
	{
		var params = urlJoin(els);
		var link = formEl.action;
		if (params != '')
			link += ((link.indexOf('?') != -1) ? '&' : '?') + params;
		ajax.get({
			url : link,
			callback : onSubmitResult
		});
	}
	else if (formEl.method == 'post')
	{
		ajax.post({
			url : formEl.action,
			data : JSON.stringify(els),
			headers : { 'Content-Type' : 'application/json' },
			callback : onSubmitResult
		});
	}

	return false;
}


function onSubmitResult(response)
{
	var respObj;
	var failMessage = 'Fail to submit request';
	var res = false;

	try
	{
		respObj = JSON.parse(response);
		res = (respObj && respObj.result == 'ok');
		if (!res && respObj && respObj.msg)
			failMessage = respObj.msg;
	}
	catch(e)
	{
		console.log(e.message);
	}

	if (!res)
	{
		createMessage(failMessage, 'msg_error');
		return;
	}

	requestList();
}


function requestList()
{
	ajax.get({
		url : baseURL + 'api/currency/list',
		callback : onListResult
	});
}


function onListResult(response)
{
	var respObj;
	var res = false;

	try
	{
		respObj = JSON.parse(response);
		res = (respObj && respObj.result == 'ok');
	}
	catch(e)
	{
		console.log(e.message);
	}

	if (!res)
		return;

	var curr_list = ge('curr_list');
	if (!curr_list)
		return;

	removeChilds(curr_list);

	currency = respObj.data;

	var rows = currency.map(function(item)
	{
		var row = ce('tr', {}, [
			ce('td', { innerText : item.id }),
			ce('td', { innerText : item.name }),
			ce('td', { innerText : item.sign }),
			ce('td', { innerText : item.format }),
		]);

		row.onclick = onRowClick.bind(row);

		return row;
	});

	addChilds(curr_list, rows);

	selectCurrency(null);
	dwPopup.close();
}


var dwPopup = null;
var activeRow = null;

// Controls initialization
function initControls()
{
	// table initialization
	var tbl, tbody, row;

	tbl = ge('currencies_tbl')
	if (!tbl || !tbl.firstElementChild)
		return;
	tbody = tbl.firstElementChild.nextElementSibling;
	if (!tbody)
		return;
	row = tbody.firstElementChild;
	while(row)
	{
		row.onclick = onRowClick.bind(row);

		row = row.nextElementSibling;
	}

	// popup initialization
	var frm = ge('curr_frm');
	frm.onsubmit = onFormSubmit;
	dwPopup = Popup.create({ id : 'currency_popup',
							content : frm,
							additional : 'center_only curr_content',
						 	btn : { closeBtn : true }});

	var updbtn = ge('updbtn');
	updbtn.onclick = updateCurr;

	var del_btn = ge('del_btn');
	del_btn.onclick = deleteCurr;
}


// Table row click handler
function onRowClick()
{
	var idcell, curr_id;

	if (!this)
		return;

	if (activeRow)
		activeRow.classList.remove('act');

	this.classList.add('act');
	activeRow = this;

	idcell = this.firstElementChild;
	if (!idcell)
		return;
	curr_id = parseInt(idcell.innerHTML);

	selectCurrency(curr_id);
}
