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
		user_frm.action = baseURL + 'admin/user/edit';
		setUserValues(currObj);
		show('del_btn', true);
		show('updbtn', true);
		show('passbtn', true);
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
	if (!dwPopup || !frm)
		return;

	show('login_block', true);
	enable('user_login', true);
	show('name_block', true);
	enable('user_name', true);
	show('pwd_block', true);
	enable('user_pass', true);
	show('admin_block', true);
	enable('isadmin', true);

	frm.action = baseURL + 'admin/user/new';
	setUserValues(null);

	dwPopup.setTitle('Create user');
	dwPopup.show();
}


// Update user button click handler
function updateUser()
{
	if (!dwPopup)
		return;

	show('login_block', true);
	enable('user_login', true);
	show('name_block', true);
	enable('user_name', true);
	show('pwd_block', false);
	enable('user_pass', false);
	show('admin_block', true);
	enable('isadmin', true);

	dwPopup.setTitle('Update user');
	dwPopup.show();
}


// Change password button click handler
function setUserPass()
{
	var frm;

	frm = ge('user_frm');
	if (!frm || !dwPopup)
		return;

	show('login_block', false);
	enable('user_login', false);
	show('name_block', false);
	enable('user_name', false);
	show('pwd_block', true);
	enable('user_pass', true);
	show('admin_block', false);
	enable('isadmin', false);

	frm.action = baseURL + 'admin/user/chpwd';

	dwPopup.setTitle('Set password');
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
		activeRow.classList.remove('act');

	this.classList.add('act');
	activeRow = this;

	idcell = this.firstElementChild;
	if (!idcell)
		return;
	row_id = parseInt(idcell.innerHTML);

	selectUser(row_id);
}
