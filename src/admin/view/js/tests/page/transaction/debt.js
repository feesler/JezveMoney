// Create or update transfer transaction page tests
function DebtTransactionPage()
{
	DebtTransactionPage.parent.constructor.apply(this, arguments);

	this.expectedState = {};
}


extend(DebtTransactionPage, TransactionPage);


DebtTransactionPage.prototype.parseOperation = function(el)
{
	var res = { elem : el };

	if (!res.elem)
		return null;

	res.debtgive = vquery('#debtgive');
	res.debttake = vquery('#debttake');

	res.type = res.debtgive.checked;

	return res;
};


DebtTransactionPage.prototype.buildModel = function(cont)
{
	var res = {};

	res.isUpdate = cont.isUpdate;
	if (res.isUpdate)
		res.id = cont.id;

	if (cont.typeMenu.activeType != 4)
		throw new Error('Wrong page');

	res.person = this.getPerson(cont.person.id);
	res.debtType = cont.operation.type;

	res.src_curr_id = parseInt(cont.src_amount_row.hiddenValue);
	res.dest_curr_id = parseInt(cont.dest_amount_row.hiddenValue);
	if (res.src_curr_id != res.dest_curr_id)
		throw new Error('Source and destination currencies are not the same');

	res.srcCurr = getCurrency(res.src_curr_id);
	if (!res.srcCurr)
		throw new Error('Source currency not found');
	res.destCurr = getCurrency(res.dest_curr_id);
	if (!res.destCurr)
		throw new Error('Destination currency not found');

	var personAccountCurr = (res.debtType) ? res.src_curr_id : res.dest_curr_id;
	res.personAccount = this.getPersonAccount(res.person.id, personAccountCurr);
	if (!res.personAccount)
		res.personAccount = { balance : 0, curr_id : personAccountCurr };

	var isSelectAccountVisible = !!(cont.selaccount && isVisible(cont.selaccount.elem));

	res.noAccount = isSelectAccountVisible;

	res.account = this.getAccount(cont.account.id);
	if (!res.account && !res.noAccount)
		throw new Error('Account not found');

	if (res.account && res.account.curr_id != res.src_curr_id)
		throw new Error('Wrong currency of account');

	if (this.model && this.model.lastAccount_id)
		res.lastAccount_id = this.model.lastAccount_id;

	if (res.debtType)
	{
		res.srcAccount = res.personAccount;
		res.destAccount = res.account;
	}
	else
	{
		res.srcAccount = res.account;
		res.destAccount = res.personAccount;
	}

	if (res.srcAccount)
		res.srcAccount.fmtBalance = res.srcCurr.formatValue(res.srcAccount.balance);
	if (res.destAccount)
		res.destAccount.fmtBalance = res.destCurr.formatValue(res.destAccount.balance);

	res.srcAmount = cont.src_amount_row.value;
	res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

	res.destAmount = cont.dest_amount_row.value;
	res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

	if (res.fSrcAmount != res.fDestAmount)
		throw new Error('Source and destination amount are different');

	res.srcResBal = cont.result_balance_row.value;
	res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
	res.fmtSrcResBal = res.srcCurr.formatValue(res.fSrcResBal);

	res.destResBal = cont.result_balance_dest_row.value;
	res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
	res.fmtDestResBal = res.destCurr.formatValue(res.fDestResBal);

	res.exchRate = cont.exchange_row.value;
	this.updateExch(res);

	var isSrcAmountRowVisible = !!(cont.src_amount_row && isVisible(cont.src_amount_row.elem));
	var isSrcResBalRowVisible = !!(cont.result_balance_row && isVisible(cont.result_balance_row.elem));
	var isDestResBalRowVisible = !!(cont.result_balance_dest_row && isVisible(cont.result_balance_dest_row.elem));
	var isExchRowVisible = !!(cont.exchange_row && isVisible(cont.exchange_row.elem));

	res.isDiffCurr = false;

	if (res.noAccount)
	{
		if (isSrcAmountRowVisible)
			res.state = res.debtType ? 6 : 7;
		else if (isSrcResBalRowVisible && res.debtType)
			res.state = 9;
		else if (isDestResBalRowVisible && !res.debtType)
			res.state = 8;
		else
			throw new Error('Unexpected state');
	}
	else
	{
		if (isSrcAmountRowVisible)
			res.state = res.debtType ? 0 : 3;
		else if (isSrcResBalRowVisible)
			res.state = res.debtType ? 1 : 5;
		else if (isDestResBalRowVisible)
			res.state =  res.debtType ? 2 : 4;
		else
			throw new Error('Unexpected state');
	}

	res.date = cont.datePicker.date;
	res.comment = cont.comment_row.value;

	return res;
};


