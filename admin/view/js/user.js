// Return user object for specified id
function getUser(user_id)
{
	return idSearch(users, user_id);
}


// Update fields with specified user
function setUserValues(userObj)
{
	var user_id, del_user_id, user_login, user_name, user_pass, isadmin;

	user_id = ge('user_id');
	del_user_id = ge('del_user_id');
	user_login = ge('user_login');
	user_name = ge('user_name');
	user_pass = ge('user_pass');
	isadmin = ge('isadmin');
	if (!user_id || !del_user_id || !user_login || !user_name || !user_pass || !isadmin)
		return;

	if (userObj)
	{
		user_id.value = userObj.id;
		del_user_id.value = userObj.id;
		user_login.value = userObj.login;
		user_name.value = userObj.owner;
		user_pass.value = '';
		isadmin.checked = (userObj.access == 1);
	}
	else			// clean
	{
		user_id.value = '';
		del_user_id.value = '';
		user_login.value = '';
		user_name.value = '';
		user_pass.value = '';
		isadmin.checked = false;
	}
}


// Process user selection
function selectUser(id)
{
	var user_frm, currObj;

	user_frm = ge('user_frm');
	if (!user_frm)
		return;

	currObj = getUser(id);
	if (currObj)
	{
		user_frm.action = baseURL + 'admin/user.php?act=edit';
		setUserValues(currObj);
		show('del_btn', true);
		show('updbtn', true);
	}
	else			// clean
	{
		setUserValues(null);
	}
}


// New user button click handler
function newUser()
{
	var frm;

	frm = ge('user_frm');
	if (!frm)
		return;

	show('pwd_block', true);
	enable('user_pass', true);

	frm.action = baseURL + 'admin/user.php?act=new';
	setUserValues(null);

	dwPopup.show();
}


// Update user button click handler
function updateUser()
{
	show('pwd_block', false);
	enable('user_pass', false);

	if (dwPopup)
		dwPopup.show();
}


// Delete user button click handler
function deleteUser()
{
	var delfrm = ge('delfrm');

	if (!delfrm)
		return;

	if (confirm('Are you sure want to delete selected user?'))
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

	tbl = ge('users_tbl')
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
	var frm = ge('user_frm');
	dwPopup = Popup.create({ id : 'user_popup',
							content : frm,
							additional : 'center_only curr_content',
						 	btn : { okBtn : { onclick : frm.submit.bind(frm) }, closeBtn : true }});
}


// Table row click handler
function onRowClick()
{
	var idcell, row_id;

	if (!this)
		return;

	if (activeRow)
		removeClass(activeRow, 'act');

	addClass(this, 'act');
	activeRow = this;

	idcell = firstElementChild(this);
	if (!idcell)
		return;
	row_id = parseInt(idcell.innerHTML);

	selectUser(row_id);
}
