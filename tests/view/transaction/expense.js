import { TransactionView } from '../transaction.js';
import { Currency } from '../../currency.js';
import { EXPENSE, isValidValue, normalize, normalizeExch, correct, setParam } from '../../common.js'
import { App } from '../../app.js'


// Create or update expense transaction view tests
class ExpenseTransactionView extends TransactionView
{
	async buildModel(cont)
	{
		let res = {};

		res.type = EXPENSE;
		res.isUpdate = cont.isUpdate;
		if (res.isUpdate)
			res.id = cont.id;

		res.srcAccount = await App.state.getAccount(cont.source.id);
		if (!res.srcAccount)
			throw new Error('Source account not found');

		res.src_curr_id = cont.src_amount_row ? parseInt(cont.src_amount_row.hiddenValue) : 0;
		res.dest_curr_id = cont.dest_amount_row ? parseInt(cont.dest_amount_row.hiddenValue) : 0;

		if (res.srcAccount.curr_id != res.src_curr_id)
			throw new Error('Unexpected source currency ' + res.src_curr_id + ' (' + res.srcAccount.curr_id + ' is expected)');

		res.srcCurr = Currency.getById(res.src_curr_id);
		if (!res.srcCurr)
			throw new Error('Source currency not found');
		res.destCurr = Currency.getById(res.dest_curr_id);
		if (!res.destCurr)
			throw new Error('Destination currency not found');

		res.srcAccount.fmtBalance = res.srcCurr.format(res.srcAccount.balance);

		res.srcAmount = cont.src_amount_row.value;
		res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

		res.destAmount = cont.dest_amount_row.value;
		res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

		res.srcResBal = cont.result_balance_row.value;
		res.fSrcResBal = isValidValue(res.srcResBal) ? normalize(res.srcResBal) : res.srcResBal;
		res.fmtSrcResBal = res.srcCurr.format(res.fSrcResBal);

		res.exchRate = cont.exchange_row.value;
		this.updateExch(res);

		let isResBalRowVisible = !!(cont.result_balance_row && await this.isVisible(cont.result_balance_row.elem));
		let isExchRowVisible = !!(cont.exchange_row && await this.isVisible(cont.exchange_row.elem));

		res.isDiffCurr = (res.src_curr_id != res.dest_curr_id);

		if (res.isDiffCurr)
		{
			if (isExchRowVisible)
				res.state = 3;
			else
				res.state = (isResBalRowVisible) ? 4 : 2;
		}
		else
		{
			res.state = (isResBalRowVisible) ? 1 : 0;
		}

		res.date = cont.datePicker.date;
		res.comment = cont.comment_row.value;

		return res;
	}


	// Set source amount value
	// State 0 or 1: source and destination currencies are the same
	setSrcAmount(model, val)
	{
		model.srcAmount = val;

		let newValue = isValidValue(val) ? normalize(val) : val;
		if (model.fSrcAmount != newValue)
		{
			model.fSrcAmount = newValue;

			model.srcResBal = normalize(model.srcAccount.balance - model.fSrcAmount);
			model.fmtSrcResBal = model.srcCurr.format(model.srcResBal);
		}

		return model;
	}


	// Set destination amount value
	// State 0 or 1: source and destination currencies are the same
	setDestAmount(model, val)
	{
		model.destAmount = val;

		let newValue = isValidValue(model.destAmount) ? normalize(model.destAmount) : model.destAmount;
		if (model.fDestAmount != newValue)
		{
			model.fDestAmount = newValue;
		}

		return model;
	}