// Set source amount value
// State 0, 1 or 2: source and destination currencies are the same
DebtTransactionPage.prototype.setSrcAmount = function(model, val)
{
	model.srcAmount = val;

	var newValue = isValidValue(val) ? normalize(val) : val;
	if (model.fSrcAmount != newValue || model.srcResBal == '')
	{
		model.fSrcAmount = newValue;

		if (model.srcAccount && !model.noAccount)
		{
			model.srcResBal = normalize(model.srcAccount.balance - model.fSrcAmount);
		}
		else if (model.noAccount)
		{
			if (model.debtType)
			{
				model.srcResBal = normalize(model.personAccount.balance - model.fSrcAmount);
			}
			else
			{
				let accBalance = 0;

				if (model.lastAccount_id)
				{
					var lastAcc = this.getAccount(model.lastAccount_id);
					if (!lastAcc)
						throw new Error('Last account not found');

					accBalance = lastAcc.balance;
				}

				model.srcResBal = normalize(accBalance - model.fSrcAmount);
			}
		}

		model.fmtSrcResBal = model.srcCurr.formatValue(model.srcResBal);
	}

	return model;
};


// Set destination amount value
// State 0, 1 or 2: source and destination currencies are the same
DebtTransactionPage.prototype.setDestAmount = function(model, val)
{
	model.destAmount = val;

	var newValue = isValidValue(model.destAmount) ? normalize(model.destAmount) : model.destAmount;
	if (model.fDestAmount != newValue || model.destResBal == '')
	{
		model.fDestAmount = newValue;

		if (model.destAccount && !model.noAccount)
		{
			model.destResBal = normalize(model.destAccount.balance + model.fDestAmount);
		}
		else
		{
			if (model.debtType)
			{
				let accBalance = 0;

				if (model.lastAccount_id)
				{
					var lastAcc = this.getAccount(model.lastAccount_id);
					if (!lastAcc)
						throw new Error('Last account not found');

					accBalance = lastAcc.balance;
				}

				model.destResBal = normalize(accBalance + model.fDestAmount);
			}
			else
			{
				model.destResBal = normalize(model.personAccount.balance + model.fDestAmount);
			}
		}

		model.fmtDestResBal = model.destCurr.formatValue(model.destResBal);
	}

	return model;
};


