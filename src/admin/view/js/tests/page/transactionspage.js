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


TransactionsPage.prototype.parseContent = function()
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
	if (!res.titleEl || !res.addBtn || !res.toolbar.elem || !res.toolbar.editBtn || !res.toolbar.delBtn)
		throw new Error('Wrong transactions page structure');

	res.typeMenu = this.parseTransactionTypeMenu(vge('trtype_menu'));

	res.title = res.titleEl.innerText;
	res.transactions = this.parseTransactionsList(vge('tritems'));

	res.delete_warning = this.parseWarningPopup(vge('delete_warning'));

	return res;
};


TransactionsPage.prototype.filterByType = function(type)
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
		throw 'No transactions specified';

	if (!isArray(tr))
		tr = [tr];

	tr.forEach(function(tr_num, ind)
	{
		if (tr_num >= this.content.transactions.length)
			throw 'Wrong account number';

		this.content.transactions[tr_num].click();
		this.parse();

		var editIsVisible = isVisible(this.content.toolbar.editBtn.elem);
		if (ind == 0 && !editIsVisible)
			throw 'Edit button is not visible';
		else if (ind > 0 && editIsVisible)
			throw 'Edit button is visible while more than one transactions is selected';

		if (!isVisible(this.content.toolbar.delBtn.elem))
			throw 'Delete button is not visible';
	}, this);

	this.content.toolbar.delBtn.click();
	this.parse();

	if (!isVisible(this.content.delete_warning.elem))
		throw 'Delete transaction warning popup not appear';

	if (!this.content.delete_warning.okBtn)
		throw 'OK button not found';

	return navigation(() => clickEmul(this.content.delete_warning.okBtn), TransactionsPage);
};
