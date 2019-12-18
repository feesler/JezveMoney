if (typeof module !== 'undefined' && module.exports)
{
	const common = require('../../common.js');
	var extend = common.extend;
	var setParam = common.setParam;
	var idSearch = common.idSearch;
	var normalize = common.normalize;
	var normalizeExch = common.normalizeExch;
	var correct = common.correct;
	var correctExch = common.correctExch;
	var isValidValue = common.isValidValue;
	var getCurrency = common.getCurrency;

	var TransactionView = require('../transaction.js');
}


// Transfer transaction view class
class TransferTransactionView extends TransactionView
{

constructor(...args)
{
	super(...args);

	this.expectedState = {};
}


async buildModel(cont)
{
	var res = {};

	res.isUpdate = cont.isUpdate;
	if (res.isUpdate)
		res.id = cont.id;

	res.srcAccount = await this.getAccount(cont.source.id);
	if (!res.srcAccount)
		throw new Error('Source account not found');

	res.destAccount = await this.getAccount(cont.destination.id);
	if (!res.destAccount)
		throw new Error('Destination account not found');

	res.src_curr_id = cont.src_amount_row ? parseInt(cont.src_amount_row.hiddenValue) : 0;
	res.dest_curr_id = cont.dest_amount_row ? parseInt(cont.dest_amount_row.hiddenValue) : 0;

	if (res.srcAccount.curr_id != res.src_curr_id)
		throw new Error('Unexpected destination currency ' + res.dest_curr_id + '(' + res.destAccount.curr_id + ' is expected)');
	if (res.destAccount.curr_id != res.dest_curr_id)
		throw new Error('Unexpected destination currency ' + res.dest_curr_id + '(' + res.destAccount.curr_id + ' is expected)');

	res.srcCurr = getCurrency(res.src_curr_id);
	if (!res.srcCurr)
		throw new Error('Source currency not found');
	res.destCurr = getCurrency(res.dest_curr_id);
	if (!res.destCurr)
		throw new Error('Destination currency not found');

	res.srcAccount.fmtBalance = res.srcCurr.formatValue(res.srcAccount.balance);
	res.destAccount.fmtBalance = res.destCurr.formatValue(res.destAccount.balance);

	res.srcAmount = cont.src_amount_row.value;
	res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

	res.destAmount = cont.dest_amount_row.value;
	res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

	res.srcResBal = cont.result_balance_row.value;
	res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
	res.fmtSrcResBal = res.srcCurr.formatValue(res.fSrcResBal);

	res.destResBal = cont.result_balance_dest_row.value;
	res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
	res.fmtDestResBal = res.destCurr.formatValue(res.fDestResBal);

	res.exchRate = cont.exchange_row.value;
	this.updateExch(res);

	var isSrcAmountRowVisible = !!(cont.src_amount_row && await this.isVisible(cont.src_amount_row.elem));
	var isDestAmountRowVisible = !!(cont.dest_amount_row && await this.isVisible(cont.dest_amount_row.elem));
	var isSrcResBalRowVisible = !!(cont.result_balance_row && await this.isVisible(cont.result_balance_row.elem));
	var isDestResBalRowVisible = !!(cont.result_balance_dest_row && await this.isVisible(cont.result_balance_dest_row.elem));
	var isExchRowVisible = !!(cont.exchange_row && await this.isVisible(cont.exchange_row.elem));

	res.isDiffCurr = (res.src_curr_id != res.dest_curr_id);

	if (res.isDiffCurr)
	{
		if (isSrcAmountRowVisible && isDestAmountRowVisible)
			res.state = 3;
		else if (isDestAmountRowVisible && isSrcResBalRowVisible)
			res.state = 4;
		else if (isSrcAmountRowVisible && isDestResBalRowVisible)
			res.state = 5;
		else if (isSrcResBalRowVisible && isDestResBalRowVisible)
			res.state = 6;
		else if (isSrcAmountRowVisible && isExchRowVisible)
			res.state = 7;
		else if (isSrcResBalRowVisible && isExchRowVisible)
			res.state = 8;
		else
			throw new Error('Unexpected state');
	}
	else
	{
		if (isSrcAmountRowVisible)
			res.state = 0;
		else if (isSrcResBalRowVisible)
			res.state = 1;
		else if (isDestResBalRowVisible)
			res.state = 2
		else
			throw new Error('Unexpected state');
	}

	res.date = cont.datePicker.date;
	res.comment = cont.comment_row.value;

	return res;
}


// Set source amount value
// State 0, 1 or 2: source and destination currencies are the same
setSrcAmount(model, val)
{
	model.srcAmount = val;

	var newValue = isValidValue(val) ? normalize(val) : val;
	if (model.fSrcAmount != newValue)
	{
		model.fSrcAmount = newValue;

		model.srcResBal = normalize(model.srcAccount.balance - model.fSrcAmount);
		model.fmtSrcResBal = model.srcCurr.formatValue(model.srcResBal);
	}

	return model;
}


// Set destination amount value
// State 0, 1 or 2: source and destination currencies are the same
setDestAmount(model, val)
{
	model.destAmount = val;

	var newValue = isValidValue(model.destAmount) ? normalize(model.destAmount) : model.destAmount;
	if (model.fDestAmount != newValue)
	{
		model.fDestAmount = newValue;

		model.destResBal = normalize(model.destAccount.balance + model.fDestAmount);
		model.fmtDestResBal = model.destCurr.formatValue(model.destResBal);
	}

	return model;
}


setExpectedState(state_id)
{
	var res = {};

	var newState = parseInt(state_id);

	if (isNaN(newState) || newState < 0 || newState > 8)
		throw new Error('Wrong state specified');

	var res = { model : { state : newState },
				visibility : { source : true, destination : true },
				values : { typeMenu : { activeType : 3 }, /* TRANSFER */
							source : { tile : { name : this.model.srcAccount.name, balance : this.model.srcAccount.fmtBalance } },
							destination : { tile : { name : this.model.destAccount.name, balance : this.model.destAccount.fmtBalance } },
							src_amount_row : { value : this.model.srcAmount.toString(), currSign : this.model.srcCurr.sign, isCurrActive : false },
							src_amount_left : this.model.srcCurr.formatValue(this.model.fSrcAmount),
							dest_amount_row : { value : this.model.destAmount.toString(), currSign : this.model.destCurr.sign, isCurrActive : false },
							dest_amount_left : this.model.destCurr.formatValue(this.model.fDestAmount),
							result_balance_row : { value : this.model.srcResBal.toString(), label : 'Result balance (Source)', isCurrActive : false },
							src_res_balance_left : this.model.fmtSrcResBal,
							result_balance_dest_row : { value : this.model.destResBal.toString(), label : 'Result balance (Destination)', isCurrActive : false },
							dest_res_balance_left : this.model.fmtDestResBal,
							exchange_row : { value : this.model.exchRate.toString(), currSign : this.model.exchSign },
							exch_left : this.model.fmtExch } };

	if (newState === 0 || newState === 1 || newState === 2)
	{
		setParam(res.values, { src_amount_row : { label : 'Amount' },
								dest_amount_row : { label : 'Amount' } });
	}
	else
	{
		setParam(res.values, { src_amount_row : { label : 'Source amount' },
								dest_amount_row : { label : 'Destination amount' } });
	}

	if (newState === 0)
	{
		setParam(res, { visibility : { src_amount_left : false, dest_amount_left : false,
										src_res_balance_left : true, dest_res_balance_left : true,
										exch_left : false,
										src_amount_row : true, dest_amount_row : false,
										result_balance_row : false, result_balance_dest_row : false,
										exchange_row : false } });
	}
	else if (newState === 1)
	{
		setParam(res, { visibility : { src_amount_left : true, dest_amount_left : false,
										src_res_balance_left : false, dest_res_balance_left : true,
										exch_left : false,
										src_amount_row : false, dest_amount_row : false,
										result_balance_row : true, result_balance_dest_row : false,
										exchange_row : false } });
	}
	else if (newState === 2)
	{
		setParam(res, { visibility : { src_amount_left : true, dest_amount_left : false,
										src_res_balance_left : true, dest_res_balance_left : false,
										exch_left : false,
										src_amount_row : false, dest_amount_row : false,
										result_balance_row : false, result_balance_dest_row : true,
										exchange_row : false } });
	}
	else if (newState === 3)
	{
		setParam(res, { visibility : { src_amount_left : false, dest_amount_left : false,
										src_res_balance_left : true, dest_res_balance_left : true,
										exch_left : true,
										src_amount_row : true, dest_amount_row : true,
										result_balance_row : false, result_balance_dest_row : false,
										exchange_row : false } });
	}
	else if (newState === 4)
	{
		setParam(res, { visibility : { src_amount_left : true, dest_amount_left : false,
										src_res_balance_left : false, dest_res_balance_left : true,
										exch_left : true,
										src_amount_row : false, dest_amount_row : true,
										result_balance_row : true, result_balance_dest_row : false,
										exchange_row : false } });
	}
	else if (newState === 5)
	{
		setParam(res, { visibility : { src_amount_left : false, dest_amount_left : true,
										src_res_balance_left : true, dest_res_balance_left : false,
										exch_left : true,
										src_amount_row : true, dest_amount_row : false,
										result_balance_row : false, result_balance_dest_row : true,
										exchange_row : false } });
	}
	else if (newState === 6)
	{
		setParam(res, { visibility : { src_amount_left : true, dest_amount_left : true,
										src_res_balance_left : false, dest_res_balance_left : false,
										exch_left : true,
										src_amount_row : false, dest_amount_row : false,
										result_balance_row : true, result_balance_dest_row : true,
										exchange_row : false } });
	}
	else if (newState === 7)
	{
		setParam(res, { visibility : { src_amount_left : false, dest_amount_left : true,
										src_res_balance_left : true, dest_res_balance_left : true,
										exch_left : false,
										src_amount_row : true, dest_amount_row : false,
										result_balance_row : false, result_balance_dest_row : false,
										exchange_row : true } });
	}
	else if (newState === 8)
	{
		setParam(res, { visibility : { src_amount_left : true, dest_amount_left : true,
										src_res_balance_left : false, dest_res_balance_left : true,
										exch_left : false,
										src_amount_row : false, dest_amount_row : false,
										result_balance_row : true, result_balance_dest_row : false,
										exchange_row : true } });
	}

	this.expectedState = res;

	return res;
}


inputSrcAmount(val)
{
	if (this.model.state !== 0 && this.model.state !== 3 && this.model.state !== 5 && this.model.state !== 7)
		throw new Error('Unexpected state ' + this.model.state + ' to input source amount');

	var fNewValue = (isValidValue(val)) ? normalize(val) : val;
	var valueChanged = (this.model.fSrcAmount != fNewValue);

	this.setSrcAmount(this.model, val);

	if (valueChanged)
	{
		if (this.model.isDiffCurr)
		{
			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}
		else
		{
			this.setDestAmount(this.model, this.model.fSrcAmount);
		}
	}

	this.setExpectedState(this.model.state);

	return super.inputSrcAmount(val);
}


inputDestAmount(val)
{
	if (this.model.state !== 3 && this.model.state !== 4)
		throw new Error('Unexpected state ' + this.model.state + ' to input destination amount');

	var fNewValue = (isValidValue(val)) ? normalize(val) : val;
	var valueChanged = (this.model.fDestAmount != fNewValue);

	this.setDestAmount(this.model, val)

	if (valueChanged)
	{
		if (this.model.isDiffCurr)
		{
			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}
		else
			this.setSrcAmount(this.model, this.model.destAmount);
	}

	this.setExpectedState(this.model.state);

	return super.inputDestAmount(val);
}


inputResBalance(val)
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

