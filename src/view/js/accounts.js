var accNameChanged = false;
var accounts = new Selection();
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

	this.setText(obj.str);

	iconType = obj.id;
	updateAccountTile();
}


// Currency select callback
function onCurrencySel(obj)
{
	var currsign;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	this.setText(obj.str);

	acc_currency = obj.id;
	setSign('currsign', acc_currency);
	updateAccountTile();
}


// Initialization of page controls
function initControls()
{
	var isMobile;
	var currDDList, iconDDList;

	isMobile = (document.documentElement.clientWidth < 700);

	iconDDList = new DDList();
	if (!iconDDList.create({ input_id : 'icon', selCB : onIconSel, editable : false, mobile : isMobile }))
		iconDDList = null;

	currDDList = new DDList();
	if (!currDDList.create({ input_id : 'currency', selCB : onCurrencySel, editable : false, mobile : isMobile }))
		currDDList = null;

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
		accForm.onsubmit = onNewAccountSubmit;

	var accnameInp = ge('accname');
	if (accnameInp)
		accnameInp.oninput = onAccNameInput.bind(null, accnameInp);
}


// Tile click event handler
function onTileClick(acc_id)
{
	var tile, edit_btn, del_btn, delaccounts, export_btn;
	var actDiv;
	var selArr;

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	delaccounts = ge('delaccounts');
	export_btn = ge('export_btn');
	if (!tile || !edit_btn || !delaccounts || !export_btn)
		return;

	if (accounts.isSelected(acc_id))
	{
		accounts.deselect(acc_id);

		actDiv = ge('act_' + acc_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		accounts.select(acc_id);

		actDiv = ce('div', { id : 'act_' + acc_id, className : 'act', onclick : onTileClick.bind(null, acc_id) });

		tile.appendChild(actDiv);
	}

	var selCount = accounts.count();
	show(edit_btn, (selCount == 1));
	show(export_btn, (selCount > 0));
	show(del_btn, (selCount > 0));

	selArr = accounts.getIdArray();
	delaccounts.value = selArr.join();

	if (selCount == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = baseURL + 'accounts/edit/' + selArr[0];
	}

	if (selCount > 0)
	{
		if (export_btn.firstElementChild && export_btn.firstElementChild.tagName.toLowerCase() == 'a')
		{
			var exportURL = baseURL + 'accounts/export/';
			if (selCount == 1)
				exportURL += selArr[0];
			else
				exportURL += '?' + urlJoin({ id : selArr });
			export_btn.firstElementChild.href = exportURL;
		}
	}

	show('toolbar', (selCount > 0));
	if (selCount > 0)
	{
		onScroll();
	}
}


// Initialization of page controls
function initAccListControls()
{
	var tilesContainer, tileEl, btnEl, del_btn;
	var pos, tile_id;

	tilesContainer = ge('tilesContainer');
	del_btn = ge('del_btn');
	if (!tilesContainer || !del_btn)
		return;

	tileEl = tilesContainer.firstElementChild;
	while(tileEl)
	{
		pos = tileEl.id.indexOf('_');
		if (pos !== -1)
		{
			tile_id = parseInt(tileEl.id.substr(pos + 1));
			if (!isNaN(tile_id))
			{
				btnEl = tileEl.firstElementChild;
				if (btnEl)
					btnEl.onclick = onTileClick.bind(null, tile_id);
			}
		}

		tileEl = tileEl.nextElementSibling;
	}

	btnEl = del_btn.firstElementChild;
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

	setTileInfo('acc_tile', name, formatBalance, iconType);
}


// Account name input event handler
function onAccNameInput(obj)
{
	if (!obj)
		return;

	accNameChanged = true;
	acc_name = obj.value;

	updateAccountTile();
}


// Account initial balance input event handler
function onAccInitBalanceInput(e)
{
	var obj = e.target;
	if (!obj)
		return;

	new_init_balance = normalize(obj.value);

	updateAccountTile();
}


// New account submit event handler
function onNewAccountSubmit(frm)
{
	var accname, balance;

	accname = ge('accname');
	balance = ge('balance');
	if (!frm || !accname || !balance)
		return false;

	if (!accname.value || accname.value.length < 1)
	{
		alert('Please type name of account.');
		return false;
	}

	if (!balance.value || balance.value.length < 1 || !isNum(balance.value))
	{
		alert('Please type correct initial balance.');
		return false;
	}

	return true;
}


// Delete account iconlink click event handler
function onDelete()
{
	accounts.select(account_id);

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
	var multi;

	if (accounts.count() == 0)
		return;

	multi = (accounts.count() > 1);

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