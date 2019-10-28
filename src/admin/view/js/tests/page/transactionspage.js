// List of transactions page class
function TransactionsPage()
{
	TransactionsPage.parent.constructor.apply(this, arguments);
}


extend(TransactionsPage, TestPage);


TransactionsPage.prototype.getTransactionObject = function(trans_id)
{
	return idSearch(viewframe.contentWindow.transArr, trans_id);
};


TransactionsPage.prototype.parseContent = async function()
{
	var res = { titleEl : await vquery('.content_wrap > .heading > h1'),
 				addBtn : await this.parseIconLink(await vquery('#add_btn')),
				toolbar : {
					elem : await vquery('#toolbar'),
					editBtn : await this.parseIconLink(await vquery('#edit_btn')),
					exportBtn : await this.parseIconLink(await vquery('#export_btn')),
					delBtn : await this.parseIconLink(await vquery('#del_btn'))
				}
			};
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.delBtn)
		throw new Error('Wrong transactions page structure');

	res.typeMenu = await this.parseTransactionTypeMenu(await vquery('#trtype_menu'));

	res.title = res.titleEl.innerText;
	res.transactions = await this.parseTransactionsList(await vquery('#tritems'));

	res.delete_warning = await this.parseWarningPopup(await vquery('#delete_warning'));

	return res;
};


TransactionsPage.prototype.filterByType = async function(type)
{
	if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
		return;

	return navigation(() => this.content.typeMenu.items[type].click(), TransactionsPage);
};


// Click on add button and return navigation promise
TransactionsPage.prototype.goToCreateTransaction = function()
{
	return navigation(() => this.content.addBtn.click(), ExpenseTransactionPage);
};


// Select specified account, click on edit button and return navigation promise
TransactionsPage.prototype.goToUpdateTransaction = function(num)
{
	if (!this.content.transactions || this.content.transactions.length <= num)
		throw new Error('Wrong transaction number specified');

	this.content.transactions[num].click();

	if (!this.content.toolbar.elem || !isVisible(this.content.toolbar.elem) || !this.content.toolbar.editBtn || !isVisible(this.content.toolbar.editBtn.elem))
		throw 'Update transaction button not visible';

	var transObj = this.getTransactionObject(this.content.transactions[num].id);
	if (!transObj)
		throw new Error('Transaction object not found');

	var typeStr = this.getTransactionTypeStr(transObj.type);
	var pageClass = this.getTransactionPageClass(typeStr);
	if (!pageClass)
		throw new Error('Wrong transaction type');

	return navigation(() => this.content.toolbar.editBtn.click(), pageClass);
};


// Delete secified transactions and return navigation promise
TransactionsPage.prototype.deleteTransactions = function(tr)
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
					if (tr_num >= this.content.transactions.length)
						throw 'Wrong account number';

					this.content.transactions[tr_num].click();

					return Promise.resolve();
				}))
				.then(() =>
				{
					var editIsVisible = isVisible(this.content.toolbar.editBtn.elem);
					if (ind == 0 && !editIsVisible)
						throw 'Edit button is not visible';
					else if (ind > 0 && editIsVisible)
						throw 'Edit button is visible while more than one transactions is selected';

					if (!isVisible(this.content.toolbar.delBtn.elem))
						throw 'Delete button is not visible';

					return Promise.resolve();
				});
	}, Promise.resolve());

	return selectPromise
			.then(() => this.performAction(() => this.content.toolbar.delBtn.click()))
			.then(() =>
			{
				if (!isVisible(this.content.delete_warning.elem))
					throw 'Delete transaction warning popup not appear';

				if (!this.content.delete_warning.okBtn)
					throw 'OK button not found';

				return navigation(() => clickEmul(this.content.delete_warning.okBtn), TransactionsPage);
			});
};