		if (this.model.isDiffCurr)
		{
			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}
		else
			this.setDestAmount(this.model, this.model.srcAmount);
	}

	this.setExpectedState(this.model.state);

	return super.inputResBalance(val);
}


inputDestResBalance(val)
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

		if (this.model.isDiffCurr)
		{
			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}
		else
			this.setSrcAmount(this.model, this.model.destAmount);
	}

	this.setExpectedState(this.model.state);

	return super.inputDestResBalance(val);
}


inputExchRate(val)
{
	if (this.model.state !== 3)
		throw new Error('Unexpected state ' + this.model.state + ' to input exchange rate');

	this.model.exchRate = val;

	var fNewValue = (isValidValue(val)) ? normalizeExch(val) : val;
	if (this.model.fExchRate != fNewValue)
	{
		if (isValidValue(this.model.srcAmount))
		{
			var newDestAmount = correct(this.model.fSrcAmount * fNewValue);
			this.setDestAmount(this.model, newDestAmount);
		}
		else if (isValidValue(this.model.destAmount))
		{
			var newSrcAmount = correct(this.model.fDestAmount / fNewValue);
			this.setSrcAmount(this.model, newSrcAmount);
		}

		this.updateExch(this.model);
	}

	this.setExpectedState(3);

	return super.inputExchRate(val);
}


