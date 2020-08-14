var selectedItem = null;


// Return user object for specified id
function getUser(user_id)
{
	return idSearch(users, user_id);
}


// Update fields with specified user
function setUserValues(userObj)
{
	var user_id, user_login, user_name, user_pass, isadmin;

	user_id = ge('user_id');
	user_login = ge('user_login');
	user_name = ge('user_name');
	user_pass = ge('user_pass');
	isadmin = ge('isadmin');
	isdefault = ge('isdefault');
	if (!user_id || !user_login || !user_name || !user_pass || !isadmin || !isdefault)
		return;

	if (userObj)
	{
		enable(user_id, true);
		user_id.value = userObj.id;
		user_login.value = userObj.login;
		user_name.value = userObj.name;
		user_pass.value = '';
		isadmin.checked = (userObj.access == 1);
		isdefault.checked = (userObj.access == 0);
	}
	else			// clean
	{
		enable(user_id, false);
		user_id.value = '';
		user_login.value = '';
		user_name.value = '';
		user_pass.value = '';
		isadmin.checked = false;
		isdefault.checked = false;
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
	selectedItem = currObj;
	if (currObj)
	{
		user_frm.action = baseURL + 'api/user/update';
		setUserValues(currObj);
	}
	else			// clean
	{
		setUserValues(null);
	}

	show('del_btn', (currObj != null));
	show('updbtn', (currObj != null));
	show('passbtn', (currObj != null));
}


// New user button click handler
function newUser()
{
	var frm = ge('user_frm');
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
	enable('isdefault', true);

	frm.action = baseURL + 'api/user/create';
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
	show('pwd_block', true);
	enable('user_pass', true);
	show('admin_block', true);
	enable('isadmin', true);
	enable('isdefault', true);

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
	enable('isdefault', false);

	frm.action = baseURL + 'api/user/changePassword';

	dwPopup.setTitle('Set password');
	dwPopup.show();
}


// Delete user button click handler
function deleteUser()
{
	if (!selectedItem || !selectedItem.id)
		return;

	if (confirm('Are you sure want to delete selected user?'))
	{
		ajax.post({
			url : baseURL + 'api/user/del',
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
		url : baseURL + 'api/user/list',
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

	var users_list = ge('users_list');
	if (!users_list)
		return;

	removeChilds(users_list);

	users = respObj.data;

	var rows = users.map(function(item)
	{
		var row = ce('tr', {}, [
			ce('td', { innerText : item.id }),
			ce('td', { innerText : item.login }),
			ce('td', { innerText : item.name }),
			ce('td', { innerText : item.access }),
			ce('td', { innerText : item.accCount }),
			ce('td', { innerText : item.trCount }),
			ce('td', { innerText : item.pCount })
		]);

		row.onclick = onRowClick.bind(row);

		return row;
	});

	addChilds(users_list, rows);

	selectUser(null);
	dwPopup.close();
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

	var createbtn = ge('createbtn');
	if (createbtn)
		createbtn.addEventListener('click', newUser);
	var updbtn = ge('updbtn');
	if (updbtn)
		updbtn.addEventListener('click', updateUser);
	var passbtn = ge('passbtn');
	if (passbtn)
		passbtn.addEventListener('click', setUserPass);
	var del_btn = ge('del_btn');
	if (del_btn)
		del_btn.addEventListener('click', deleteUser);

	// popup initialization
	var frm = ge('user_frm');
	frm.onsubmit = onFormSubmit;
	dwPopup = Popup.create({ id : 'user_popup',
								content : frm,
								additional : 'center_only curr_content',
								btn : { closeBtn : true }
							});
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
