// Create or update transaction page tests
function TransactionPage()
{
	TransactionPage.parent.constructor.apply(this, arguments);
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
	res.click = function()
	{
		clickEmul(res.buttonElem);
	}

	return res;
};


TransactionPage.prototype.parseTileBlock = function(elem)
{
	if (!elem || !elem.firstElementChild || !elem.firstElementChild.firstElementChild || !elem.firstElementChild.nextElementSibling)
		return null;

	var res = { elem : elem };

	res.label = elem.firstElementChild.firstElementChild.innerHTML;
	res.tile = this.parseTile(elem.querySelector('.tile'));
	res.dropDown = this.parseDropDown(elem.querySelector('.dd_attached'));

	res.selectAccount = function(val)
	{
		if (res.dropDown)
			res.dropDown.selectByValue(val);
	};

	return res;
};


TransactionPage.prototype.parseContent = function()
{
	var res = {};

	var menuItems = vqueryall('#trtype_menu > span');
	res.typeMenu = [];
	for(var i = 0; i < menuItems.length; i++)
	{
		var menuItem = menuItems[i].firstElementChild;

		var menuItemObj = { elem : menuItem, text : menuItem.innerHTML, type : this.getTransactionType(menuItem.innerHTML) };

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

		menuItemObj.click = function()
		{
			if (!this.isActive)
				clickEmul(this.elem);
		};

		res.typeMenu[menuItemObj.type] = menuItemObj;
	}

	res.source = this.parseTileBlock(vge('source'));
	if (res.source)
		res.source.id = parseInt(vge('src_id').value);
	res.destination = this.parseTileBlock(vge('destination'));
	if (res.destination)
		res.destination.id = parseInt(vge('dest_id').value);

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
};


TransactionPage.prototype.changeTransactionType = function(type)
{
	if (this.content.activeType == type || !this.content.typeMenu[type])
		return;

	return navigation(() => this.content.typeMenu[type].click(), TransactionPage);
};


TransactionPage.prototype.changeSrcAccount = function(val)
{
	this.performAction(() => this.content.source.selectAccount(val));
};


TransactionPage.prototype.changeSrcAccountByPos = function(pos)
{
	this.changeSrcAccount(this.content.source.dropDown.items[pos].id);
};


TransactionPage.prototype.changeDestAccount = function(val)
{
	this.performAction(() => this.content.destination.selectAccount(val));
};


TransactionPage.prototype.changeDestAccountByPos = function(pos)
{
	this.performAction(() => this.content.destination.selectAccount(this.content.destination.dropDown.items[pos].id));
};


TransactionPage.prototype.inputSrcAmount = function(val)
{
	this.performAction(() => this.content.src_amount_row.input(val));
};


TransactionPage.prototype.clickSrcAmount = function()
{
	this.performAction(() => this.content.src_amount_left.click());
};


TransactionPage.prototype.inputDestAmount = function(val)
{
	this.performAction(() => this.content.dest_amount_row.input(val));
};


TransactionPage.prototype.clickSrcResultBalance = function()
{
	this.performAction(() => this.content.src_res_balance_left.click());
};


TransactionPage.prototype.clickDestResultBalance = function()
{
	this.performAction(() => this.content.dest_res_balance_left.click());
};


TransactionPage.prototype.clickDestAmount = function()
{
	this.performAction(() => this.content.dest_amount_left.click());
};


TransactionPage.prototype.inputResBalance = function(val)
{
	this.performAction(() => this.content.result_balance_row.input(val))
};


TransactionPage.prototype.inputDestResBalance = function(val)
{
	this.performAction(() => this.content.result_balance_dest_row.input(val))
};


TransactionPage.prototype.changeSourceCurrency = function(val)
{
	this.performAction(() => this.content.src_amount_row.selectCurr(val));
};


TransactionPage.prototype.changeDestCurrency = function(val)
{
	this.performAction(() => this.content.dest_amount_row.selectCurr(val));
};


TransactionPage.prototype.clickExchRate = function()
{
	this.performAction(() => this.content.exch_left.click());
};


TransactionPage.prototype.inputExchRate = function(val)
{
	this.performAction(() => this.content.exchange_row.input(val));
};