clickSrcResultBalance()
{
	if (this.model.state === 0 || this.model.state === 2)
		this.setExpectedState(1);					// Transition 1 or 10
	else if (this.model.state === 3)
		this.setExpectedState(4);					// Transition 31
	else if (this.model.state === 5)
		this.setExpectedState(6);					// Transition 19
	else if (this.model.state === 7)
		this.setExpectedState(8);					// Transition 22

	return super.clickSrcResultBalance();
}


clickDestResultBalance()
{
	if (this.model.state === 0 || this.model.state === 1)
		this.setExpectedState(2);					// Transition 3 or 9
	else if (this.model.state === 3 || this.model.state === 7)
		this.setExpectedState(5);					// Transition 25 or 56
	else if (this.model.state === 4 || this.model.state === 8)
		this.setExpectedState(6);					// Transition 32 or 46

	return super.clickDestResultBalance();
}


async changeSrcAccount(account_id)
{
	var newAcc = await this.getAccount(account_id);

	if (!this.model.srcAccount || !newAcc || newAcc.id == this.model.srcAccount.id)
		return;

	this.model.srcAccount = newAcc;
	this.model.src_curr_id = this.model.srcAccount.curr_id;
	this.model.srcCurr = getCurrency(this.model.src_curr_id);
	this.model.srcAccount.fmtBalance = this.model.srcCurr.formatValue(this.model.srcAccount.balance);

	// Update result balance of source
	var newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
	if (this.model.fSrcResBal != newSrcResBal)
	{
		this.model.srcResBal = this.model.fSrcResBal = newSrcResBal;
	}
	this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.fSrcResBal);

	if (newAcc.id == this.model.destAccount.id)
	{
		var nextAcc_id = await this.getNextAccount(newAcc.id);
		if (!nextAcc_id)
			throw new Error('Next account not found');

		this.model.destAccount = await this.getAccount(nextAcc_id);
		this.model.dest_curr_id = this.model.destAccount.curr_id;
		this.model.destCurr = getCurrency(this.model.dest_curr_id);
		this.model.destAccount.fmtBalance = this.model.destCurr.formatValue(this.model.destAccount.balance);

		// Copy source amount to destination amount
		if (this.model.fDestAmount != this.model.fSrcAmount)
		{
			this.model.destAmount = this.model.srcAmount;
		}
		this.model.fDestAmount = this.model.fSrcAmount;

		// Update result balance of destination
		var newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
		if (this.model.fDestResBal != newDestResBal)
		{
			this.model.destResBal = this.model.fDestResBal = newDestResBal;
		}
		this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.fDestResBal);
	}

	// Update exchange rate
	this.calcExchByAmounts(this.model);
	this.updateExch(this.model);

	this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);
	if (this.model.isDiffCurr)
	{
		if (this.model.state === 0)			// Transition 6
			this.setExpectedState(3);
		else if (this.model.state === 1)			// Transition 12
			this.setExpectedState(4);
		else if (this.model.state === 2)			// Transition 16
			this.setExpectedState(5);
		else if (this.model.state === 3 || this.model.state === 4 || this.model.state === 5 ||
			 	this.model.state === 6 || this.model.state === 7 || this.model.state === 8)
			this.setExpectedState(this.model.state);			// Transition 43, 36, 26, 49, 51 or 57
		else
			throw new Error('changeSrcAccount(): Unexpected state ' + this.model.state + ' with different currencies');
	}
	else
	{
		if (this.model.fSrcAmount != this.model.fDestAmount)
			this.setDestAmount(this.model, this.model.fSrcAmount);

		if (this.model.state === 0 || this.model.state === 1 || this.model.state === 2)
		{
			this.setExpectedState(this.model.state);			// Transition 5, 11 or 15
		}
		else if (this.model.state === 3 || this.model.state === 7)
		{
			this.setExpectedState(0);			// Transition 3 or 58
		}
		else if (this.model.state === 4 || this.model.state === 6 || this.model.state === 8)
		{
			this.setExpectedState(1);			// Transition 37, 50 or 52
		}
		else if (this.model.state === 5)
		{
			this.setExpectedState(2);			// Transition 27
		}
		else
			throw new Error('changeSrcAccount(): Unexpected state ' + this.model.state + ' with same currencies');
	}

	return super.changeSrcAccount(account_id);
}


