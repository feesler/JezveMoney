
var singleAccDeleteTitle = 'Delete account';
var singleAccDeleteMsg = 'Are you sure want to delete selected account?<br>All income and expense transactions history will be lost. Transfer to this account will be changed to expense. Transfer from this account will be changed to income.';


/**
 * Create/update account view
 */
function AccountView(props)
{
	AccountView.parent.constructor.apply(this, arguments);

	this.model = {
		nameChanged : false
	};

	if (this.props.account)
	{
		this.model.original = this.props.account;
		this.model.data = copyObject(this.model.original);
	}
}


extend(AccountView, View);


/**
 * View initialization
 */
AccountView.prototype.onStart = function()
{
	this.iconSelect = DropDown.create({
		input_id : 'icon',
		onitemselect : this.onIconSelect.bind(this),
		editable : false,
		extraClass : 'dd__fullwidth'
	});
	if (!this.iconSelect)
		throw new Error('Failed to initialize Account view');

	this.currencySelect = DropDown.create({
		input_id : 'currency',
		onitemselect : this.onCurrencySelect.bind(this),
		editable : false,
		extraClass : 'dd__fullwidth'
	});
	if (!this.currencySelect)
		throw new Error('Failed to initialize Account view');

	this.currencySign = ge('currsign');
	if (!this.currencySign)
		throw new Error('Failed to initialize Account view');

	this.balanceInp = ge('balance');
	this.initBalanceDecimalInput = DecimalInput.create({
		elem : this.balanceInp,
		oninput : this.onInitBalanceInput.bind(this)
	});
	if (!this.initBalanceDecimalInput)
		throw new Error('Failed to initialize Account view');

	// Update mode
	if (this.model.original.id)
	{
		this.deleteBtn = ge('del_btn');
		var btn = this.deleteBtn.querySelector('button');
		if (!btn)
			throw new Error('Failed to initialize Account view');

		btn.onclick = this.onDelete.bind(this);

		this.delForm = ge('delform');
		if (!this.delForm)
			throw new Error('Failed to initialize Account view');
	}

	this.form = ge('accForm');
	if (!this.form)
		throw new Error('Invalid Account view');
	this.form.onsubmit = this.onSubmit.bind(this);

	this.nameInp = ge('accname');
	if (!this.nameInp)
		throw new Error('Invalid Account view');

	this.nameInp.oninput = this.onNameInput.bind(this);
};


/**
 * Icon select event handler
 */
AccountView.prototype.onIconSelect = function(obj)
{
	if (!obj)
		return;

	this.model.data.icon_id = obj.id;
	this.updateAccountTile();
};


/**
 * Currency select event handler
 */
AccountView.prototype.onCurrencySelect = function(obj)
{
	if (!obj)
		return;

	this.model.data.curr_id = obj.id;

	this.setCurrencySign(this.model.data.curr_id);
	this.updateAccountTile();
};


/**
 * Initial balance input event handler
 */
AccountView.prototype.onInitBalanceInput = function(e)
{
	if (!e || !e.target)
		return;

	clearBlockValidation('initbal-inp-block');

	this.model.data.initbalance = normalize(e.target.value);

	this.updateAccountTile();
};


/**
 * Account name input event handler
 */
AccountView.prototype.onNameInput = function(e)
{
	clearBlockValidation('name-inp-block');

	this.model.nameChanged = true;
	this.model.data.name = this.nameInp.value;

	this.updateAccountTile();
};


/**
 * Form submit event handler
 */
AccountView.prototype.onSubmit = function()
{
	if (!this.form || !this.nameInp || !this.balanceInp)
		return false;

	var valid = true;

	if (!this.nameInp.value || this.nameInp.value.length < 1)
	{
		invalidateBlock('name-inp-block');
        this.nameInp.focus();
		valid = false;
	}

	if (!this.balanceInp.value || this.balanceInp.value.length < 1 || !isNum(this.balanceInp.value))
	{
		invalidateBlock('initbal-inp-block');
        this.balanceInp.focus();
		valid = false;
	}

	return valid;
};


/**
 * Delete button click event handler
 */
AccountView.prototype.onDelete = function(e)
{
	this.showDeleteConfirmationPopup();
};


/**
 * Show account delete confirmation popup
 */
AccountView.prototype.showDeleteConfirmationPopup = function()
{
	if (!this.model.data.id)
		return;

	// check popup already created
	if (!this.delConfirmPopup)
	{
		this.delConfirmPopup = Popup.create({
			id : 'delete_warning',
			content : singleAccDeleteMsg,
			btn : {
				okBtn : { onclick : this.onDeleteConfirmResult.bind(this, true) },
				cancelBtn : { onclick : this.onDeleteConfirmResult.bind(this, false) }
			}
		});
	}

	this.delConfirmPopup.setTitle(singleAccDeleteTitle);
	this.delConfirmPopup.setContent(singleAccDeleteMsg);

	this.delConfirmPopup.show();
};


/**
 * Delete confirmation result handler
 * @param {boolean} result - user confirmed delete
 */
AccountView.prototype.onDeleteConfirmResult = function(result)
{
	if (this.delConfirmPopup)
		this.delConfirmPopup.close();

	if (result)
	{
		this.delForm.submit();
	}
};


/**
 * Set currency sign
 */
AccountView.prototype.setCurrencySign = function(curr_id)
{
	var currencyObj = getCurrency(curr_id);
	if (!currencyObj)
		return;

	this.currencySign.textContent = currencyObj.sign;
};


/**
 * Render account tile with the current model data
 */
AccountView.prototype.updateAccountTile = function()
{
	var bal = this.model.original.balance + this.model.data.initbalance - this.model.original.initbalance;
	var formatBalance = formatCurrency(bal, this.model.data.curr_id);

	var tileTitle = this.model.data.name;
	if (!this.model.original.id && !this.model.nameChanged)
		tileTitle = 'New account';

	setTileInfo('acc_tile', tileTitle, formatBalance, this.model.data.icon_id);
};
