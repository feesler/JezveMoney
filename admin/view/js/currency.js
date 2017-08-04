// Update fields with specified currency
function setCurrencyValues(currObj)
{
	var curr_id, del_curr_id, curr_name, curr_sign, curr_format;

	curr_id = ge('curr_id');
	del_curr_id = ge('del_curr_id');
	curr_name = ge('curr_name');
	curr_sign = ge('curr_sign');
	curr_format = ge('curr_format');
	if (!curr_id || !del_curr_id || !curr_name || !curr_sign || !curr_format)
		return;

	if (currObj)
	{
		curr_id.value = currObj.id;
		del_curr_id.value = currObj.id;
		curr_name.value = currObj.name;
		curr_sign.value = currObj.sign;
		curr_format.checked = (currObj.format == 1);
	}
	else			// clean
	{
		curr_id.value = '';
		del_curr_id.value = '';
		curr_name.value = '';
		curr_sign.value = '';
		curr_format.checked = false;
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
	if (currObj)
	{
		curr_frm.action = baseURL + 'admin/currency.php?act=edit';
		setCurrencyValues(currObj);
		show('del_btn', true);
		show('updbtn', true);
	}
	else			// clean
	{
		setCurrencyValues(null);
	}
}


// New currency button click handler
function newCurr()
{
	var curr_frm;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	curr_frm.action = baseURL + 'admin/currency.php?act=new';
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
	var delfrm = ge('delfrm');

	if (!delfrm)
		return;

	if (confirm('Are you sure want to delete selected currency?'))
	{
		delfrm.submit();
	}
}


var dwPopup = null;
var activeRow = null;

// Controls initialization
function initControls()
{
	// table initialization
	var tbl, tbody, row;

	tbl = ge('currencies_tbl')
	if (!tbl)
		return;
	tbody = nextElementSibling(firstElementChild(tbl));
	if (!tbody)
		return;
	row = firstElementChild(tbody);
	while(row)
	{
		row.onclick = onRowClick.bind(row);

		row = nextElementSibling(row);
	}

	// popup initialization
	var frm = ge('curr_frm');
	dwPopup = Popup.create({ id : 'currency_popup',
							content : frm,
							additional : 'center_only curr_content',
						 	btn : { okBtn : { onclick : frm.submit.bind(frm) }, closeBtn : true }});
}


// Table row click handler
function onRowClick()
{
	var idcell, curr_id;

	if (!this)
		return;

	if (activeRow)
		removeClass(activeRow, 'act');

	addClass(this, 'act');
	activeRow = this;

	idcell = firstElementChild(this);
	if (!idcell)
		return;
	curr_id = parseInt(idcell.innerHTML);

	selectCurrency(curr_id);
}