DebtTransactionPage.prototype.setExpectedState = function(state_id)
{
	var res = {};

	var newState = parseInt(state_id);

	if (isNaN(newState) || newState < 0 || newState > 9)
		throw new Error('Wrong state specified');

	var res = { model : { state : newState },
				visibility : { person : true, account : { tile : !this.model.noAccount },
								selaccount : this.model.noAccount, noacc_btn : !this.model.noAccount,
								dest_amount_row : false, dest_amount_left : false,
								exchange_row : false, exch_left : false },
				values : { typeMenu : { activeType : 4 }, /* DEBT */
							src_amount_row : { value : this.model.srcAmount.toString(), label : 'Amount', currSign : this.model.srcCurr.sign, isCurrActive : false },
							src_amount_left : this.model.srcCurr.formatValue(this.model.fSrcAmount),
							dest_amount_row : { value : this.model.destAmount.toString(), currSign : this.model.destCurr.sign, isCurrActive : false },
							result_balance_row : { value : this.model.srcResBal.toString(), isCurrActive : false },
							result_balance_dest_row : { value : this.model.destResBal.toString(), isCurrActive : false },
							exchange_row : { value : this.model.exchRate.toString(), currSign : this.model.exchSign },
							exch_left : this.model.fmtExch } };

	if (this.model.debtType)
	{
		setParam(res.values, { person : { tile : { name : this.model.person.name, balance : this.model.srcAccount.fmtBalance } },
								src_res_balance_left : this.model.fmtSrcResBal,
								result_balance_row : { label : 'Result balance (Person)' },
								result_balance_dest_row : { label : 'Result balance (Account)' } });

		// Check initial state
		if (this.model.noAccount && !this.model.lastAccount_id && this.model.destResBal == '')
			res.values.dest_res_balance_left = '';
		else
			res.values.dest_res_balance_left = this.model.fmtDestResBal;


		if (!this.model.noAccount)
			setParam(res.values.account, { tile : { name : this.model.destAccount.name, balance : this.model.destAccount.fmtBalance } });
	}
	else
	{
		setParam(res.values, { person : { tile : { name : this.model.person.name, balance : this.model.destAccount.fmtBalance } },
								dest_res_balance_left : this.model.fmtDestResBal,
								result_balance_row : { label : 'Result balance (Account)' },
								result_balance_dest_row : { label : 'Result balance (Person)' } });

		// Check initial state
		if (this.model.noAccount && !this.model.lastAccount_id && this.model.srcResBal == '')
			res.values.src_res_balance_left = '';
		else
			res.values.src_res_balance_left = this.model.fmtSrcResBal;


		if (!this.model.noAccount)
			setParam(res.values.account, { tile : { name : this.model.srcAccount.name, balance : this.model.srcAccount.fmtBalance } });
	}


	if (newState === 0)
	{
		setParam(res.visibility, { src_amount_row : true, src_amount_left : false,
									result_balance_row : false, src_res_balance_left : true,
									result_balance_dest_row : false, dest_res_balance_left : true });
	}
	else if (newState === 1)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : true, src_res_balance_left : false,
									result_balance_dest_row : false, dest_res_balance_left : true });
	}
	else if (newState === 2)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : false, src_res_balance_left : true,
									result_balance_dest_row : true, dest_res_balance_left : false });
	}
	else if (newState === 3)
	{
		setParam(res.visibility, { src_amount_row : true, src_amount_left : false,
									result_balance_row : false, src_res_balance_left : true,
									result_balance_dest_row : false, dest_res_balance_left : true });
	}
	else if (newState === 4)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : false, src_res_balance_left : true,
									result_balance_dest_row : true, dest_res_balance_left : false });
	}
	else if (newState === 5)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : true, src_res_balance_left : false,
									result_balance_dest_row : false, dest_res_balance_left : true });
	}
	else if (newState === 6)
	{
		setParam(res.visibility, { src_amount_row : true, src_amount_left : false,
									result_balance_row : false, src_res_balance_left : true,
									result_balance_dest_row : false, dest_res_balance_left : false });
	}
	else if (newState === 7)
	{
		setParam(res.visibility, { src_amount_row : true, src_amount_left : false,
									result_balance_row : false, src_res_balance_left : false,
									result_balance_dest_row : false, dest_res_balance_left : true });
	}
	else if (newState === 8)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : false, src_res_balance_left : false,
									result_balance_dest_row : true, dest_res_balance_left : false });
	}
	else if (newState === 9)
	{
		setParam(res.visibility, { src_amount_row : false, src_amount_left : true,
									result_balance_row : true, src_res_balance_left : false,
									result_balance_dest_row : false, dest_res_balance_left : false });
	}

	this.expectedState = res;

	return res;
};


DebtTransactionPage.prototype.changePerson = function(val)
{
	this.model.person = this.getPerson(val);

	var personAccCurr_id = (this.model.debtType) ? this.model.srcCurr.id : this.model.destCurr.id;
	this.model.personAccount = this.getPersonAccount(val, personAccCurr_id);
	if (!this.model.personAccount)
		this.model.personAccount = { balance : 0, curr_id : personAccCurr_id };

	if (this.model.debtType)
	{
		this.model.srcAccount = this.model.personAccount;
		this.model.srcAccount.fmtBalance = this.model.srcCurr.formatValue(this.model.srcAccount.balance);

		this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
		this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.srcResBal);
	}
	else
	{
		this.model.destAccount = this.model.personAccount;
		this.model.destAccount.fmtBalance = this.model.destCurr.formatValue(this.model.destAccount.balance);

		this.model.destResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
		this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.destResBal);
	}

	this.setExpectedState(this.model.state);

	return this.performAction(() => this.content.person.selectAccount(val));
};


DebtTransactionPage.prototype.changePersonByPos = function(pos)
{
	return this.changePerson(this.content.person.dropDown.items[pos].id);
};


