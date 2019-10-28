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
	res.title = res.titleElem.innerText;
	res.buttonElem = res.titleElem.nextElementSibling.firstElementChild;
	res.value = res.buttonElem.firstElementChild.innerText;
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

	var lbl = vquery(elem, 'div > label');
	if (!lbl)
		throw new Error('Tile block label not found');

	res.label = lbl.innerText;
	res.tile = this.parseTile(vquery(elem, '.tile'));
	res.dropDown = this.parseDropDown(vquery(elem, '.dd_attached'));

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

	var iconLinkElem = vquery(elem, '.iconlink');

	res.iconLink = this.parseIconLink(iconLinkElem);
	res.inputRow = this.parseInputRow(iconLinkElem.nextElementSibling);
	if (!res.inputRow)
		throw new Error('Input row of comment not found');
	res.value = res.inputRow.value;

	res.input = function(val)
	{
		if (isVisible(this.iconLink))
			this.iconLink.click()

		this.inputRow.input(val);
	};

	return res;
};


TransactionPage.prototype.parseContent = function()
{
	var res = {};

	res.isUpdate = viewframe.contentWindow.edit_mode;

	if (res.isUpdate)
	{
		let hiddenEl = vquery('input[name="transid"]');
		if (!hiddenEl)
			throw new Error('Transaction id field not found');

		res.id = parseInt(hiddenEl.value);
		if (!res.id)
			throw new Error('Wrong transaction id');
	}

	res.heading = { elem : vquery('.heading > h1') };
	if (res.heading.elem)
		res.heading.title = res.heading.elem.innerText;

	res.delBtn = vquery('#del_btn');

	res.typeMenu = this.parseTransactionTypeMenu(vquery('#trtype_menu'));

	if (res.typeMenu.activeType == 4)	/* DEBT */
	{
		res.person = this.parseTileBlock(vquery('#person'));
		if (res.person)
			res.person.id = parseInt(vquery('#person_id').value);

		res.account = this.parseTileBlock(vquery('#source'));
		if (res.account)
		{
			res.account.id = parseInt(vquery('#acc_id').value);
			res.accTileContainer = { elem : vquery('#source .tile_container') };
		}

		res.operation = this.parseOperation(vquery('#operation'));

		res.selaccount = { elem : vquery('#selaccount') };
		res.noacc_btn = { elem : vquery('#noacc_btn') };
	}
	else
	{
		res.source = this.parseTileBlock(vquery('#source'));
		if (res.source)
			res.source.id = parseInt(vquery('#src_id').value);
		res.destination = this.parseTileBlock(vquery('#destination'));
		if (res.destination)
			res.destination.id = parseInt(vquery('#dest_id').value);
	}

	res.src_amount_left = this.parseTileRightItem(vquery('#src_amount_left'));
	res.dest_amount_left = this.parseTileRightItem(vquery('#dest_amount_left'));
	res.src_res_balance_left = this.parseTileRightItem(vquery('#src_res_balance_left'));
	res.dest_res_balance_left = this.parseTileRightItem(vquery('#dest_res_balance_left'));
	res.exch_left = this.parseTileRightItem(vquery('#exch_left'));

	res.src_amount_row = this.parseInputRow(vquery('#src_amount_row'));
	res.dest_amount_row = this.parseInputRow(vquery('#dest_amount_row'));
	res.exchange_row = this.parseInputRow(vquery('#exchange'));
	res.result_balance_row = this.parseInputRow(vquery('#result_balance'));
	res.result_balance_dest_row = this.parseInputRow(vquery('#result_balance_dest'));

	res.datePicker = this.parseDatePickerRow(vquery('#calendar_btn').parentNode);
	res.comment_row = this.parseCommentRow(vquery('#comm_btn').parentNode);

	res.submitBtn = vquery('#submitbtn');
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
	return getPosById(viewframe.contentWindow.accounts, acc_id);
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


// Return zero if no person found
TransactionPage.prototype.getPersonByPos = function(pos)
{
	if (pos >= 0 && pos < viewframe.contentWindow.persons.length)
		return viewframe.contentWindow.persons[pos];
	else
		return null;
};


// Return zero if no person found
TransactionPage.prototype.getPersonPos = function(person_id)
{
	return getPosById(viewframe.contentWindow.persons, person_id);
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


// Return null if no account can't be found
TransactionPage.prototype.getUpdateTransactionObj = function()
{
	return viewframe.contentWindow.edit_transaction;
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
	if (this.content.typeMenu.activeType == type || !this.content.typeMenu.items[type])
		return;

	var newPageClass = this.getTransactionPageClass(this.content.typeMenu.items[type].text);

	return navigation(() => this.content.typeMenu.items[type].click(), newPageClass);
};


TransactionPage.prototype.submit = function()
{
	var navPageClass = (this.content.isUpdate) ? TransactionsPage : MainPage;

	return navigation(() => clickEmul(this.content.submitBtn), navPageClass);
};


TransactionPage.prototype.changeSrcAccount = function(val)
{
	return this.performAction(() => this.content.source.selectAccount(val));
};


TransactionPage.prototype.changeSrcAccountByPos = function(pos)
{
	return this.changeSrcAccount(this.content.source.dropDown.items[pos].id);
};


TransactionPage.prototype.changeDestAccount = function(val)
{
	return this.performAction(() => this.content.destination.selectAccount(val));
};


TransactionPage.prototype.changeDestAccountByPos = function(pos)
{
	return this.changeDestAccount(this.content.destination.dropDown.items[pos].id);
};


TransactionPage.prototype.inputSrcAmount = function(val)
{
	return this.performAction(() => this.content.src_amount_row.input(val));
};


TransactionPage.prototype.clickSrcAmount = function()
{
	return this.performAction(() => this.content.src_amount_left.click());
};


TransactionPage.prototype.inputDestAmount = function(val)
{
	return this.performAction(() => this.content.dest_amount_row.input(val));
};


TransactionPage.prototype.clickSrcResultBalance = function()
{
	return this.performAction(() => this.content.src_res_balance_left.click());
};


TransactionPage.prototype.clickDestResultBalance = function()
{
	return this.performAction(() => this.content.dest_res_balance_left.click());
};


TransactionPage.prototype.clickDestAmount = function()
{
	return this.performAction(() => this.content.dest_amount_left.click());
};


TransactionPage.prototype.inputResBalance = function(val)
{
	return this.performAction(() => this.content.result_balance_row.input(val))
};


TransactionPage.prototype.inputDestResBalance = function(val)
{
	return this.performAction(() => this.content.result_balance_dest_row.input(val))
};


TransactionPage.prototype.changeSourceCurrency = function(val)
{
	return this.performAction(() => this.content.src_amount_row.selectCurr(val));
};


TransactionPage.prototype.changeDestCurrency = function(val)
{
	return this.performAction(() => this.content.dest_amount_row.selectCurr(val));
};


TransactionPage.prototype.clickExchRate = function()
{
	return this.performAction(() => this.content.exch_left.click());
};


TransactionPage.prototype.inputExchRate = function(val)
{
	return this.performAction(() => this.content.exchange_row.input(val));
};


TransactionPage.prototype.changeDate = function(val)
{
	return this.performAction(() => this.content.datePicker.inputDate(val));
};


TransactionPage.prototype.inputComment = function(val)
{
	return this.performAction(() => this.content.comment_row.input(val));
};
