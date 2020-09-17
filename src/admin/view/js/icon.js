var selectedItem = null;


// Update fields with specified item
function setItemValues(item)
{
	var icon_id = ge('icon_id');
	var icon_name = ge('icon_name');
	var icon_file = ge('icon_file');
	var icon_type = ge('icon_type');
	if (!icon_id || !icon_name || !icon_file || !icon_type)
		return;

	if (item)
	{
		enable(icon_id, true);
		icon_id.value = item.id;
		icon_name.value = item.name;
		icon_file.value = item.file;
		selectByValue(icon_type, item.type);
	}
	else			// clean
	{
		icon_id.value = '';
		enable(icon_id, false);
		icon_name.value = '';
		icon_file.value = '';
		selectByValue(icon_type, 0);
	}
}


// Find icon by id
function getIcon(id)
{
	if (!Array.isArray(itemsData))
		return null;

	return itemsData.find(function(item){ return item && item.id == id });
}


// Process item selection
function selectItem(id)
{
	var itemForm = ge('icon_frm');
	if (!itemForm)
		return;

	var item = getIcon(id);
	selectedItem = item;
	if (item)
	{
		itemForm.action = baseURL + 'api/icon/update';
		setItemValues(item);
	}
	else			// clean
	{
		setItemValues(null);
	}

	show('del_btn', (item != null));
	show('updbtn', (item != null));
}


// New item button click handler
function newItem()
{
	var itemForm = ge('icon_frm');
	if (!itemForm)
		return;

	itemForm.action = baseURL + 'api/icon/create';
	setItemValues(null);

	dwPopup.show();
}


// Update item button click handler
function updateItem()
{
	if (dwPopup)
		dwPopup.show();
}


// Delete item button click handler
function deleteItem()
{
	if (!selectedItem || !selectedItem.id)
		return;

	if (confirm('Are you sure want to delete selected icon?'))
	{
		ajax.post({
			url : baseURL + 'api/icon/del',
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
		url : baseURL + 'api/icon/list',
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

	var itemsList = ge('icons_list');
	if (!itemsList)
		return;

	removeChilds(itemsList);

	itemsData = respObj.data;

	var rows = itemsData.map(function(item)
	{
		var row = ce('tr', {}, [
			ce('td', { innerText : item.id }),
			ce('td', { innerText : item.name }),
			ce('td', { innerText : item.file }),
			ce('td', { innerText : item.type }),
		]);

		row.onclick = onRowClick.bind(row);

		return row;
	});

	addChilds(itemsList, rows);

	selectItem(null);
	dwPopup.close();
}


var dwPopup = null;
var activeRow = null;

// Controls initialization
function initControls()
{
	// table initialization
	var tbl = ge('icons_tbl')
	if (!tbl || !tbl.firstElementChild)
		return;
	var tbody = tbl.firstElementChild.nextElementSibling;
	if (!tbody)
		return;
	var row = tbody.firstElementChild;
	while(row)
	{
		row.onclick = onRowClick.bind(row);

		row = row.nextElementSibling;
	}

	var createbtn = ge('createbtn');
	if (createbtn)
		createbtn.addEventListener('click', newItem);
	var updbtn = ge('updbtn');
	if (updbtn)
		updbtn.addEventListener('click', updateItem);
	var del_btn = ge('del_btn');
	if (del_btn)
		del_btn.addEventListener('click', deleteItem);

	// popup initialization
	var itemForm = ge('icon_frm');
	itemForm.onsubmit = onFormSubmit;
	dwPopup = Popup.create({ id : 'icon_popup',
							content : itemForm,
							additional : 'center_only icon-form',
						 	btn : { closeBtn : true }});
}


// Table row click handler
function onRowClick()
{
	if (!this)
		return;

	if (activeRow)
		activeRow.classList.remove('act');

	this.classList.add('act');
	activeRow = this;

	var idcell = this.firstElementChild;
	if (!idcell)
		return;
	var item_id = parseInt(idcell.innerHTML);

	selectItem(item_id);
}