DebtTransactionPage.prototype.toggleDebtType = function()
{
	var newValue = !this.model.debtType;

	if (newValue)
	{
		this.model.srcAccount = this.model.personAccount;
		this.model.destAccount = this.model.account;
	}
	else
	{
		this.model.srcAccount = this.model.account;
		this.model.destAccount = this.model.personAccount;
	}

	if (this.model.srcAccount)
	{
		this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
	}
	else if (this.model.noAccount && !newValue)
	{
		var lastAcc = this.getAccount(this.model.lastAccount_id);
		if (!lastAcc)
			throw new Error('Last account not found');

		this.model.srcResBal = normalize(lastAcc.balance - this.model.fSrcAmount);
	}
	this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.srcResBal);

	if (this.model.destAccount)
	{
		this.model.destResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
	}
	else if (this.model.noAccount && newValue)
	{
		var lastAcc = this.getAccount(this.model.lastAccount_id);
		if (!lastAcc)
			throw new Error('Last account not found');

		this.model.destResBal = normalize(lastAcc.balance + this.model.fDestAmount);
	}
	this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.destResBal);

	if (this.model.debtType)
	{
		this.model.debtType = newValue;

		if (this.model.state === 0)				// Transition 7
			this.setExpectedState(3);
		else if (this.model.state === 1)		// Transition 16
			this.setExpectedState(4);
		else if (this.model.state === 2)		// Transition 18
			this.setExpectedState(5);
		else if (this.model.state === 6)		// Transition 27
			this.setExpectedState(7);
		else if (this.model.state === 9)		// Transition 34
			this.setExpectedState(8);
		else
			throw new Error('Unexpected state');
	}
	else
	{
		this.model.debtType = newValue;

		if (this.model.state === 3)				// Transition 8
			this.setExpectedState(0);
		else if (this.model.state === 4)		// Transition 16
			this.setExpectedState(1);
		else if (this.model.state === 5)		// Transition 17
			this.setExpectedState(2);
		else if (this.model.state === 7)		// Transition 28
			this.setExpectedState(6);
		else if (this.model.state === 8)		// Transition 33
			this.setExpectedState(9);
		else
			throw new Error('Unexpected state');
	}


	return this.performAction(() => clickEmul(this.model.debtType ? this.content.operation.debtgive : this.content.operation.debttake));
};


DebtTransactionPage.prototype.inputSrcAmount = function(val)
{
	var fNewValue = (isValidValue(val)) ? normalize(val) : val;
	var valueChanged = (this.model.fSrcAmount != fNewValue);

	this.setSrcAmount(this.model, val);

	if (valueChanged)
	{
		this.setDestAmount(this.model, this.model.fSrcAmount);
	}

	this.setExpectedState(this.model.state);

	return DebtTransactionPage.parent.inputSrcAmount.apply(this, arguments);
};


DebtTransactionPage.prototype.inputResBalance = function(val)
{
	var fNewValue = isValidValue(val) ? normalize(val) : val;

	this.model.srcResBal = val;

	if (this.model.fSrcResBal !== fNewValue)
	{
		this.model.fSrcResBal = fNewValue;
		this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.srcResBal);

		var newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);

		this.model.srcAmount = newSrcAmount;
		this.model.fSrcAmount = isValidValue(newSrcAmount) ? normalize(newSrcAmount) : newSrcAmount;

		this.setDestAmount(this.model, this.model.srcAmount);
	}

	this.setExpectedState(this.model.state);

	return DebtTransactionPage.parent.inputResBalance.apply(this, arguments);
};


DebtTransactionPage.prototype.inputDestResBalance = function(val)
{
	var fNewValue = isValidValue(val) ? normalize(val) : val;

	this.model.destResBal = val;

	if (this.model.fDestResBal !== fNewValue)
	{
		this.model.fDestResBal = fNewValue;
		this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.destResBal);

		var newDestAmount = normalize(fNewValue - this.model.destAccount.balance);

		this.model.destAmount = newDestAmount;
		this.model.fDestAmount = isValidValue(newDestAmount) ? normalize(newDestAmount) : newDestAmount;

		this.setSrcAmount(this.model, this.model.destAmount);
	}

	this.setExpectedState(this.model.state);

	return DebtTransactionPage.parent.inputDestResBalance.apply(this, arguments);
};


DebtTransactionPage.prototype.clickSrcResultBalance = function()
{
	if (this.model.state === 0 || this.model.state === 2)			// Transition 1 or 4
		this.setExpectedState(1);
	else if (this.model.state === 3 || this.model.state === 4)		// Transition 13 or 11
		this.setExpectedState(5);
	else if (this.model.state === 6)
		this.setExpectedState(9);					// Transition 36
	else
		throw new Error('Unexpected state');

	return DebtTransactionPage.parent.clickSrcResultBalance.apply(this, arguments);
};


DebtTransactionPage.prototype.clickDestResultBalance = function()
{
	if (this.model.state === 0 || this.model.state === 1)				// Transition 3 or 5
		this.setExpectedState(2);
	else if (this.model.state === 3 || this.model.state === 5)			// Transition 9
		this.setExpectedState(4);
	else if (this.model.state === 7)
		this.setExpectedState(8);					// Transition 32 or 46
	else
		throw new Error('Unexpected state');

	return DebtTransactionPage.parent.clickDestResultBalance.apply(this, arguments);
};