	setExpectedState(state_id)
	{
		let newState = parseInt(state_id);
		if (isNaN(newState) || newState < 0 || newState > 4)
			throw new Error('Wrong state specified');

		let res = { model : { state : newState },
					visibility : { delBtn : this.model.isUpdate,
									source : true, destination : false, src_amount_left : false,
									dest_res_balance_left : false, result_balance_dest_row : false },
					values : { typeMenu : { activeType : EXPENSE },
								source : { tile : { name : this.model.srcAccount.name, balance : this.model.srcAccount.fmtBalance } },
								src_amount_row : { value : this.model.srcAmount.toString(), currSign : this.model.srcCurr.sign, isCurrActive : false },
								dest_amount_row : { value : this.model.destAmount.toString(), currSign : this.model.destCurr.sign, isCurrActive : true },
								dest_amount_left : this.model.destCurr.format(this.model.fDestAmount),
								result_balance_row : { value : this.model.srcResBal.toString(), label : 'Result balance', isCurrActive : false },
								src_res_balance_left : this.model.fmtSrcResBal,
								exchange_row : { value : this.model.exchRate.toString(), currSign : this.model.exchSign },
								exch_left : this.model.fmtExch } };

		if (this.model.isUpdate)
			res.values.delBtn = { title : 'Delete' };

		if (newState === 0 || newState === 1)
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
			setParam(res, { visibility : { dest_amount_left : false, src_res_balance_left : true, exch_left : false,
										src_amount_row : false, dest_amount_row : true, exchange_row : false,
										result_balance_row : false } });
		}
		else if (newState === 1)
		{
			setParam(res, { visibility : { dest_amount_left : true, src_res_balance_left : false, exch_left : false,
										src_amount_row : false, dest_amount_row : false, exchange_row : false,
										result_balance_row : true } });
		}
		else if (newState === 2)
		{
			setParam(res, { visibility : { dest_amount_left : false, src_res_balance_left : true, exch_left : true,
										src_amount_row : true, dest_amount_row : true, exchange_row : false,
										result_balance_row : false } });
		}
		else if (newState === 3)
		{
			setParam(res, { visibility : { dest_amount_left : true,	src_res_balance_left : true, exch_left : false,
										src_amount_row : true, dest_amount_row : false, exchange_row : true,
										result_balance_row : false } });
		}
		else if (newState === 4)
		{
			setParam(res, { visibility : { dest_amount_left : true,
										src_res_balance_left : false, exch_left : true,
										src_amount_row : true, dest_amount_row : false, exchange_row : false,
										result_balance_row : true } });
		}

		this.expectedState = res;

