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

	var self = this;
	var res = { elem : elem };
	res.titleElem = elem.firstElementChild;
	res.title = res.titleElem.innerText;
	res.buttonElem = res.titleElem.nextElementSibling.firstElementChild;
	res.value = res.buttonElem.firstElementChild.innerText;
	res.click = function()
	{
		self.click(this.buttonElem);
	};

	return res;
};


TransactionPage.prototype.parseTileBlock = async function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	var lbl = await this.query(elem, 'div > label');
	if (!lbl)
		throw new Error('Tile block label not found');

	res.label = lbl.innerText;
	res.tile = await this.parseTile(await this.query(elem, '.tile'));
	res.dropDown = await this.parseDropDown(await this.query(elem, '.dd_attached'));

	res.selectAccount = function(val)
	{
		if (res.dropDown)
			return res.dropDown.selectByValue(val);
	};

	return res;
};


TransactionPage.prototype.parseCommentRow = async function(elem)
{
	if (!elem)
		return null;

	var res = { elem : elem };

	var iconLinkElem = await this.query(elem, '.iconlink');

	res.iconLink = await this.parseIconLink(iconLinkElem);
	res.inputRow = await this.parseInputRow(iconLinkElem.nextElementSibling);
	if (!res.inputRow)
		throw new Error('Input row of comment not found');
	res.value = res.inputRow.value;

	res.input = async function(val)
	{
		if (isVisible(this.iconLink))
			await this.iconLink.click()

		return this.inputRow.input(val);
	};

	return res;
};


TransactionPage.prototype.parseContent = async function()
{
	var res = {};

	res.isUpdate = viewframe.contentWindow.edit_mode;

	if (res.isUpdate)
	{
		let hiddenEl = await this.query('input[name="transid"]');
		if (!hiddenEl)
			throw new Error('Transaction id field not found');

		res.id = parseInt(hiddenEl.value);
		if (!res.id)
			throw new Error('Wrong transaction id');
	}

	res.heading = { elem : await this.query('.heading > h1') };
	if (res.heading.elem)
		res.heading.title = res.heading.elem.innerText;

	res.delBtn = await this.query('#del_btn');

	res.typeMenu = await this.parseTransactionTypeMenu(await this.query('#trtype_menu'));

	if (res.typeMenu.activeType == 4)	/* DEBT */
	{
		res.person = await this.parseTileBlock(await this.query('#person'));
		if (res.person)
			res.person.id = parseInt((await this.query('#person_id')).value);

		res.account = await this.parseTileBlock(await this.query('#source'));
		if (res.account)
		{
			res.account.id = parseInt((await this.query('#acc_id')).value);
			res.accTileContainer = { elem : await this.query('#source .tile_container') };
		}

		res.operation = await this.parseOperation(await this.query('#operation'));

		res.selaccount = { elem : await this.query('#selaccount') };
		res.noacc_btn = { elem : await this.query('#noacc_btn') };
	}
	else
	{
		res.source = await this.parseTileBlock(await this.query('#source'));
		if (res.source)
			res.source.id = parseInt((await this.query('#src_id')).value);
		res.destination = await this.parseTileBlock(await this.query('#destination'));
		if (res.destination)
			res.destination.id = parseInt((await this.query('#dest_id')).value);
	}

	res.src_amount_left = await this.parseTileRightItem(await this.query('#src_amount_left'));
	res.dest_amount_left = await this.parseTileRightItem(await this.query('#dest_amount_left'));
	res.src_res_balance_left = await this.parseTileRightItem(await this.query('#src_res_balance_left'));
	res.dest_res_balance_left = await this.parseTileRightItem(await this.query('#dest_res_balance_left'));
	res.exch_left = await this.parseTileRightItem(await this.query('#exch_left'));

	res.src_amount_row = await this.parseInputRow(await this.query('#src_amount_row'));
	res.dest_amount_row = await this.parseInputRow(await this.query('#dest_amount_row'));
	res.exchange_row = await this.parseInputRow(await this.query('#exchange'));
	res.result_balance_row = await this.parseInputRow(await this.query('#result_balance'));
	res.result_balance_dest_row = await this.parseInputRow(await this.query('#result_balance_dest'));

	res.datePicker = await this.parseDatePickerRow((await this.query('#calendar_btn')).parentNode);
	res.comment_row = await this.parseCommentRow((await this.query('#comm_btn')).parentNode);

	res.submitBtn = await this.query('#submitbtn');
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

	return this.navigation(() => this.content.typeMenu.items[type].click(), newPageClass);
};


TransactionPage.prototype.submit = function()
{
	var navPageClass = (this.content.isUpdate) ? TransactionsPage : MainPage;

	return this.navigation(() => this.click(this.content.submitBtn), navPageClass);
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
