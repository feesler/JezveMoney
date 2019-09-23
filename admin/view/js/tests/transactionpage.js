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
	if (!elem)
		return null;

	var res = { elem : elem };

	var lbl = elem.querySelector('div > label');
	if (!lbl)
		throw new Error('Tile block label not found');

	res.label = lbl.innerHTML;
	res.tile = this.parseTile(elem.querySelector('.tile'));
	res.dropDown = this.parseDropDown(elem.querySelector('.dd_attached'));

	res.selectAccount = function(val)
	{
		if (res.dropDown)
			res.dropDown.selectByValue(val);
	};

	return res;
};


TransactionPage.prototype.parseCommentRow = function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	var iconLinkElem = elem.querySelector('.iconlink');

	res.iconLink = this.parseIconLink(iconLinkElem);
	res.inputRow = this.parseInputRow(iconLinkElem.nextElementSibling);

	res.input = function(val)
	{
		if (isVisible(this.iconLink))
			this.iconLink.click()

		this.inputRow.input(val);
	};
};


TransactionPage.prototype.getPageClass = function(str)
{
	var strToClass = { 'EXPENSE' : ExpenseTransactionPage,
						'INCOME' : IncomeTransactionPage,
					 	'TRANSFER' : TransferTransactionPage,
					 	'DEBT' : DebtTransactionPage };

	if (!str)
		return null;

	var key = str.toUpperCase();
	return (strToClass[key] !== undefined) ? strToClass[key] : TransactionPage;
};


TransactionPage.prototype.parseContent = function()
{
	var res = {};

	res.heading = { elem : vquery('.heading > h1') };
	if (res.heading.elem)
		res.heading.title = res.heading.elem.innerHTML;

	res.delBtn = vge('del_btn');
	res.isUpdate = (res.delBtn != null);

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

		menuItemObj.pageClass = this.getPageClass(menuItemObj.text);

		menuItemObj.click = function()
		{
			if (!this.isActive)
				clickEmul(this.elem);
		};

		res.typeMenu[menuItemObj.type] = menuItemObj;
	}

	if (res.activeType == 4)	/* DEBT */
	{
		res.person = this.parseTileBlock(vge('person'));
		if (res.person)
			res.person.id = parseInt(vge('person_id').value);

		res.account = this.parseTileBlock(vge('source'));
		if (res.account)
		{
			res.account.id = parseInt(vge('acc_id').value);
			res.accTileContainer = { elem : vge('source').querySelector('.tile_container') };
		}

		res.operation = this.parseOperation(vge('operation'));

		res.selaccount = { elem : vge('selaccount') };
		res.noacc_btn = { elem : vge('noacc_btn') };
	}
	else
	{
		res.source = this.parseTileBlock(vge('source'));
		if (res.source)
			res.source.id = parseInt(vge('src_id').value);
		res.destination = this.parseTileBlock(vge('destination'));
		if (res.destination)
			res.destination.id = parseInt(vge('dest_id').value);
	}

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

	res.datePicker = this.parseDatePickerRow(vge('calendar_btn').parentNode);
	res.comment_row = this.parseCommentRow(vge('comm_btn').parentNode);

	res.submitBtn = vge('submitbtn');
	res.cancelBtn = res.submitBtn.nextElementSibling;

	return res;
};


// Return null if no account can't be found
TransactionPage.prototype.getAccount = function(acc_id)
{
	return idSearch(viewframe.contentWindow.accounts, acc_id);
};


// Return zero if no account can't be found
TransactionPage.prototype.getAccountByPos = function(pos)
{
	if (pos >= 0 && pos < viewframe.contentWindow.accounts.length)
		return viewframe.contentWindow.accounts[pos];
	else
		return null;
};


// Return current position of account in accounts array
// Return -1 in case account can't be found
TransactionPage.prototype.getAccountPos = function(acc_id)
{
	var data = viewframe.contentWindow.accounts;
	var pos = -1;

	if (!isArray(data) || !acc_id)
		return -1;

	data.some(function(acc, ind)
	{
		var cond = (acc_id == acc.id);
		if (cond)
			pos = ind;

		return cond;
	});

	return pos;
};


// Return another account id if possible
// Return zero if no account can't be found
TransactionPage.prototype.getNextAccount = function(acc_id)
{
	var data = viewframe.contentWindow.accounts;
	var pos;

	if (!isArray(data) || data.length < 2 || !acc_id)
		return -1;

	pos = this.getAccountPos(acc_id);
	if (pos == -1)
		return 0;

	pos = ((pos == data.length - 1) ? 0 : pos + 1);

	return data[pos].id;
};


// Return zero if no person can't be found
TransactionPage.prototype.getPerson = function(person_id)
{
	return idSearch(viewframe.contentWindow.persons, person_id);
};


// Return account of person in specified currency
TransactionPage.prototype.getPersonAccount = function(person_id, curr_id)
{
	var person, resAcc = null;

	person = this.getPerson(person_id);
	if (!person || !person.accounts || !curr_id)
		return resAcc;

	// check person have account in specified currency
	person.accounts.some(function(acc)
	{
		var cond = (acc.curr_id == curr_id);

		if (cond)
			resAcc = acc;

		return cond;
	});

	return resAcc;
};


TransactionPage.prototype.calcExchByAmounts = function(model)
{
	if (model.fSrcAmount == 0 || model.fDestAmount == 0)
		model.exchRate = 1;
	else
		model.exchRate = correctExch(model.fDestAmount / model.fSrcAmount);

	return model
};


TransactionPage.prototype.updateExch = function(model)
{
	model.fExchRate = isValidValue(model.exchRate) ? normalizeExch(model.exchRate) : model.exchRate;

	model.exchSign = model.destCurr.sign + '/' + model.srcCurr.sign;
	model.backExchSign = model.srcCurr.sign + '/' + model.destCurr.sign;

	var exchText = model.exchSign;

	if (isValidValue(model.exchRate) && model.fExchRate != 0 && model.fExchRate != 1)
	{
		model.invExchRate = parseFloat((1 / model.fExchRate).toFixed(5));

		exchText += ' ('  + model.invExchRate + ' ' + model.backExchSign + ')';
	}

	model.fmtExch = model.fExchRate + ' ' + exchText;

	return model;
};


TransactionPage.prototype.changeTransactionType = function(type)
{
	if (this.content.activeType == type || !this.content.typeMenu[type])
		return;

	return navigation(() => this.content.typeMenu[type].click(), this.content.typeMenu[type].pageClass);
};


TransactionPage.prototype.submit = function()
{
	return navigation(() => clickEmul(this.content.submitBtn), MainPage);
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
	this.changeDestAccount(this.content.destination.dropDown.items[pos].id);
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


TransactionPage.prototype.changeDate = function(val)
{
	this.performAction(() => this.content.datePicker.inputDate(val));
};


TransactionPage.prototype.inputComment = function(val)
{
	this.performAction(() => this.content.comment_row.input(val));
};
