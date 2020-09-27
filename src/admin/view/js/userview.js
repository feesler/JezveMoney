/**
 * Admin currecny list view
 */
function AdminUserListView()
{
    AdminUserListView.parent.constructor.apply(this, arguments);

    this.apiController = 'user';
}


extend(AdminUserListView, AdminListView);


/**
 * View initialization
 */
AdminUserListView.prototype.onStart = function()
{
    AdminUserListView.parent.onStart.apply(this, arguments);

	this.idInput = ge('user_id');
	this.loginBlock = ge('login_block');
	this.loginInput = ge('user_login');
	this.nameBlock = ge('name_block');
	this.nameInput = ge('user_name');
	this.passwordBlock = ge('pwd_block');
	this.passwordInput = ge('user_pass');
	this.adminBlock = ge('admin_block');
	this.adminRadio = ge('isadmin');
	this.defaultRadio = ge('isdefault');

	this.changePassBtn = ge('passbtn');
	if (this.changePassBtn)
		this.changePassBtn.addEventListener('click', this.setUserPass.bind(this));
};


/**
 * Set up fields of form for specified item
 * @param {*} item - object to set up dialog for. if set to null create mode is assumed, if set to object then update mode
 */
AdminUserListView.prototype.setItemValues = function(item)
{
	if (item)
	{
		this.idInput.value = item.id;
		this.loginInput.value = item.login;
		this.nameInput.value = item.name;
		this.adminRadio.checked = (item.access == 1);
		this.defaultRadio.checked = (item.access == 0);
	}
	else			// clean
	{
		this.idInput.value = '';
		this.loginInput.value = '';
		this.nameInput.value = '';
		this.adminRadio.checked = false;
		this.defaultRadio.checked = false;
	}
	this.passwordInput.value = '';
};


/**
 * Process item selection
 * @param {*} id - item identificator
 */
AdminUserListView.prototype.selectItem = function(id)
{
    AdminUserListView.parent.selectItem.apply(this, arguments);

    show(this.changePassBtn, (this.selectedItem != null));
};


/**
 * Before show create item dialog
 */
AdminUserListView.prototype.preCreateItem = function()
{
	this.dialogPopup.setTitle('Create user');

	show(this.loginBlock, true);
	enable(this.loginInput, true);
	show(this.nameBlock, true);
	enable(this.nameInput, true);
	show(this.passwordBlock, true);
	enable(this.passwordInput, true);
	show(this.adminBlock, true);
	enable(this.adminRadio, true);
	enable(this.defaultRadio, true);
};


/**
 * Before show update item dialog
 */
AdminUserListView.prototype.preUpdateItem = function()
{
	this.dialogPopup.setTitle('Update user');

	show(this.loginBlock, true);
	enable(this.loginInput, true);
	show(this.nameBlock, true);
	enable(this.nameInput, true);
	show(this.passwordBlock, true);
	enable(this.passwordInput, true);
	show(this.adminBlock, true);
	enable(this.adminRadio, true);
	enable(this.defaultRadio, true);
};


/**
 * Change password button click handler
 */
AdminUserListView.prototype.setUserPass = function()
{
	this.dialogPopup.setTitle('Set password');

	show(this.loginBlock, false);
	enable(this.loginInput, false);
	show(this.nameBlock, false);
	enable(this.nameInput, false);
	show(this.passwordBlock, true);
    this.passwordInput.value = '';
	enable(this.passwordInput, true);
	show(this.adminBlock, false);
	enable(this.adminRadio, false);
	enable(this.defaultRadio, false);

	this.itemForm.action = baseURL + 'api/' + this.apiController + '/changePassword';

	this.dialogPopup.show();
}


/**
 * Render list element for specified item
 * @param {object} item - item object
 */
AdminUserListView.prototype.renderItem = function(item)
{
    if (!item)
        return null;

    return ce('tr', {}, [
                ce('td', { textContent : item.id }),
                ce('td', { textContent : item.login }),
                ce('td', { textContent : item.name }),
                ce('td', { textContent : item.access }),
                ce('td', { textContent : item.accCount }),
                ce('td', { textContent : item.trCount }),
                ce('td', { textContent : item.pCount }),
            ]);
};
