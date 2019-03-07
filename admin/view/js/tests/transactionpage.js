// Create or update transaction page tests
function TransactionPage()
{
	TransactionPage.parent.constructor.apply(this, arguments);

	this.availableControls = ['source',
					'destination',
					'src_amount_left',
					'dest_amount_left',
					'src_res_balance_left',
					'dest_res_balance_left',
					'exch_left',
					'src_amount_row',
					'dest_amount_row',
					'exchange_row',
					'result_balance_row',
					'result_balance_dest_row'];
}


extend(TransactionPage, TestPage);


TransactionPage.prototype.parseTileRightItem = function(elem)
{
	if (!elem || !elem.firstElementChild || !elem.firstElementChild.nextElementSibling || !elem.firstElementChild.nextElementSibling.firstElementChild)
		return null;

	var res = { elem : elem };
	res.titleElem = elem.firstElementChild;
	res.title = res.titleElem.innerHTML;
	res.buttonElem = res.titleElem.nextElementSibling.firstElementChild;
	res.value = res.buttonElem.firstElementChild.innerHTML;

	return res;
};


TransactionPage.prototype.parseTileBlock = function(elem)
{
	if (!elem || !elem.firstElementChild || !elem.firstElementChild.firstElementChild || !elem.firstElementChild.nextElementSibling)
		return null;

	var res = { elem : elem };

	res.label = elem.firstElementChild.firstElementChild.innerHTML;
	res.tile = this.parseTile(elem.querySelector('.tile'));

	return res;
}


TransactionPage.prototype.parseContent = function()
{
	var res = {};

	var menuItems = vqueryall('#trtype_menu > span');
	res.typeMenu = [];
	for(var i = 0; i < menuItems.length; i++)
	{
		var menuItem = menuItems[i].firstElementChild;

		res.type = this.getTransactionType(menuItem.innerHTML);

		var menuItemObj = { text : menuItem.innerHTML, type : this.getTransactionType(menuItem.innerHTML) };

		if (menuItem.tagName == 'B')
		{
			res.activeType = menuItemObj.type;
			menuItemObj.isActive = true;
		}
		else if (menuItem.tagName == 'A')
		{
			menuItemObj.link = menuItem.href;
			menuItemObj.isActive = false;
		}
		res.typeMenu.push(menuItemObj);
	}

	res.source = this.parseTileBlock(vge('source'));
	res.destination = this.parseTileBlock(vge('destination'));

	res.src_amount_left = this.parseTileRightItem(vge('src_amount_left'));
	res.dest_amount_left = this.parseTileRightItem(vge('dest_amount_left'));
	res.src_res_balance_left = this.parseTileRightItem(vge('src_res_balance_left'));
	res.dest_res_balance_left = this.parseTileRightItem(vge('dest_res_balance_left'));
	res.exch_left = this.parseTileRightItem(vge('exch_left'));

	res.src_amount_row = this.parseInputRow(vge('src_amount_row'));
	res.dest_amount_row = this.parseInputRow(vge('dest_amount_row'));
	res.exchange_row = this.parseInputRow(vge('exchange'));
	res.result_balance_row = this.parseInputRow(vge('result_balance'));
	res.result_balance_dest_row = this.parseInputRow(vge('result_balance_dest'));

	return res;
}


TransactionPage.prototype.inputDestAmount = function(val)
{
	this.performAction(() => inputEmul(this.content.dest_amount_row.valueInput, val));
}


TransactionPage.prototype.clickSrcResultBalance = function()
{
	this.performAction(() => clickEmul(this.content.src_res_balance_left.buttonElem));
}


TransactionPage.prototype.clickDestAmount = function()
{
	this.performAction(() => clickEmul(this.content.dest_amount_left.buttonElem));
}


TransactionPage.prototype.inputResBalance = function(val)
{
	this.performAction(() => inputEmul(this.content.result_balance_row.valueInput, val))
}


TransactionPage.prototype.changeDestCurrency = function(val)
{
	this.performAction(() => this.content.dest_amount_row.currDropDown.selectByValue(val));
}
