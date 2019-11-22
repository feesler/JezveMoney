if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../common.js');
	var extend = common.extend;
	var isArray = common.isArray;
	var idSearch = common.idSearch;

	var TestView = require('./testview.js');
}


// List of transactions view class
function TransactionsView()
{
	TransactionsView.parent.constructor.apply(this, arguments);
}


extend(TransactionsView, TestView);


TransactionsView.prototype.getTransactionObject = async function(trans_id)
{
	return idSearch(await this.global('transArr'), trans_id);
};


TransactionsView.prototype.parseContent = async function()
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
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.delBtn)
		throw new Error('Wrong transactions view structure');

	res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));

	res.title = await this.prop(res.titleEl, 'innerText');
	res.transList = await this.parseTransactionsList(await this.query('#tritems'));

	res.delete_warning = await this.parseWarningPopup(await this.query('#delete_warning'));

	return res;
};


TransactionsView.prototype.filterByType = async function(type)
{
	if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
		return;

	return this.navigation(() => this.content.typeMenu.items[type].click());
};


// Click on add button and return navigation promise
TransactionsView.prototype.goToCreateTransaction = function()
{
	return this.navigation(() => this.content.addBtn.click());
};


// Select specified account, click on edit button and return navigation promise
TransactionsView.prototype.goToUpdateTransaction = async function(num)
{
	if (!this.content.transList || this.content.transList.items.length <= num || num < 0)
		throw new Error('Wrong transaction number specified');

	await this.content.transList.items[num].click();

	if (!this.content.toolbar.elem || !await this.isVisible(this.content.toolbar.elem) ||
		!this.content.toolbar.editBtn || !await this.isVisible(this.content.toolbar.editBtn.elem))
		throw 'Update transaction button not visible';

	return this.navigation(() => this.content.toolbar.editBtn.click());
};


// Delete secified transactions and return navigation promise
TransactionsView.prototype.deleteTransactions = function(tr)
{
	if (!tr)
		throw new Error('No transactions specified');

	if (!isArray(tr))
		tr = [tr];

	let selectPromise = tr.reduce((prev, tr_num, ind) =>
	{
		return prev
				.then(() => this.performAction(() =>
				{
					if (tr_num < 0 || tr_num >= this.content.transList.items.length)
						throw 'Wrong account number';

					return this.content.transList.items[tr_num].click();
				}))
				.then(async () =>
				{
					var editIsVisible = await this.isVisible(this.content.toolbar.editBtn.elem);
					if (ind == 0 && !editIsVisible)
						throw 'Edit button is not visible';
					else if (ind > 0 && editIsVisible)
						throw 'Edit button is visible while more than one transactions is selected';

					if (!await this.isVisible(this.content.toolbar.delBtn.elem))
						throw 'Delete button is not visible';
				});
	}, Promise.resolve());

	return selectPromise
			.then(() => this.performAction(() => this.content.toolbar.delBtn.click()))
			.then(async () =>
			{
				if (!await this.isVisible(this.content.delete_warning.elem))
					throw 'Delete transaction warning popup not appear';

				if (!this.content.delete_warning.okBtn)
					throw 'OK button not found';

				return this.navigation(() => this.click(this.content.delete_warning.okBtn));
			});
};


if (typeof module !== 'undefined' && module.exports)
	module.exports = TransactionsView;
