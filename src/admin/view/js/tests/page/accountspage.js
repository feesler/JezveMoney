// List of accounts page class
function AccountsPage()
{
	AccountsPage.parent.constructor.apply(this, arguments);
}


extend(AccountsPage, TestPage);


AccountsPage.prototype.parseContent = function()
{
	var res = { titleEl : vquery('.content_wrap > .heading > h1'),
 				addBtn : this.parseIconLink(vquery('#add_btn')),
				toolbar : {
					elem : vquery('#toolbar'),
					editBtn : this.parseIconLink(vquery('#edit_btn')),
					exportBtn : this.parseIconLink(vquery('#export_btn')),
					delBtn : this.parseIconLink(vquery('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.exportBtn || !res.toolbar.delBtn)
		throw new Error('Wrong accounts page structure');

	res.title = res.titleEl.innerText;
	res.tiles = this.parseTiles(vquery('.tiles'));

	res.delete_warning = this.parseWarningPopup(vquery('#delete_warning'));

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
		throw new Error('Wrong account number specified');

	this.content.tiles[num].click();

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update account button not visible');

	return navigation(() => this.content.toolbar.editBtn.click(), AccountPage);
};


// Delete secified accounts and return navigation promise
AccountsPage.prototype.deleteAccounts = function(acc)
{
	if (!acc)
		throw new Error('No accounts specified');

	if (!isArray(acc))
		acc = [acc];

	let selectPromise = acc.reduce((prev, acc_num, ind) =>
	{
		return prev
				.then(() => this.performAction(() =>
				{
					if (acc_num >= this.content.tiles.length)
						throw new Error('Wrong account number');

					this.content.tiles[acc_num].click();

					return Promise.resolve();
				}))
				.then(() =>
				{
					var editIsVisible = isVisible(this.content.toolbar.editBtn.elem);
					if (ind == 0 && !editIsVisible)
						throw new Error('Edit button is not visible');
					else if (ind > 0 && editIsVisible)
						throw new Error('Edit button is visible while more than one accounts is selected');

					if (!isVisible(this.content.toolbar.delBtn.elem))
						throw new Error('Delete button is not visible');

					return Promise.resolve();
				});
	}, Promise.resolve());

	return selectPromise
			.then(() =>	this.performAction(() => this.content.toolbar.delBtn.click()))
			.then(() =>
			{
				if (!isVisible(this.content.delete_warning.elem))
					throw new Error('Delete account warning popup not appear');

				if (!this.content.delete_warning.okBtn)
					throw new Error('OK button not found');

				return navigation(() => clickEmul(this.content.delete_warning.okBtn), AccountsPage);
			});
};