		return res;
	}


	inputSrcAmount(val)
	{
		if (!this.model.isDiffCurr)
			throw new Error('Wrong state: can\'t input source amount on state ' + this.model.state);

		let fNewValue = (isValidValue(val)) ? normalize(val) : val;

		this.model.srcAmount = val;

		if (this.model.fSrcAmount != fNewValue)
		{
			this.model.fSrcAmount = fNewValue;

			this.model.srcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
			this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}

		this.setExpectedState(this.model.state);

		return super.inputSrcAmount(val);
	}


	async inputDestAmount(val)
	{
		let fNewValue = (isValidValue(val)) ? normalize(val) : val;

		this.model.destAmount = val;

		if (this.model.fDestAmount !== fNewValue)
		{
			this.model.fDestAmount = fNewValue;

			if (this.model.isDiffCurr)
			{
				if (isValidValue(this.model.srcAmount))
				{
					this.calcExchByAmounts(this.model);
					this.updateExch(this.model);
				}
			}
			else
				this.setSrcAmount(this.model, this.model.fDestAmount);
		}

		this.setExpectedState(this.model.state);

		return super.inputDestAmount(val);
	}


	async inputResBalance(val)
	{
		let fNewValue = isValidValue(val) ? normalize(val) : val;

		this.model.srcResBal = val;

		if (this.model.fSrcResBal !== fNewValue)
		{
			this.model.fSrcResBal = fNewValue;
			this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.srcResBal);

			let newSrcAmount = normalize(this.model.srcAccount.balance - fNewValue);

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


	async inputExchRate(val)
	{
		if (this.model.state !== 3)
			throw new Error('Unexpected state ' + this.model.state + ' to input exchange rate');

		this.model.exchRate = val;

		let fNewValue = (isValidValue(val)) ? normalizeExch(val) : val;
		if (this.model.fExchRate != fNewValue)
		{
			if (isValidValue(this.model.srcAmount))
			{
				let newDestAmount = correct(this.model.fSrcAmount * fNewValue);
				this.setDestAmount(this.model, newDestAmount);
			}
			else if (isValidValue(this.model.destAmount))
			{
				let newSrcAmount = correct(this.model.fDestAmount / fNewValue);
				this.setSrcAmount(this.model, newSrcAmount);
			}

			this.updateExch(this.model);
		}

		this.setExpectedState(3);

		return super.inputExchRate(val);
	}


	async clickSrcResultBalance()
	{
		if (this.model.state === 0)
			this.setExpectedState(1);
		else if (this.model.state === 2 || this.model.state === 3)
			this.setExpectedState(4);

		return super.clickSrcResultBalance();
	}


	async changeSrcAccount(account_id)
	{
		let newAcc = await App.state.getAccount(account_id);

		if (!this.model.srcAccount || !newAcc || newAcc.id == this.model.srcAccount.id)
			return;

		this.model.srcAccount = newAcc;
		this.model.src_curr_id = this.model.srcAccount.curr_id;
		this.model.srcCurr = Currency.getById(this.model.src_curr_id);
		this.model.srcAccount.fmtBalance = this.model.srcCurr.format(this.model.srcAccount.balance);

		// Copy source currency to destination currency if needed
		if (this.model.state === 0 || this.model.state === 1)		// Transition 1 or 12
		{
			this.model.dest_curr_id = this.model.src_curr_id;
			this.model.destCurr = this.model.srcCurr;
		}

		// Update result balance of source
		let newSrcResBal = normalize(this.model.srcAccount.balance - this.model.fSrcAmount);
		if (this.model.fSrcResBal != newSrcResBal)
		{
			this.model.srcResBal = this.model.fSrcResBal = newSrcResBal;
		}
		this.model.fmtSrcResBal = this.model.srcCurr.format(this.model.fSrcResBal);

		// Update exchange rate
		this.calcExchByAmounts(this.model);
		this.updateExch(this.model);

		this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);
		if (this.model.isDiffCurr)
		{
			if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4)			// Transition 5, 17 or 10
				this.setExpectedState(this.model.state);
			else
				throw new Error('Unexpected state ' + this.model.state + ' with different currencies');
		}
		else
		{
			if (this.model.state === 2 ||			// Transition 14
				this.model.state === 3)				// Transition 15
			{
				this.setDestAmount(this.model, this.model.srcAmount);
				this.setExpectedState(0);
			}
			else if (this.model.state === 4)		// Transition 11
			{
				this.setDestAmount(this.model, this.model.srcAmount);
				this.setExpectedState(1);
			}
			else									// Transition 1 or 12
			{
				this.setExpectedState(this.model.state);
			}
		}

		return super.changeSrcAccount(account_id);
	}


	async clickDestAmount()
	{
		if (this.model.state === 1)		// Transition 3
			this.setExpectedState(0);
		else if (this.model.state === 3 || this.model.state === 4)		// Transition 16 or 7
			this.setExpectedState(2);

		return super.clickDestAmount();
	}


	async clickExchRate()
	{
		this.setExpectedState(3);

		return super.clickExchRate();
	}


	async changeDestCurrency(val)
	{
		if (this.model.dest_curr_id == val)
			return super.changeDestCurrency(val);

		this.model.dest_curr_id = parseInt(val);
		this.model.destCurr = Currency.getById(this.model.dest_curr_id);

		this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);

		if (this.model.isDiffCurr && this.model.state === 0)			// Transition 4
		{
			this.updateExch(this.model);
			this.setExpectedState(2);
		}
		else if (this.model.state === 2)
		{
			if (this.model.isDiffCurr)			// Transition 13
			{
				this.updateExch(this.model);
				this.setExpectedState(2);
			}
			else								// Transition 9
			{
				this.setSrcAmount(this.model, this.model.fDestAmount);
				this.calcExchByAmounts(this.model);
				this.updateExch(this.model);
				this.setExpectedState(0);
			}
		}
		else
			throw new Error('Unexpected transition');

		return super.changeDestCurrency(val);
	}

}


export { ExpenseTransactionView };
