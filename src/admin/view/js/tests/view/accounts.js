if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;
	var isArray = common.isArray;

	var TestView = require('./testview.js');
}


// List of accounts view class
function AccountsView()
{
	AccountsView.parent.constructor.apply(this, arguments);
}


extend(AccountsView, TestView);


AccountsView.prototype.parseContent = async function()
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
		throw new Error('Wrong accounts view structure');

	res.title = this.prop(res.titleEl, 'innerText');
	res.tiles = await this.parseTiles(await this.query('.tiles'));

	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};


// Click on add button and return navigation promise
AccountsView.prototype.goToCreateAccount = function()
{
	return this.navigation(() => this.content.addBtn.click());
};


// Select specified account, click on edit button and return navigation promise
AccountsView.prototype.goToUpdateAccount = async function(num)
{
	if (!this.content.tiles || this.content.tiles.items.length <= num)
		throw new Error('Wrong account number specified');

	await this.content.tiles.items[num].click();

	if (!this.content.toolbar.elem || !this.isVisible(this.content.toolbar.elem) ||
		!this.content.toolbar.editBtn || !this.isVisible(this.content.toolbar.editBtn.elem))
		throw new Error('Update account button not visible');

	return this.navigation(() => this.content.toolbar.editBtn.click());
};


// Delete secified accounts and return navigation promise
AccountsView.prototype.deleteAccounts = async function(acc)
{
	if (!acc)
		throw new Error('No accounts specified');

	if (!isArray(acc))
		acc = [acc];

	let ind = 0;
	for(let acc_num of acc)
	{
		if (acc_num >= this.content.tiles.items.length)
			throw new Error('Wrong account number');

		await this.performAction(() => this.content.tiles.items[acc_num].click());

		var editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
		if (ind == 0 && !editIsVisible)
			throw new Error('Edit button is not visible');
		else if (ind > 0 && editIsVisible)
			throw new Error('Edit button is visible while more than one accounts is selected');

		if (!await this.isVisible(this.content.toolbar.delBtn.elem))
			throw new Error('Delete button is not visible');

		ind++;
	}

	await this.performAction(() => this.content.toolbar.delBtn.click());

	if (!await this.isVisible(this.content.delete_warning.elem))
		throw new Error('Delete account warning popup not appear');

	if (!this.content.delete_warning.okBtn)
		throw new Error('OK button not found');

	return this.navigation(() => this.click(this.content.delete_warning.okBtn));
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = AccountsView;
