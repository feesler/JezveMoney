var singlePersonDeleteTitle = 'Delete person';
var singlePersonDeleteMsg = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';


/**
 * Create/update person view
 */
function PersonView(props)
{
	PersonView.parent.constructor.apply(this, arguments);

	this.model = {};

	if (this.props.person)
	{
		this.model.original = this.props.person;
		this.model.data = copyObject(this.model.original);
	}
}


extend(PersonView, View);


/**
 * View initialization
 */
PersonView.prototype.onStart = function()
{
	this.form = ge('personForm');
	if (!this.form)
		throw new Error('Failed to initialize Person view');
	this.form.onsubmit = this.onSubmit.bind(this);

	this.nameInp = ge('pname');
	if (!this.nameInp)
		throw new Error('Failed to initialize Person view');

	this.nameInp.addEventListener('input', this.onNameInput.bind(this));

	// Update mode
	if (this.model.original.id)
	{
        this.deleteBtn = ge('del_btn');
        if (!this.deleteBtn)
		    throw new Error('Failed to initialize Person view');
		var btn = this.deleteBtn.querySelector('button');
		if (!btn)
			throw new Error('Failed to initialize Person view');

        btn.onclick = this.onDelete.bind(this);

		this.delForm = ge('delform');
		if (!this.delForm)
			throw new Error('Failed to initialize Person view');
    }
};


/**
 * Person name input event handler
 */
PersonView.prototype.onNameInput = function()
{
    clearBlockValidation('name-inp-block');
};


/**
 * Form submit event handler
 */
PersonView.prototype.onSubmit = function()
{
	if (!this.form || !this.nameInp)
		return false;

	var valid = true;

	if (!this.nameInp.value || this.nameInp.value.length < 1)
	{
		invalidateBlock('name-inp-block');
        this.nameInp.focus();
		valid = false;
	}

	return valid;
};


/**
 * Delete button click event handler
 */
PersonView.prototype.onDelete = function()
{
	this.showDeleteConfirmationPopup();
};


/**
 * Show person delete confirmation popup
 */
PersonView.prototype.showDeleteConfirmationPopup = function()
{
	if (!this.model.data.id)
		return;

	// check popup already created
	if (!this.delConfirmPopup)
	{
		this.delConfirmPopup = Popup.create({
			id : 'delete_warning',
			content : singlePersonDeleteMsg,
			btn : {
				okBtn : { onclick : this.onDeleteConfirmResult.bind(this, true) },
				cancelBtn : { onclick : this.onDeleteConfirmResult.bind(this, false) }
			}
		});
	}

	this.delConfirmPopup.setTitle(singlePersonDeleteTitle);
	this.delConfirmPopup.setContent(singlePersonDeleteMsg);

	this.delConfirmPopup.show();
};


/**
 * Confirmation popup result handler
 * @param {boolean} result - user confirmation result
 */
PersonView.prototype.onDeleteConfirmResult = function(result)
{
	if (this.delConfirmPopup)
		this.delConfirmPopup.close();

	if (result)
	{
		this.delForm.submit();
	}
};