DebtTransactionPage.prototype.toggleAccount = function()
{
	this.model.noAccount = !this.model.noAccount;

	if (this.model.noAccount)
	{
		if (this.model.state === 0 || this.model.state === 2)
			this.setExpectedState(6);					// Transition 25 or 41
		else if (this.model.state === 1)
			this.setExpectedState(9);					// Transition 38
		else if (this.model.state === 3 || this.model.state === 5)
			this.setExpectedState(7);					// Transition 40 or 50
		else if (this.model.state === 4)
			this.setExpectedState(8);					// Transition 39
		else
			throw new Error('Unexpected state');

		this.model.lastAccount_id = this.model.account.id;
	}
	else
	{
		if (this.model.lastAccount_id)
			this.model.account = this.getAccount(this.model.lastAccount_id);
		if (!this.model.account)
			throw new Error('Account not found');

		if (this.model.debtType)
		{
			this.model.destAccount = this.model.account;

			this.model.destResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
			this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.destResBal);
		}
		else
		{
			this.model.srcAccount = this.model.account;

			this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
			this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.srcResBal);
		}

		if (this.model.srcAccount)
			this.model.srcAccount.fmtBalance = this.model.srcCurr.formatValue(this.model.srcAccount.balance);
		if (this.model.destAccount)
			this.model.destAccount.fmtBalance = this.model.destCurr.formatValue(this.model.destAccount.balance);

		if (this.model.state === 6)
			this.setExpectedState(0);			// Transition 26
		else if (this.model.state === 7)
			this.setExpectedState(3);			// Transition 29
		else if (this.model.state === 8)
			this.setExpectedState(4);			// Transition 32
		else if (this.model.state === 9)
			this.setExpectedState(1);			// Transition 37
		else
			throw new Error('Unexpected state');
	}

	if (this.model.noAccount)
		return this.performAction(() => clickEmul(this.content.noacc_btn.elem.firstElementChild));
	else
		return this.performAction(() => clickEmul(this.content.selaccount.elem.firstElementChild));
};


DebtTransactionPage.prototype.changeAccount = function(account_id)
{
	var newAcc = this.getAccount(account_id);

	if (!this.model.account || !newAcc || newAcc.id == this.model.account.id)
		return Promise.resolve();

	this.model.account = newAcc;

	if (this.model.personAccount.curr_id != this.model.account.curr_id)
	{
		var person_id = this.model.person.id;
		this.model.personAccount = this.getPersonAccount(this.model.person.id, this.model.account.curr_id);
		if (!this.model.personAccount)
			this.model.personAccount = { balance : 0, curr_id : this.model.account.curr_id };
	}

	this.model.src_curr_id = this.model.dest_curr_id = this.model.account.curr_id;
	this.model.srcCurr = getCurrency(this.model.src_curr_id);
	this.model.destCurr = getCurrency(this.model.dest_curr_id);

	if (this.model.debtType)
	{
		this.model.srcAccount = this.model.personAccount;
		this.model.destAccount = this.model.account;
	}
	else
	{
		this.model.srcAccount = this.model.account;
		this.model.destAccount = this.model.personAccount;
	}

	this.model.srcAccount.fmtBalance = this.model.srcCurr.formatValue(this.model.srcAccount.balance);
	var newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
	if (this.model.fSrcResBal != newSrcResBal)
	{
		this.model.srcResBal = this.model.fSrcResBal = newSrcResBal;
	}
	this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.srcResBal);

	this.model.destAccount.fmtBalance = this.model.destCurr.formatValue(this.model.destAccount.balance);
	var newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
	if (this.model.fDestResBal != newDestResBal)
	{
		this.model.destResBal = this.model.fDestResBal = newDestResBal;
	}
	this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.destResBal);

	this.updateExch(this.model);

	this.setExpectedState(this.model.state);

	return this.performAction(() => this.content.account.selectAccount(account_id));
};


DebtTransactionPage.prototype.changeAccountByPos = function(pos)
{
	return this.changeAccount(this.content.account.dropDown.items[pos].id);
};


DebtTransactionPage.prototype.clickSrcAmount = function()
{
	if (this.model.state === 1 || this.model.state === 2)			// Transition 2 or 4
		this.setExpectedState(0);
	else if (this.model.state === 4 || this.model.state === 5)		// Transition 30 or 12
		this.setExpectedState(3);
	else if (this.model.state === 8)		// Transition 31
		this.setExpectedState(7);
	else if (this.model.state === 9)		// Transition 35
		this.setExpectedState(6);
	else
		throw new Error('Unexpected state ' + this.model.state + ' for clickSrcAmount action');

	return DebtTransactionPage.parent.clickSrcAmount.apply(this, arguments);
};
