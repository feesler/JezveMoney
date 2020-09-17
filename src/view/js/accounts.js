var accNameChanged = false;
var selected = {
	visible : new Selection(),
	hidden : new Selection()
};
var dwPopup = null;		// delete warning popup

var singleAccDeleteTitle = 'Delete account';
var multiAccDeleteTitle = 'Delete accounts';
var multiAccDeleteMsg = 'Are you sure want to delete selected accounts?<br>All income and expense transactions history will be lost. Transfer to this accounts will be changed to expense. Transfer from this accounts will be changed to income.';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';


// Icon select callback
function onIconSel(obj)
{
	if (!obj)
		return;

	icon_id = obj.id;
	updateAccountTile();
}


// Currency select callback
function onCurrencySel(obj)
{
	var currsign;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	acc_currency = obj.id;
	setSign('currsign', acc_currency);
	updateAccountTile();
}


// Initialization of page controls
function initControls()
{
	DropDown.create({ input_id : 'icon', onitemselect : onIconSel, editable : false, extraClass : 'dd__fullwidth' });
	DropDown.create({ input_id : 'currency', onitemselect : onCurrencySel, editable : false, extraClass : 'dd__fullwidth' });

	DecimalInput.create({ elem : ge('balance'), oninput : onAccInitBalanceInput });

	// Update mode
	if (typeof account_id !== 'undefined')
	{
		var del_btn = ge('del_btn');
		if (del_btn && del_btn.firstElementChild)
			del_btn.firstElementChild.onclick = onDelete;
	}

	var accForm = ge('accForm');
	if (accForm)
		accForm.onsubmit = onAccountSubmit;

	var accnameInp = ge('accname');
	if (accnameInp)
		accnameInp.oninput = onAccNameInput.bind(null, accnameInp);
}


// Tile click event handler
function onTileClick(e)
{
	if (!e || !e.target)
		return;

	var tile = e.target.closest('.tile');
	if (!tile || !tile.dataset)
		return;

	var account_id = parseInt(tile.dataset.id);
	var account = getAccount(account_id);
	if (!account)
		return;
	
	var edit_btn = ge('edit_btn');
	var del_btn = ge('del_btn');
	var showaccounts = ge('showaccounts');
	var hideaccounts = ge('hideaccounts');
	var delaccounts = ge('delaccounts');
	var export_btn = ge('export_btn');
	var show_btn = ge('show_btn');
	var hide_btn = ge('hide_btn');
	if (!edit_btn || !del_btn || !showaccounts || !hideaccounts || !delaccounts || !export_btn || !show_btn || !hide_btn)
		return;

	var currentSelection = isHiddenAccount(account) ? selected.hidden : selected.visible;
	if (currentSelection.isSelected(account_id))
	{
		currentSelection.deselect(account_id);
		tile.classList.remove('tile_selected');
	}
	else
	{
		currentSelection.select(account_id);
		tile.classList.add('tile_selected');
	}

	var selCount = selected.visible.count();
	var hiddenSelCount = selected.hidden.count();
	var totalSelCount = selCount + hiddenSelCount;
	show(edit_btn, (totalSelCount == 1));
	show(export_btn, (totalSelCount > 0));
	show(show_btn, (hiddenSelCount > 0));
	show(hide_btn, (selCount > 0));
	show(del_btn, (totalSelCount > 0));

	var selArr = selected.visible.getIdArray();
	var hiddenSelArr = selected.hidden.getIdArray();
	var totalSelArr = selArr.concat(hiddenSelArr);
	showaccounts.value = totalSelArr.join();
	hideaccounts.value = totalSelArr.join();
	delaccounts.value = totalSelArr.join();

	if (totalSelCount == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = baseURL + 'accounts/edit/' + totalSelArr[0];
	}

	if (totalSelCount > 0)
	{
		if (export_btn.firstElementChild && export_btn.firstElementChild.tagName.toLowerCase() == 'a')
		{
			var exportURL = baseURL + 'accounts/export/';
			if (totalSelCount == 1)
				exportURL += totalSelArr[0];
			else
				exportURL += '?' + urlJoin({ id : totalSelArr });
			export_btn.firstElementChild.href = exportURL;
		}
	}

	show('toolbar', (totalSelCount > 0));
	if (totalSelCount > 0)
	{
		onScroll();
	}
}


