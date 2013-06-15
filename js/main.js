// Handler for click on empty space event
function onEmptyClick(callback, elem)
{
	var e, elem;

	callback = callback || null;
	if (!callback)
		return;
	e = event;
	elem = ge(elem) || null;

	if ((elem && (e.target != elem && e.target.parentNode != elem)) || !elem)
		callback();
}


// Set or unset event handler for 
function setEmptyClick(callback, elem)
{
	callback = callback || null;
	elem = elem || null;

	if (document.documentElement)
	{
		document.documentElement.onclick = ((callback) ? bind(onEmptyClick, null, callback, elem) : null);
	}
}


// Hide usem menu popup
function hidePopup()
{
	show('menupopup', false);
	setEmptyClick();
}


// Show/hide user menu by click
function onUserClick()
{
	if (isVisible('menupopup'))
	{
		hidePopup();
	}
	else
	{
		show('menupopup', true);
		setEmptyClick(hidePopup, 'userbtn');
	}
}


// Log in form submit event handler
function onLoginSubmit(frm)
{
	var login, password;

	login = ge('login');
	password = ge('password');
	if (!frm || !login || !password)
		return false;

	if (!login.value || login.value.length < 1)
	{
		alert('Please type your account name.');
		return false;
	}

	if (!password.value || password.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	return true;
}


// Registration form submit event handler
function onRegisterSubmit(frm)
{
	var login, password, name;

	login = ge('login');
	password = ge('password');
	name = ge('name');
	if (!frm || !login || !password || !name)
		return false;

	if (!login.value || login.value.length < 1)
	{
		alert('Please type your account name.');
		return false;
	}

	if (!name.value || name.value.length < 1)
	{
		alert('Please type your name.');
		return false;
	}

	if (!password.value || password.value.length < 1)
	{
		alert('Please type your password.');
		return false;
	}

	return true;
}


// Change password submit event handler
function onChangePassSubmit(frm)
{
	var oldpwd, newpwd;

	oldpwd = ge('oldpwd');
	newpwd = ge('newpwd');
	if (!frm || !oldpwd || !newpwd)
		return false;

	if (!oldpwd.value || oldpwd.value.length < 1)
	{
		alert('Please type your current password.');
		return false;
	}

	if (!newpwd.value || newpwd.value.length < 1)
	{
		alert('Please type new password.');
		return false;
	}

	if (newpwd.value == oldpwd.value)
	{
		alert('New password must be different from the old.');
		return false;
	}

	return true;
}


// Change name submit event handler
function onChangeNameSubmit(frm)
{
	var newname;

	newname = ge('newname');
	if (!frm || !newname)
		return false;

	if (!newname.value || newname.value.length < 1)
	{
		alert('Please type new name.');
		return false;
	}

	if (newname.value == p_name)
	{
		alert('New name must be different from the old.');
		return false;
	}

	return true;
}


var accounts =
{
	selectedArr : [],

	// Return position of account in selectedArr
	getPos : function(acc_id)
	{
		return this.selectedArr.indexOf(acc_id);
	},


	isSelected : function(acc_id)
	{
		return this.selectedArr.some(function(account_id){ return account_id == acc_id; });
	},


	selectAccount : function(acc_id)
	{
		if (!acc_id || this.isSelected(acc_id))
			return false;

		this.selectedArr.push(acc_id);
		return true;
	},


	deselectAccount : function(acc_id)
	{
		var acc_pos = this.getPos(acc_id);

		if (acc_pos == -1)
			return false;

		this.selectedArr.splice(acc_pos, 1);
		return true;
	},


	selectedCount : function()
	{
		return this.selectedArr.length;
	}
};



// Tile click event handler
function onTileClick(acc_id)
{
	var tile, edit_btn, del_btn;
	var actDiv;

	tile = ge('acc_' + acc_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	if (!tile || !edit_btn)
		return;

	if (accounts.isSelected(acc_id))
	{
		accounts.deselectAccount(acc_id);

		actDiv = ge('act_' + acc_id);
		if (actDiv)
			tile.removeChild(actDiv);
	}
	else
	{
		accounts.selectAccount(acc_id);

		actDiv = ce('div', { id : 'act_' + acc_id, className : 'act', onclick : bind(onTileClick, null, acc_id) });

		tile.appendChild(actDiv);
	}

	show(edit_btn, (accounts.selectedCount() == 1));
	show(del_btn, (accounts.selectedCount() > 0));

	if (accounts.selectedCount() == 1)
	{
		if (edit_btn.firstElementChild && edit_btn.firstElementChild.tagName.toLowerCase() == 'a')
			edit_btn.firstElementChild.href = './editaccount.php?id=' + accounts.selectedArr[0];
	}
}


// Retunr sign of specified currency
function getCurrencySign(curr_id)
{
	var currSign = '';

	if (!currency)
		return currSign;

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currSign = curr[2];

		return (curr[0] == curr_id);
	});

	return currSign;
}


// Set currency sign
function setSign(signobj, curr_id)
{
	if (!signobj)
		return;

	signobj.innerHTML = getCurrencySign(curr_id);
}