async changeDestAccount(account_id)
{
	var newAcc = await this.getAccount(account_id);

	if (!this.model.destAccount || !newAcc || newAcc.id == this.model.destAccount.id)
		return;

	this.model.destAccount = newAcc;
	this.model.dest_curr_id = this.model.destAccount.curr_id;
	this.model.destCurr = getCurrency(this.model.dest_curr_id);
	this.model.destAccount.fmtBalance = this.model.destCurr.formatValue(this.model.destAccount.balance);

	// Update result balance of destination
	var newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
	if (this.model.fDestResBal != newDestResBal)
	{
		this.model.destResBal = this.model.fDestResBal = newDestResBal;
	}
	this.model.fmtDestResBal = this.model.destCurr.formatValue(this.model.fDestResBal);

	if (newAcc.id == this.model.srcAccount.id)
	{
		var nextAcc_id = await this.getNextAccount(newAcc.id);
		var newSrcAcc = await this.getAccount(nextAcc_id);
		if (!newSrcAcc)
			throw new Error('Next account not found');
		this.model.srcAccount = newSrcAcc;
		this.model.src_curr_id = this.model.srcAccount.curr_id;
		this.model.srcCurr = getCurrency(this.model.src_curr_id);
		this.model.srcAccount.fmtBalance = this.model.srcCurr.formatValue(this.model.srcAccount.balance);

		// Copy destination amount to source amount
		if (this.model.fDestAmount != this.model.fSrcAmount)
		{
			this.model.srcAmount = this.model.destAmount;
		}
		this.model.fSrcAmount = this.model.fDestAmount;

		// Update result balance of source
		var newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
		if (this.model.fSrcResBal != newSrcResBal)
		{
			this.model.srcResBal = this.model.fSrcResBal = newSrcResBal;
		}
		this.model.fmtSrcResBal = this.model.srcCurr.formatValue(this.model.fSrcResBal);
	}

	// Update exchange rate
	this.calcExchByAmounts(this.model);
	this.updateExch(this.model);

	this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);
	if (this.model.isDiffCurr)
	{
		if (this.model.state === 0)				// Transition 8
			this.setExpectedState(3);
		else if (this.model.state === 1)		// Transition 14
			this.setExpectedState(4);
		else if (this.model.state === 2)		// Transition 18
			this.setExpectedState(5);
		else if (this.model.state === 3 || this.model.state === 4 || this.model.state === 5 ||			// Transition 41, 38 or 28
					this.model.state === 6 || this.model.state === 7 || this.model.state === 8)			// Transition 47, 59 or 53
			this.setExpectedState(this.model.state);
		else
			throw new Error('changeDestAccount(): Unexpected state ' + this.model.state + ' with different currencies');
	}
	else
	{
		if (this.model.fSrcAmount != this.model.fDestAmount)
			this.setDestAmount(this.model, this.model.fSrcAmount);

		if (this.model.state === 0 || this.model.state === 1 || this.model.state === 2)				// Transition 7, 13 or 17
		{
			this.setExpectedState(this.model.state);
		}
		else if (this.model.state === 3 || this.model.state === 7)		// Transition 42 or 60
		{
			this.setExpectedState(0);
		}
		else if (this.model.state === 4 || this.model.state === 8)		// Transition 39 or 54
		{
			this.setExpectedState(1);
		}
		else if (this.model.state === 5 || this.model.state === 6)		// Transition 29 or 48
		{
			this.setExpectedState(2);
		}
		else
			throw new Error('changeDestAccount(): Unexpected state ' + this.model.state + ' with same currencies');
	}

	return super.changeDestAccount(account_id);
}


