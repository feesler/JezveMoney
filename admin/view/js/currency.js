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
		curr_id.value = currObj[0];
		del_curr_id.value = currObj[0];
		curr_name.value = currObj[1];
		curr_sign.value = currObj[2];
		curr_format.checked = (currObj[3] == 1);
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

	currObj = getCurrencyObject(id);
	if (currObj)
	{
		curr_frm.action = '../modules/currency.php?act=edit';
		setCurrencyValues(currObj);
		show('del_btn', true);
		show('updbtn', true);
	}
	else			// clean
	{
		setCurrencyValues(null);
	}
}


// Currency select button click handler
function onSelectCurrency(id)
{
	selectCurrency(id);
	selectByValue(ge('curr_sel'), id);
}


// Currency list change handler
function onCurrSel()
{
	var curr_sel;

	curr_sel = ge('curr_sel');
	if (!curr_sel)
		return;

	selectCurrency(selectedValue(curr_sel))
}


// New currency button click handler
function newCurr()
{
	var curr_frm;

	curr_frm = ge('curr_frm');
	if (!curr_frm)
		return;

	curr_frm.action = '../modules/currency.php?act=new';
	setCurrencyValues(null);

	show('del_btn', false);

	dwPopup.show();
}


// Update currency button click handler
function updateCurr()
{
	if (dwPopup)
		dwPopup.show();
}


// Show confirm delete currency dialog
function onDeleteSubmit(frm)
{
	return confirm('Are you sure want to delete selected currency?');
}


var dwPopup = null;

// Controls initialization
function initControls()
{
	dwPopup = new Popup();

	if (!dwPopup.create({ id : 'currency_popup', content : 'curr_content' }))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();
	dwPopup.hide();		// TODO: fix appending popup to DOM on create

	show('curr_content', true);
}


// Hide popup
function onClosePopup()
{
	if (dwPopup)
		dwPopup.hide();
}
