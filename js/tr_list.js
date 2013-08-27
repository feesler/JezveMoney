var transactions =
{
	selectedArr : [],

	// Return position of transaction in selectedArr
	getPos : function(acc_id)
	{
		return this.selectedArr.indexOf(acc_id);
	},


	isSelected : function(tr_id)
	{
		return this.selectedArr.some(function(trans_id){ return trans_id == tr_id; });
	},


	selectAccount : function(tr_id)
	{
		if (!acc_id || this.isSelected(tr_id))
			return false;

		this.selectedArr.push(tr_id);
		return true;
	},


	deselectAccount : function(tr_id)
	{
		var tr_pos = this.getPos(tr_id);

		if (tr_pos == -1)
			return false;

		this.selectedArr.splice(tr_pos, 1);
		return true;
	},


	selectedCount : function()
	{
		return this.selectedArr.length;
	}
};



// Account change event handler
function onAccountChange()
{
	var acc_id, accsel;
	var newLocation;

	accsel = ge('accsel');
	if (!accsel)
		return;

	acc_id = parseInt(selectedValue(accsel));

	if (curAccId == acc_id)
		return;

	newLocation = './transactions.php?type=' + transType;
	if (acc_id != 0)
		newLocation += '&acc_id=' + acc_id;

	window.location = newLocation;
}


// Transaction block click event handler
function onTransClick(tr_id)
{
	var transObj, edit_btn, del_btn, deltrans;
	var actDiv;

	transObj = ge('tr_' + tr_id);
	edit_btn = ge('edit_btn');
	del_btn = ge('del_btn');
	deltrans = ge('deltrans');
	if (!transObj || !edit_btn || !deltrans)
		return;

	if (accounts.isSelected(tr_id))
	{
		accounts.deselectAccount(tr_id);

		transObj.firstElementChild.className = '';
	}
	else
	{
		accounts.selectAccount(tr_id);

		transObj.firstElementChild.className = 'act_tr';
	}

	show(edit_btn, (accounts.selectedCount() == 1));
	show(del_btn, (accounts.selectedCount() > 0));
}

