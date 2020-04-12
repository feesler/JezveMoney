import { TransactionView } from '../transaction.js';
import { Currency } from '../../model/currency.js';
import { isValidValue, normalize, normalizeExch, correct, setParam } from '../../common.js'
import { INCOME } from '../../model/transaction.js';
import { App } from '../../app.js'


// Create or update income transaction view class
class IncomeTransactionView extends TransactionView
{
	async buildModel(cont)
	{
		let res = {};

		res.type = INCOME;
		res.isUpdate = cont.isUpdate;
		if (res.isUpdate)
			res.id = cont.id;

		res.destAccount = App.state.accounts.getItem(cont.destination.id);
		if (!res.destAccount)
			throw new Error('Destination account not found');

		res.src_curr_id = cont.src_amount_row ? parseInt(cont.src_amount_row.hiddenValue) : 0;
		res.dest_curr_id = cont.dest_amount_row ? parseInt(cont.dest_amount_row.hiddenValue) : 0;

		if (res.destAccount.curr_id != res.dest_curr_id)
			throw new Error('Unexpected destination currency ' + res.dest_curr_id + '(' + res.destAccount.curr_id + ' is expected)');

		res.srcCurr = Currency.getById(res.src_curr_id);
		if (!res.srcCurr)
			throw new Error('Source currency not found');
		res.destCurr = Currency.getById(res.dest_curr_id);
		if (!res.destCurr)
			throw new Error('Destination currency not found');

		res.destAccount.fmtBalance = res.destCurr.format(res.destAccount.balance);

		res.srcAmount = cont.src_amount_row.value;
		res.fSrcAmount = isValidValue(res.srcAmount) ? normalize(res.srcAmount) : res.srcAmount;

		res.destAmount = cont.dest_amount_row.value;
		res.fDestAmount = isValidValue(res.destAmount) ? normalize(res.destAmount) : res.destAmount;

		res.destResBal = cont.result_balance_dest_row.value;
		res.fDestResBal = isValidValue(res.destResBal) ? normalize(res.destResBal) : res.destResBal;
		res.fmtDestResBal = res.destCurr.format(res.fDestResBal);

		res.exchRate = cont.exchange_row.value;
		this.updateExch(res);

		let isDestResBalRowVisible = !!(cont.result_balance_dest_row && await this.isVisible(cont.result_balance_dest_row.elem));
		let isExchRowVisible = !!(cont.exchange_row && await this.isVisible(cont.exchange_row.elem));

		res.isDiffCurr = (res.src_curr_id != res.dest_curr_id);

		if (res.isDiffCurr)
		{
			if (isExchRowVisible)
				res.state = 3;
			else
				res.state = (isDestResBalRowVisible) ? 4 : 2;
		}
		else
		{
			res.state = (isDestResBalRowVisible) ? 1 : 0;
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

			model.destResBal = normalize(model.destAccount.balance + model.fDestAmount);
			model.fmtDestResBal = model.destCurr.format(model.destResBal);
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
									source : false, destination : true, result_balance_row : false, src_res_balance_left : false },
					values : { typeMenu : { activeType : INCOME },
								destination : { tile : { name : this.model.destAccount.name, balance : this.model.destAccount.fmtBalance } },
								src_amount_row : { value : this.model.srcAmount.toString(), currSign : this.model.srcCurr.sign, isCurrActive : true },
								src_amount_left : this.model.srcCurr.format(this.model.fSrcAmount),
								dest_amount_row : { value : this.model.destAmount.toString(), currSign : this.model.destCurr.sign, isCurrActive : false },
								dest_amount_left : this.model.destCurr.format(this.model.fDestAmount),
								result_balance_dest_row : { value : this.model.destResBal.toString(), label : 'Result balance', isCurrActive : false },
								dest_res_balance_left : this.model.fmtDestResBal,
								exchange_row : { value : this.model.exchRate.toString(), currSign : this.model.exchSign },
								exch_left : this.model.fmtExch }
					};

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
			setParam(res, { visibility : { src_amount_left : false, dest_amount_left : false, dest_res_balance_left : true, exch_left : false,
										src_amount_row : true, dest_amount_row : false,
										result_balance_dest_row : false, exchange_row : false } });
		}
		else if (newState === 1)
		{
			setParam(res, { visibility : { src_amount_left : true, dest_amount_left : false, dest_res_balance_left : false, exch_left : false,
										src_amount_row : false, dest_amount_row : false,
										result_balance_dest_row : true, exchange_row : false } });
		}
		else if (newState === 2)
		{
			setParam(res, { visibility : { src_amount_left : false, dest_amount_left : false, dest_res_balance_left : true, exch_left : true,
										src_amount_row : true, dest_amount_row : true, exchange_row : false,
										result_balance_dest_row : false } });
		}
		else if (newState === 3)
		{
			setParam(res, { visibility : { src_amount_left : false, dest_amount_left : true, dest_res_balance_left : true, exch_left : false,
										src_amount_row : true, dest_amount_row : false, exchange_row : true,
										result_balance_dest_row : false } });
		}
		else if (newState === 4)
		{
			setParam(res, { visibility : { src_amount_left : false, dest_amount_left : true, dest_res_balance_left : false, exch_left : true,
										src_amount_row : true, dest_amount_row : false, exchange_row : false,
										result_balance_dest_row : true } });
		}

		this.expectedState = res;

		return res;
	}


	async inputSrcAmount(val)
	{
		let fNewValue = (isValidValue(val)) ? normalize(val) : val;

		this.model.srcAmount = val;

		if (this.model.fSrcAmount !== fNewValue)
		{
			this.model.fSrcAmount = fNewValue;

			if (this.model.isDiffCurr)
			{
				if (isValidValue(this.model.destAmount))
				{
					this.calcExchByAmounts(this.model);
					this.updateExch(this.model);
				}
			}
			else
			{
				this.setDestAmount(this.model, this.model.fSrcAmount);
			}
		}

		this.setExpectedState(this.model.state);

		return super.inputSrcAmount(val);
	}


	async inputDestAmount(val)
	{
		let fNewValue = (isValidValue(val)) ? normalize(val) : val;

		this.setDestAmount(this.model, val)

		if (this.model.isDiffCurr)
		{
			this.calcExchByAmounts(this.model);
			this.updateExch(this.model);
		}
		else
			this.setSrcAmount(this.model, this.model.destAmount);

		this.setExpectedState(this.model.state);

		return super.inputDestAmount(val);
	}


	async inputDestResBalance(val)
	{
		let fNewValue = isValidValue(val) ? normalize(val) : val;

		this.model.destResBal = val;

		if (this.model.fDestResBal !== fNewValue)
		{
			this.model.fDestResBal = fNewValue;
			this.model.fmtDestResBal = this.model.destCurr.format(this.model.destResBal);

			let newSrcAmount = normalize(fNewValue - this.model.destAccount.balance);

			this.model.srcAmount = newSrcAmount;
			this.model.fSrcAmount = isValidValue(newSrcAmount) ? normalize(newSrcAmount) : newSrcAmount;

			if (this.model.isDiffCurr)
			{
				this.calcExchByAmounts(this.model);
				this.updateExch(this.model);
			}
			else
				this.setDestAmount(this.model, this.model.fSrcAmount);
		}

		this.setExpectedState(this.model.state);

		return super.inputDestResBalance(val);
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


	async clickDestResultBalance()
	{
		if (this.model.state === 0)
			this.setExpectedState(1);		// Transition 2
		else if (this.model.state === 2 || this.model.state === 3)
			this.setExpectedState(4);		// Transition 7 or 14

		return super.clickDestResultBalance();
	}


	async changeDestAccount(account_id)
	{
		let newAcc = App.state.accounts.getItem(account_id);

		if (!this.model.destAccount || !newAcc || newAcc.id == this.model.destAccount.id)
			return;

		this.model.destAccount = newAcc;
		this.model.dest_curr_id = this.model.destAccount.curr_id;
		this.model.destCurr = Currency.getById(this.model.dest_curr_id);
		this.model.destAccount.fmtBalance = this.model.destCurr.format(this.model.destAccount.balance);

		// Copy destination currency to source currency if needed
		if (this.model.state === 0 || this.model.state === 1)		// Transition 1 or 23
		{
			this.model.src_curr_id = this.model.dest_curr_id;
			this.model.srcCurr = this.model.destCurr;
		}

		// Update result balance of destination
		let newDestResBal = normalize(this.model.destAccount.balance + this.model.fDestAmount);
		if (this.model.fDestResBal != newDestResBal)
		{
			this.model.destResBal = this.model.fDestResBal = newDestResBal;
		}
		this.model.fmtDestResBal = this.model.destCurr.format(this.model.fDestResBal);

		// Update exchange rate
		this.calcExchByAmounts(this.model);
		this.updateExch(this.model);

		this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);
		if (this.model.isDiffCurr)
		{
			if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4)			// Transition 5, 11 or 17
				this.setExpectedState(this.model.state);
			else
				throw new Error('Unexpected state ' + this.model.state + ' with different currencies');
		}
		else
		{
			if (this.model.state === 2 ||			// Transition 6
				this.model.state === 3)				// Transition 12
			{
				this.setSrcAmount(this.model, this.model.destAmount);
				this.setExpectedState(0);
			}
			else if (this.model.state === 4)		// Transition 18
			{
				this.setSrcAmount(this.model, this.model.destAmount);
				this.setExpectedState(1);
			}
			else									// Transition 1 or 23
			{
				this.setExpectedState(this.model.state);
			}
		}

		return super.changeDestAccount(account_id);
	}


	async clickSrcAmount()
	{
		if (this.model.state === 1)		// Transition 4
			this.setExpectedState(0);
		else
			throw new Error('Unexpected state ' + this.model.state + ' for clickSrcAmount action');

		return super.clickSrcAmount();
	}


	async clickDestAmount()
	{
		if (this.model.state === 3 || this.model.state === 4)		// Transition 13 or 19
			this.setExpectedState(2);
		else
			throw new Error('Unexpected state ' + this.model.state + ' for clickDestAmount action');

		return super.clickDestAmount();
	}


	async clickExchRate()
	{
		this.setExpectedState(3);	// Transition 20

		return super.clickExchRate();
	}


	async changeSourceCurrency(val)
	{
		if (this.model.src_curr_id == val)
			return super.changeSourceCurrency(val);

		this.model.src_curr_id = parseInt(val);
		this.model.srcCurr = Currency.getById(this.model.src_curr_id);

		this.model.isDiffCurr = (this.model.src_curr_id != this.model.dest_curr_id);

		if (this.model.isDiffCurr && this.model.state === 0)			// Transition 3
		{
			this.updateExch(this.model);
			this.setExpectedState(2);
		}
		else if (this.model.state === 2 || this.model.state === 3 || this.model.state === 4)
		{
			if (this.model.isDiffCurr)			// Transition 9, 21 or 15
			{
				this.updateExch(this.model);
				this.setExpectedState(this.model.state);
			}
			else								// Transition 9
			{
				this.setDestAmount(this.model, this.model.srcAmount);
				this.calcExchByAmounts(this.model);
				this.updateExch(this.model);
				if (this.model.state === 2 || this.model.state === 3)	// Transition 10 or 16
					this.setExpectedState(0);
				else													// Transition 22
					this.setExpectedState(1);
			}
		}
		else
			throw new Error('Unexpected transition');

		return super.changeSourceCurrency(val);
	}

}


export { IncomeTransactionView };