// Currency change event handler
function onChangeAccountCurrency(obj)
{
	var currsign, curr_id;

	currsign = ge('currsign');
	if (!obj || !currsign)
		return;

	curr_id = selectedValue(obj);

	setSign(currsign, curr_id);
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


var dwPopup;


// Create and show delete warning popup box
function showPopupBox()
{
	dwPopup = new Popup();
	if (!dwPopup)
		return;

	if (!dwPopup.create({ id : 'delete_warning',
						title : 'Delete account',
						msg : 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.',
						btn : { okBtn : { type : 'submit' }, cancelBtn : { } }
						}))
	{
		dwPopup = null;
		return;
	}

	dwPopup.show();

	
/*
	var popup;

	popup = createPopup('delete_warning', 'Delete account', 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.');

	if (!popup)
		return;

	document.body.appendChild(popup);
	popup = ge('delete_warning');
		


	document.body.style.overflow = 'hidden';
	document.documentElement.scrollTop = 0;
	show(popup, true);
*/
}


/*
// Close delete warning popup box
function hidePopupBox()
{
	var popup;

	popup = ge('delete_warning');
	if (!popup)
		return;

	show(popup, false);
	document.body.style.overflow = '';
	popup.parentNode.removeChild(popup);
}
*/


// Create popup DOM structure and return object
function createPopup(p_id, title, msg)
{
	var popup;

	popup = ce('div', { id : p_id, className : 'popup', style : { display : 'none' } },
					[
						ce('div', { className : 'popup_back' }),
						ce('div', { className : 'popup_content' }, 
							[
								ce('div', { className : 'box' },
									[
										ce('h1', { className : 'popup_title', innerHTML : title }),
										ce('div', { className : 'popup_message' }, [ ce('div', { innerHTML : msg }) ]),
										ce('div', { className : 'popup_controls' }, 
											[
												ce('input', { className : 'btn ok_btn', type : 'submit', value : 'ok' }),
												ce('button', { className : 'btn cancel_btn', onclick : hidePopupBox, innerHTML : 'cancel' })
											]),
									])
							])
					]);

	return popup;
}


// Popup constructor
function Popup()
{
	this.popupObj = null;
	this.backObj = null;
	this.contentObj = null;
	this.boxObj = null;
	this.titleObj = null;
	this.messageObj = null;
	this.controlsObj = null;
	this.okBtn = null;
	this.cancelBtn = null;


	this.mergeDef = function(obj, mergeObj)
	{
		var par, val;
	
		if (!obj || typeof obj !== 'object' || !mergeObj || typeof mergeObj !== 'object')
			return;

		for(par in mergeObj)
		{
			val = mergeObj[par];
			if (typeof val === 'object')
			{
				if (!(par in obj))
					obj[par] = {};
				this.mergeDef(obj[par], val);
			}
			else if (!(par in obj))
				obj[par] = val;
		}
	}


	this.create = function(params)
	{
		var popupObj, backObj, contentObj, boxObj, titleObj, messageObj, controlsObj, okBtn, cancelBtn;

		if (!params || !params.id || !params.title || !params.msg || !params.btn)
			return false;

		popupObj = ce('div', { id : params.id, className : 'popup', style : { display : 'none' } });
		if (!popupObj)
			return false;

		backObj = ce('div', { className : 'popup_back' });
		contentObj = ce('div', { className : 'popup_content' });
		boxObj = ce('div', { className : 'box' });
		if (!backObj || !contentObj || !boxObj)
			return false;

		titleObj = ce('h1', { className : 'popup_title', innerHTML : params.title });
		messageObj = ce('div', { className : 'popup_message' }, [ ce('div', { innerHTML : params.msg }) ]);
		controlsObj = ce('div', { className : 'popup_controls' });
		if (!titleObj || !messageObj || !controlsObj)
			return false;

		this.popupObj = popupObj;
		this.backObj = backObj;
		this.contentObj = contentObj;
		this.boxObj = boxObj;
		this.titleObj = titleObj;
		this.messageObj = messageObj;
		this.controlsObj = controlsObj;

		if (params.btn.okBtn)
		{
			okBtn = ce('input', { className : 'btn ok_btn' });
			if (!okBtn)
				return false;

			this.mergeDef(params.btn.okBtn, { type : 'button', value : 'ok' });
			setParam(okBtn, params.btn.okBtn);
			this.okBtn = okBtn;
		}

		if (params.btn.cancelBtn)
		{
			cancelBtn = ce('input', { className : 'btn cancel_btn' });
			if (!cancelBtn)
				return false;

			this.mergeDef(params.btn.cancelBtn, { type : 'button', value : 'cancel', onclick : bind(this.close, this) });
			setParam(cancelBtn, params.btn.cancelBtn);
			this.cancelBtn = cancelBtn;
		}

		addChilds(this.controlsObj, [this.okBtn, this.cancelBtn]);
		addChilds(this.boxObj, [this.titleObj, this.messageObj, this.controlsObj]);
		addChilds(this.contentObj, [this.boxObj]);
		addChilds(this.popupObj, [this.backObj, this.contentObj]);

		return true;
	},


	this.show = function()
	{
		if (!this.popupObj)
			return;

		document.body.appendChild(this.popupObj);
		document.body.style.overflow = 'hidden';
		document.documentElement.scrollTop = 0;
		show(this.popupObj, true);
	},


	this.hide = function()
	{
		if (!this.popupObj)
			return;

		show(this.popupObj, false);
		document.body.style.overflow = '';
	},


	this.close = function()
	{
		if (!this.popupObj)
			return;

		this.hide();

		this.popupObj.parentNode.removeChild(this.popupObj);
		this.popupObj = null;
	}
}
