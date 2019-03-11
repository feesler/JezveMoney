// List of accounts page class
function AccountsPage()
{
	AccountsPage.parent.constructor.apply(this, arguments);
}


extend(AccountsPage, TestPage);


AccountsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : vquery('#add_btn > a'),
				toolbar : {
					elem : vge('toolbar'),
					editBtnElem : vquery('#edit_btn'),
					exportBtnElem : vquery('#export_btn'),
					delBtnElem : vquery('#del_btn')
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtnElem || !res.toolbar.exportBtnElem || !res.toolbar.delBtnElem)
		throw 'Wrong accounts page structure';

	res.editBtn = res.toolbar.editBtnElem.firstElementChild;
	res.exportBtn = res.toolbar.exportBtnElem.firstElementChild;
	res.delBtn = res.toolbar.delBtnElem.firstElementChild;

	res.title = res.titleEl.innerHTML;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

	return res;
};


// Click on add button and return navigation promise
AccountsPage.prototype.goToCreateAccount = function()
{
	return navigation(() => clickEmul(this.content.addBtn), AccountPage);
};


// Select specified account, click on edit button and return navigation promise
AccountsPage.prototype.goToUpdateAccount = function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw 'Wrong account number specified';

	var tile = this.content.tiles[num];

	clickEmul(tile.linkElem);

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.editBtn || !isVisible(this.content.toolbar.editBtnElem))
		throw 'Update account button not visible';

	return navigation(() => clickEmul(this.content.editBtn), AccountPage);
}


// Delete secified accounts and return navigation promise
AccountsPage.prototype.deleteAccounts = function(acc)
{
	if (!acc)
		throw 'No accounts specified';

	if (!isArray(acc))
		acc = [acc];

	acc.forEach(function(acc_num, ind)
	{
		if (acc_num >= this.content.tiles.length)
			throw 'Wrong account number';

		clickEmul(this.content.tiles[acc_num].elem.firstElementChild);
		this.parse();

		var editIsVisible = isVisible(this.content.toolbar.editBtnElem);
		if (ind == 0 && !editIsVisible)
			throw 'Edit button is not visible';
		else if (ind > 0 && editIsVisible)
			throw 'Edit button is visible while more than one accounts is selected';

		if (!isVisible(this.content.toolbar.delBtnElem))
			throw 'Delete button is not visible';
	}, this);

	clickEmul(this.content.delBtn);
	this.parse();

	if (!isVisible(this.content.delete_warning.elem))
		throw 'Delete account warning popup not appear';

	if (!this.content.delete_warning.okBtn)
		throw 'OK button not found';

	return navigation(() => clickEmul(this.content.delete_warning.okBtn), AccountsPage);
}
