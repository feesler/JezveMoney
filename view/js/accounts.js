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

	var finpFunc = function(e){ return onAccBalanceInput(this); };
	var fkeyFunc = function(e){ return onFieldKey(e, this); };

	var elem = ge('balance');
	setParam(elem, { oninput : finpFunc.bind(elem), onkeypress : fkeyFunc.bind(elem) });
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

	show(edit_btn, (accounts.count() == 1));
	show(export_btn, (accounts.count() == 1));
	show(del_btn, (accounts.count() > 0));

	selArr = accounts.getIdArray();
	delaccounts.value = selArr.join();

	if (accounts.count() == 1)
	{
		if (firstElementChild(edit_btn) && firstElementChild(edit_btn).tagName.toLowerCase() == 'a')
			firstElementChild(edit_btn).href = baseURL + 'accounts/edit/' + selArr[0];
		if (firstElementChild(export_btn) && firstElementChild(export_btn).tagName.toLowerCase() == 'a')
			firstElementChild(export_btn).href = './csvexport.php?id=' + selArr[0];
	}

	show('toolbar', (accounts.count() > 0));
	if (accounts.count() > 0)
	{
		onScroll();
	}
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
	var formatBalance, icon, iconType;

	icon = ge('icon');
	if (!icon)
		return;

	formatBalance = formatCurrency(acc_balance, acc_currency);
	iconType = parseInt(selectedValue(icon));

	setTileInfo('acc_tile', acc_name, formatBalance, iconType);
}


// Account name input event handler
function onAccNameInput(obj)
{
	if (!obj)
		return;

	acc_name = obj.value;

	updateAccountTile();
}


// Account initial balance input event handler
function onAccBalanceInput(obj)
{
	if (!obj)
		return;

	acc_balance = normalize(obj.value);

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