// Initialization of page controls
function initAccListControls()
{
	var tilesContainer = ge('tilesContainer');
	var hiddenTilesContainer = ge('hiddenTilesContainer');
	var show_btn = ge('show_btn');
	var hide_btn = ge('hide_btn');
	var del_btn = ge('del_btn');
	if (!tilesContainer || !hiddenTilesContainer || !show_btn || !hide_btn || !del_btn)
		return;

	tilesContainer.addEventListener('click', onTileClick);
	hiddenTilesContainer.addEventListener('click', onTileClick);

	show_btn.addEventListener('click', function()
	{
		var showform = ge('showform');
			showform.submit();
	});

	hide_btn.addEventListener('click', function()
	{
		var hideform = ge('hideform');
			hideform.submit();
	});

	var btnEl = del_btn.firstElementChild;
	if (btnEl)
		btnEl.onclick = showDeletePopup;
}


// Set currency sign
function setSign(obj, curr_id)
{
	var signobj, curr;

	signobj = ge(obj);
	if (!signobj)
		return;

	curr = getCurrency(curr_id);
	if (!curr)
		return;

	signobj.innerHTML = curr.sign;
}


// Update account tile with the current values
function updateAccountTile()
{
	var formatBalance, bal, name;

	bal = acc_balance + new_init_balance - acc_init_balance;
	formatBalance = formatCurrency(bal, acc_currency);

	if (typeof account_id === 'undefined' && !accNameChanged)
		name = 'New account';
	else
		name = acc_name;

	setTileInfo('acc_tile', name, formatBalance, icon_id);
}


// Account name input event handler
function onAccNameInput(obj)
{
	if (!obj)
		return;

	clearBlockValidation('name-inp-block');

	accNameChanged = true;
	acc_name = obj.value;

	updateAccountTile();
}


// Account initial balance input event handler
function onAccInitBalanceInput(e)
{
	if (!e || !e.target)
		return;

	clearBlockValidation('initbal-inp-block');

	new_init_balance = normalize(e.target.value);

	updateAccountTile();
}


// New account submit event handler
function onAccountSubmit(frm)
{
	var accname = ge('accname');
	var balance = ge('balance');
	if (!frm || !accname || !balance)
		return false;

	var valid = true;

	if (!accname.value || accname.value.length < 1)
	{
		invalidateBlock('name-inp-block');
		valid = false;
	}

	if (!balance.value || balance.value.length < 1 || !isNum(balance.value))
	{
		invalidateBlock('initbal-inp-block');
		valid = false;
	}

	return valid;
}


// Delete account iconlink click event handler
function onDelete()
{
	selected.visible.select(account_id);

	showDeletePopup();
}


// Delete popup callback
function onDeletePopup(res)
{
	var delform;

	if (dwPopup)
		dwPopup.close();

	if (res)
	{
		delform = ge('delform');
		if (delform)
			delform.submit();
	}
}


// Create and show account delete warning popup
function showDeletePopup()
{
	var totalSelCount = selected.visible.count() + selected.hidden.count();
	if (totalSelCount == 0)
		return;

	var multi = (totalSelCount > 1);

	// check popup already created
	if (!dwPopup)
	{
		dwPopup = Popup.create({ id : 'delete_warning',
						content : (multi) ? multiAccDeleteMsg : singleAccDeleteMsg,
						btn : { okBtn : { onclick : onDeletePopup.bind(null, true) },
								cancelBtn : { onclick : onDeletePopup.bind(null, false) } }
						});
	}

	dwPopup.setTitle((multi) ? multiAccDeleteTitle : singleAccDeleteTitle);
	dwPopup.setContent((multi) ? multiAccDeleteMsg : singleAccDeleteMsg);

	dwPopup.show();
}