// List of accounts page class
function AccountsPage()
{
	AccountsPage.parent.constructor.apply(this, arguments);
}


extend(AccountsPage, TestPage);


AccountsPage.prototype.parseContent = async function()
{
	var res = { titleEl : await this.query('.content_wrap > .heading > h1'),
 				addBtn : await this.parseIconLink(await this.query('#add_btn')),
				toolbar : {
					elem : await this.query('#toolbar'),
					editBtn : await this.parseIconLink(await this.query('#edit_btn')),
					exportBtn : await this.parseIconLink(await this.query('#export_btn')),
					delBtn : await this.parseIconLink(await this.query('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.exportBtn || !res.toolbar.delBtn)
		throw new Error('Wrong accounts page structure');

	res.title = res.titleEl.innerText;
	res.tiles = await this.parseTiles(await this.query('.tiles'));

	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
AccountsPage.prototype.goToCreateAccount = function()
{
	return this.navigation(() => this.content.addBtn.click(), AccountPage);
};


// Select specified account, click on edit button and return navigation promise
AccountsPage.prototype.goToUpdateAccount = async function(num)
{
	if (!this.content.tiles || this.content.tiles.length <= num)
		throw new Error('Wrong account number specified');

	await this.content.tiles[num].click();

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update account button not visible');

	return this.navigation(() => this.content.toolbar.editBtn.click(), AccountPage);
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

					return this.content.tiles[acc_num].click();
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

				return this.navigation(() => this.click(this.content.delete_warning.okBtn), AccountsPage);
			});
};
