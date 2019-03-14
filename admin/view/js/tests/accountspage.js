// List of accounts page class
function AccountsPage()
{
	AccountsPage.parent.constructor.apply(this, arguments);
}


extend(AccountsPage, TestPage);


AccountsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : this.parseIconLink(vge('add_btn')),
				toolbar : {
					elem : vge('toolbar'),
					editBtn : this.parseIconLink(vge('edit_btn')),
					exportBtn : this.parseIconLink(vge('export_btn')),
					delBtn : this.parseIconLink(vge('del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.exportBtn || !res.toolbar.delBtn)
		throw 'Wrong accounts page structure';

	res.title = res.titleEl.innerHTML;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

	return res;
};


// Click on add button and return navigation promise
AccountsPage.prototype.goToCreateAccount = function()
{
	return navigation(() => this.content.addBtn.click(), AccountPage);
};


// Select specified account, click on edit button and return navigation promise
AccountsPage.prototype.goToUpdateAccount = function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw 'Wrong account number specified';

	this.content.tiles[num].click();

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw 'Update account button not visible';

	return navigation(() => this.content.toolbar.editBtn.click(), AccountPage);
};


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

		this.content.tiles[acc_num].click();
		this.parse();

		var editIsVisible = isVisible(this.content.toolbar.editBtn.elem);
		if (ind == 0 && !editIsVisible)
			throw 'Edit button is not visible';
		else if (ind > 0 && editIsVisible)
			throw 'Edit button is visible while more than one accounts is selected';

		if (!isVisible(this.content.toolbar.delBtn.elem))
			throw 'Delete button is not visible';
	}, this);

	this.content.toolbar.delBtn.click();
	this.parse();

	if (!isVisible(this.content.delete_warning.elem))
		throw 'Delete account warning popup not appear';

	if (!this.content.delete_warning.okBtn)
		throw 'OK button not found';

	return navigation(() => clickEmul(this.content.delete_warning.okBtn), AccountsPage);
};