clickSrcAmount()
{
	if (this.model.state === 1 || this.model.state === 2)		// Transition 2 or 4
		this.setExpectedState(0);
	else if (this.model.state === 4)		// Transition 30
		this.setExpectedState(3);
	else if (this.model.state === 6)		// Transition 20
		this.setExpectedState(5);
	else if (this.model.state === 8)		// Transition 23
		this.setExpectedState(7);
	else
		throw new Error('Unexpected state ' + this.model.state + ' for clickSrcAmount action');

	return super.clickSrcAmount();
}


clickDestAmount()
{
	if (this.model.state === 5 || this.model.state === 7)		// Transition 24 or 55
		this.setExpectedState(3);
	else if (this.model.state === 6 || this.model.state === 8)		// Transition 33 or 35
		this.setExpectedState(4);
	else
		throw new Error('Unexpected state ' + this.model.state + ' for clickDestAmount action');

	return super.clickDestAmount();
}


clickExchRate()
{
	if (this.model.state === 3 || this.model.state === 5)				// Transition 40 or 21
		this.setExpectedState(7);
	else if (this.model.state === 4 || this.model.state === 6)			// Transition 34 or 45
		this.setExpectedState(8);

	return super.clickExchRate();
}


changeSourceCurrency(val)
{
	throw new Error('Unexpected action: can\'t change source currency of transfter transaction');
}


changeDestCurrency(val)
{
	throw new Error('Unexpected action: can\'t change destination currency of transfter transaction');
}


}


if (typeof module !== 'undefined' && module.exports)
	module.exports = TransferTransactionView;
