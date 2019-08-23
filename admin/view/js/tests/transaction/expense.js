// Create or update expense transaction page tests
function ExpenseTransactionPage()
{
	ExpenseTransactionPage.parent.constructor.apply(this, arguments);

	this.expectedState = {};
}


extend(ExpenseTransactionPage, TransactionPage);


ExpenseTransactionPage.prototype.setExpectedState = function(state_id, extra)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);
	var fmtBal = formatCurrency(selectedAcc.balance, selectedAcc.curr_id);
	var currObj = getCurrency(selectedAcc.curr_id);

	// Check if not first transition and moved to State 0 or State 1 (source and destination currencies are the same) from
	// any other state (where currencies are different)
	var copyAmount = (this.expectedState.extra && this.expectedState.extra.id != 0 && this.expectedState.extra.id != 1 &&
						(state_id == 0 || state_id == 1));

	var destAmount = this.content.dest_amount_row.value;
	var fDestAmount = (isValidValue(destAmount)) ? normalize(destAmount) : destAmount;

	var srcAmount = (copyAmount) ? destAmount : this.content.src_amount_row.value;
	var fSrcAmount = (isValidValue(srcAmount)) ? normalize(srcAmount) : srcAmount;

	var resBal = normalize(selectedAcc.balance - fSrcAmount);
	var fmtResBal = formatCurrency(resBal, selectedAcc.curr_id);

	if (state_id === 0)
	{
		setParam(this.expectedState, { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : false,
									src_res_balance_left : true, dest_res_balance_left : false, exch_left : false,
									src_amount_row : false, dest_amount_row : true, exchange_row : false,
									result_balance_row : false, result_balance_dest_row : false },
					values : { typeMenu : { 1 : { isActive : true } }, /* EXPENSE */
								source : { tile : { name : selectedAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Amount', currSign : currObj.sign, isCurrActive : false  },
								dest_amount_row : { label : 'Amount', currSign : currObj.sign, isCurrActive : true },
								dest_amount_left : formatCurrency(fDestAmount, currObj.id),
								result_balance_row : { label : 'Result balance', isCurrActive : false }, src_res_balance_left : fmtResBal,
								exchange_row : { value : '1', currSign : currObj.sign + '/' + currObj.sign }, exch_left : '1 ' + currObj.sign + '/' + currObj.sign },
					extra : { id : state_id } });
	}
	else if (state_id === 1)
	{
		setParam(this.expectedState, { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : true,
									src_res_balance_left : false, dest_res_balance_left : false, exch_left : false,
									src_amount_row : false, dest_amount_row : false, exchange_row : false,
									result_balance_row : true, result_balance_dest_row : false },
					values : { typeMenu : { 1 : { isActive : true } }, /* EXPENSE */
								source : { tile : { name : selectedAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Amount', currSign : currObj.sign, isCurrActive : false  },
								dest_amount_row : { label : 'Amount', currSign : currObj.sign, isCurrActive : true },
								dest_amount_left : formatCurrency(fDestAmount, currObj.id),
								result_balance_row : { label : 'Result balance', isCurrActive : false }, src_res_balance_left : fmtResBal,
								exch_left : '1 ' + currObj.sign + '/' + currObj.sign, exchange_row : { value : '1', currSign : currObj.sign + '/' + currObj.sign } },
						 	});
	}
	else if (state_id === 2)
	{
		var destCurrObj = getCurrency((extra === undefined) ? this.content.dest_curr_id : extra);


		setParam(this.expectedState, { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : false,
									src_res_balance_left : true, dest_res_balance_left : false, exch_left : true,
									src_amount_row : true, dest_amount_row : true, exchange_row : false,
									result_balance_row : false, result_balance_dest_row : false },
					values : { typeMenu : { 1 : { isActive : true } }, /* EXPENSE */
								source : { tile : { name : selectedAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Source amount', currSign : currObj.sign, isCurrActive : false  },
								dest_amount_row : { label : 'Destination amount', currSign : destCurrObj.sign, isCurrActive : true },
								result_balance_row : { label : 'Result balance', isCurrActive : false }, src_res_balance_left : fmtResBal }
					 		});
		if (extra !== undefined)
		{
			setParam(this.expectedState.values, { dest_amount_left : formatCurrency(this.content.dest_amount_row.value, destCurrObj.id),
							exch_left : '1 ' + destCurrObj.sign + '/' + currObj.sign,
							exchange_row : { value : '1', currSign : destCurrObj.sign + '/' + currObj.sign } });
		}
	}
	else if (state_id === 3)
	{
		var destCurrObj = getCurrency((extra === undefined) ? this.content.dest_curr_id : extra);

		setParam(this.expectedState, { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : true,
									src_res_balance_left : true, dest_res_balance_left : false, exch_left : false,
									src_amount_row : true, dest_amount_row : false, exchange_row : true,
									result_balance_row : false, result_balance_dest_row : false },
					values : { typeMenu : { 1 : { isActive : true } }, /* EXPENSE */
								source : { tile : { name : selectedAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Source amount', currSign : currObj.sign, isCurrActive : false  },
								dest_amount_row : { label : 'Destination amount', currSign : destCurrObj.sign, isCurrActive : true },
								result_balance_row : { label : 'Result balance', isCurrActive : false }, src_res_balance_left : fmtResBal }
					 		});
		if (extra !== undefined)
		{
			setParam(this.expectedState.values, { dest_amount_left : formatCurrency(this.content.dest_amount_row.value, destCurrObj.id),
							exch_left : '1 ' + destCurrObj.sign + '/' + currObj.sign,
							exchange_row : { value : '1', currSign : destCurrObj.sign + '/' + currObj.sign } });
		}
	}
	else if (state_id === 4)
	{
		var destCurrObj = getCurrency((extra === undefined) ? this.content.dest_curr_id : extra);


		setParam(this.expectedState, { visibility : { source : true, destination : false, src_amount_left : false, dest_amount_left : true,
									src_res_balance_left : false, dest_res_balance_left : false, exch_left : true,
									src_amount_row : true, dest_amount_row : false, exchange_row : false,
									result_balance_row : true, result_balance_dest_row : false },
					values : { typeMenu : { 1 : { isActive : true } }, /* EXPENSE */
								source : { tile : { name : selectedAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Source amount', currSign : currObj.sign, isCurrActive : false  },
								dest_amount_row : { label : 'Destination amount', currSign : destCurrObj.sign, isCurrActive : true },
								result_balance_row : { label : 'Result balance', isCurrActive : false }, src_res_balance_left : fmtResBal }
					 		});
		if (extra !== undefined)
		{
			setParam(this.expectedState.values, { dest_amount_left : formatCurrency(this.content.dest_amount_row.value, destCurrObj.id),
							exch_left : '1 ' + destCurrObj.sign + '/' + currObj.sign,
							exchange_row : { value : '1', currSign : destCurrObj.sign + '/' + currObj.sign } });
		}
	}

	// If source amount was copied then these values also must be updated
	if ((state_id === 0 || state_id === 1) && copyAmount)
	{
		this.expectedState.values.src_amount_row.value = fSrcAmount.toString();
		this.expectedState.values.result_balance_row.value = resBal.toString();
	}

	this.expectedState.extra = { id : state_id };

	return this.expectedState;
};


ExpenseTransactionPage.prototype.inputSrcAmount = function(val)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);

	var accCurrObj = getCurrency(selectedAcc.curr_id);
	var destCurrObj = getCurrency(this.content.dest_curr_id);
	var isDiffCurr = (accCurrObj.id != destCurrObj.id);

	var valueBefore = this.content.src_amount_row.value;
	var isValid = isValidValue(valueBefore);
	var fValue = (isValid) ? normalize(valueBefore) : valueBefore;

	var isNewValid = isValidValue(val);
	var fNewValue = (isNewValid) ? normalize(val) : val;
	var fSrcAmountValue = fNewValue;

	this.expectedState.values.src_amount_row.value = val;

	if (fValue !== fNewValue)
	{
		var newResBal = normalize(selectedAcc.balance - fNewValue);
		this.expectedState.values.result_balance_row.value = newResBal.toString();
		this.expectedState.values.src_res_balance_left = formatCurrency(newResBal, this.content.src_curr_id);

		if (isDiffCurr)
		{
			var exchRate;
			var destAmountValue = this.content.dest_amount_row.value;
			var fDestAmountValue = isValidValue(destAmountValue) ? normalize(destAmountValue) : destAmountValue;

			// Calculate exchange rate
			if (fSrcAmountValue == 0)
				exchRate = (fDestAmountValue == 0) ? 1 : 0;
			else
				exchRate = correctExch(fDestAmountValue / fSrcAmountValue);

			var exchSign = destCurrObj.sign + '/' + accCurrObj.sign;
			var backExchSign = accCurrObj.sign + '/' + destCurrObj.sign;

			var exchText = exchSign;

			if (isValidValue(exchRate) && exchRate != 0 && exchRate != 1)
			{
				var invExch = parseFloat((1 / exchRate).toFixed(5));

				exchText += ' ('  + invExch + ' ' + backExchSign + ')';
			}

			setParam(this.expectedState.values,
					{ exchange_row : { value : exchRate.toString(), currSign : exchSign }, exch_left : exchRate + ' ' + exchText });

		}
	}


	ExpenseTransactionPage.parent.inputSrcAmount.apply(this, arguments);
};


ExpenseTransactionPage.prototype.inputDestAmount = function(val)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);

	var valueBefore = this.content.dest_amount_row.value;
	var isValid = isValidValue(valueBefore);
	var fValue = (isValid) ? normalize(valueBefore) : valueBefore;

	var isNewValid = isValidValue(val);
	var fNewValue = (isNewValid) ? normalize(val) : val;

	this.expectedState.values.dest_amount_row.value = val;
	this.expectedState.values.src_amount_row.value = normalize(val).toString();
	this.expectedState.values.dest_amount_left = formatCurrency(fNewValue, this.content.dest_curr_id);

	if (fValue !== fNewValue)
	{
		var newResBal = normalize(selectedAcc.balance - fNewValue);
		this.expectedState.values.src_res_balance_left = formatCurrency(newResBal, this.content.src_curr_id);
	}

	ExpenseTransactionPage.parent.inputDestAmount.apply(this, arguments);
};



ExpenseTransactionPage.prototype.inputResBalance = function(val)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);

	var valueBefore = this.content.result_balance_row.value;
	var isValid = isValidValue(valueBefore);
	var fValue = (isValid) ? normalize(valueBefore) : valueBefore;

	var fNewValue = isValidValue(val) ? normalize(val) : val;

	this.expectedState.values.result_balance_row.value = val;

	this.expectedState.values.src_res_balance_left = formatCurrency(fNewValue, this.content.dest_curr_id);

	if (fValue !== fNewValue)
	{
		var newSrcAmount = normalize(selectedAcc.balance - fNewValue);
		var fmtSrcAmount = formatCurrency(newSrcAmount, this.content.src_curr_id);

		this.expectedState.values.src_amount_row.value = newSrcAmount.toString();
		// Copy value to the destination amount
		this.expectedState.values.dest_amount_left = fmtSrcAmount;
		this.expectedState.values.dest_amount_row.value = newSrcAmount.toString();
	}

	ExpenseTransactionPage.parent.inputResBalance.apply(this, arguments);
};



ExpenseTransactionPage.prototype.inputExchRate = function(val)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);

	var accCurrObj = getCurrency(selectedAcc.curr_id);
	var destCurrObj = getCurrency(this.content.dest_curr_id);
	var isDiffCurr = (accCurrObj.id != destCurrObj.id);

	var valueBefore = this.content.exchange_row.value;
	var fValue = (isValidValue(valueBefore)) ? normalizeExch(valueBefore) : valueBefore;

	var fNewValue = (isValidValue(val)) ? normalizeExch(val) : val;
	var exchRate = fNewValue;

	this.expectedState.values.exchange_row.value = val.toString();

	if (fValue !== fNewValue)
	{
		var exchSign = destCurrObj.sign + '/' + accCurrObj.sign;
		var backExchSign = accCurrObj.sign + '/' + destCurrObj.sign;
		var exchText = exchSign;

		if (isValidValue(exchRate) && exchRate != 0 && exchRate != 1)
		{
			var invExch = parseFloat((1 / exchRate).toFixed(5));
			exchText += ' ('  + invExch + ' ' + backExchSign + ')';
		}

		this.expectedState.values.exch_left = exchRate + ' ' + exchText;

		var srcAmountValue = this.content.src_amount_row.value;
		var isSrcAmountValid = isValidValue(srcAmountValue);
		var fSrcAmountValue = (isSrcAmountValid) ? normalize(srcAmountValue) : srcAmountValue;

		var destAmountValue = this.content.dest_amount_row.value;
		var isDestAmountValid = isValidValue(destAmountValue);
		var fDestAmountValue = (isDestAmountValid) ? normalize(destAmountValue) : destAmountValue;

		if (isSrcAmountValid)
		{
			var newDestAmount = correct(fSrcAmountValue * exchRate);
			this.expectedState.values.dest_amount_row.value = newDestAmount.toString();
			this.expectedState.values.dest_amount_left = formatCurrency(newDestAmount, destCurrObj.id);
		}
		else if (isDestAmountValid)
		{
			var newSrcAmount = correct(fDestAmountValue / exchRate);
			this.expectedState.values.src_amount_row.value = newSrcAmount.toString();
		}

		var newResBal = normalize(selectedAcc.balance - fSrcAmountValue);
		this.expectedState.values.result_balance_row.value = newResBal.toString();
		this.expectedState.values.src_res_balance_left = formatCurrency(newResBal, this.content.src_curr_id);
	}

	ExpenseTransactionPage.parent.inputExchRate.apply(this, arguments);
};


ExpenseTransactionPage.prototype.clickSrcResultBalance = function()
{
	var currState = (this.expectedState && this.expectedState.extra) ? parseInt(this.expectedState.extra.id) : 0;

	if (currState === 0)
		this.setExpectedState(1);
	else if (currState === 2 || currState === 3)
		this.setExpectedState(4);

	ExpenseTransactionPage.parent.clickSrcResultBalance.apply(this, arguments);
};


ExpenseTransactionPage.prototype.checkChangeSrcAccount = function(account_id)
{
	var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);
	var newAcc = idSearch(viewframe.contentWindow.accounts, account_id);
	var fmtBal = formatCurrency(newAcc.balance, newAcc.curr_id);

	if (!selectedAcc || !newAcc || newAcc.id == selectedAcc.id)
		return;

	var accCurrObj = getCurrency(newAcc.curr_id);
	var destCurrObj = getCurrency(this.content.dest_curr_id);
	var isDiffCurr = (accCurrObj.id != destCurrObj.id);

	if (!isDiffCurr && (this.expectedState.extra.id === 2 ||			// Transition 14
						this.expectedState.extra.id === 3))				// Transition 15
	{
		this.setExpectedState(0);
	}
	else if (this.expectedState.extra.id === 4 && !isDiffCurr)			// Transition 11
	{
		this.setExpectedState(1);
	}

	var destAmountValue = this.content.dest_amount_row.value;
	var fDestAmountValue = isValidValue(destAmountValue) ? normalize(destAmountValue) : destAmountValue;

	var fSrcAmountValue, fmtSrcAmount;

	var srcResBalBefore = this.content.result_balance_row.value;
	var isValid = isValidValue(srcResBalBefore);
	var fResBalBefore = isValidValue(srcResBalBefore) ? normalize(srcResBalBefore) : srcResBalBefore;

	var newResBal = normalize(newAcc.balance - fDestAmountValue);
	var fmtResBal = formatCurrency(newResBal, newAcc.curr_id);

	if (newResBal == fResBalBefore)
		newResBal = srcResBalBefore;

	var exchSign;

	if (isDiffCurr && (this.expectedState.extra.id !== 0 && this.expectedState.extra.id !== 1))
	{
		var exchRate;
		var srcAmountValue = this.content.src_amount_row.value;
		fSrcAmountValue = isValidValue(srcAmountValue) ? normalize(srcAmountValue) : srcAmountValue;

		fmtSrcAmount = formatCurrency(fSrcAmountValue, accCurrObj.id);
		fmtDestAmount = formatCurrency(fDestAmountValue, destCurrObj.id);

		if (fSrcAmountValue == 0)
			exchRate = (fDestAmountValue == 0) ? 1 : 0;
		else
			exchRate = correctExch(fDestAmountValue / fSrcAmountValue);

		exchSign = destCurrObj.sign + '/' + accCurrObj.sign;
		var backExchSign = accCurrObj.sign + '/' + destCurrObj.sign;

		var exchText = exchSign;

		if (isValidValue(exchRate) && exchRate != 0 && exchRate != 1)
		{
			var invExch = parseFloat((1 / exchRate).toFixed(5));

			exchText += ' ('  + invExch + ' ' + backExchSign + ')';
		}

		setParam(this.expectedState.values,
					{ source : { tile : { name : newAcc.name, balance : fmtBal } },
								src_amount_row : { label : 'Source amount', currSign : accCurrObj.sign  },
								dest_amount_row : { label : 'Destination amount', currSign : destCurrObj.sign },
								dest_amount_left : fmtDestAmount,
								result_balance_row : { value : newResBal.toString() }, src_res_balance_left : fmtResBal,
								exchange_row : { value : exchRate.toString(), currSign : exchSign }, exch_left : exchRate + ' ' + exchText });
	}
	else
	{
// Currency must be duplicated from source account
		exchSign = accCurrObj.sign + '/' + accCurrObj.sign;

		fSrcAmountValue = fDestAmountValue;
		fmtSrcAmount = formatCurrency(fSrcAmountValue, accCurrObj.id);

		setParam(this.expectedState.values,
					{ source : { tile : { name : newAcc.name, balance : fmtBal } },
								src_amount_row : { value : fSrcAmountValue.toString(), label : 'Amount', currSign : accCurrObj.sign  },
								dest_amount_row : { value : fDestAmountValue.toString(), label : 'Amount', currSign : accCurrObj.sign },
								dest_amount_left : fmtSrcAmount,
								result_balance_row : { value : newResBal.toString() }, src_res_balance_left : fmtResBal,
								exchange_row : { value : '1', currSign : exchSign }, exch_left : '1 ' + exchSign });
	}
};


ExpenseTransactionPage.prototype.changeSrcAccount = function(val)
{
	this.checkChangeSrcAccount(val);

	ExpenseTransactionPage.parent.changeSrcAccount.apply(this, arguments);
};


ExpenseTransactionPage.prototype.changeSrcAccountByPos = function(pos)
{
	this.checkChangeSrcAccount(this.content.source.dropDown.items[pos].id);

	ExpenseTransactionPage.parent.changeSrcAccountByPos.apply(this, arguments);
};


ExpenseTransactionPage.prototype.clickDestAmount = function()
{
	if (this.expectedState.extra.id === 1)		// Transition 3
		this.setExpectedState(0);
	else if (this.expectedState.extra.id === 3 ||		// Transition 16
				this.expectedState.extra.id === 4)		// Transition 7
		this.setExpectedState(2);

	ExpenseTransactionPage.parent.clickDestAmount.apply(this, arguments);
};


ExpenseTransactionPage.prototype.clickExchRate = function()
{
	this.setExpectedState(3);

	ExpenseTransactionPage.parent.clickExchRate.apply(this, arguments);
};


ExpenseTransactionPage.prototype.changeDestCurrency = function(val)
{
	if (this.content.dest_curr_id != val)
	{
		var selectedAcc = idSearch(viewframe.contentWindow.accounts, this.content.source.id);

		if (this.expectedState.extra.id === 0)	// Transition 4
		{
			this.setExpectedState(2, val);
		}
		else if (this.expectedState.extra.id === 2)
		{
			var currObj = getCurrency(val);
			var srcCurrObj = getCurrency(selectedAcc.curr_id);
			var destAmountValue = this.content.dest_amount_row.value;
			var fDestAmountValue = isValidValue(destAmountValue) ? normalize(destAmountValue) : destAmountValue;

			if (val == selectedAcc.curr_id)				// Transition 9
			{
				this.setExpectedState(0, val);
			}
			else
			{
				var exchSign = currObj.sign + '/' + srcCurrObj.sign;
				var backExchSign = srcCurrObj.sign + '/' + currObj.sign;
				var exchText = exchSign;

				var exchValue = this.content.exchange_row.value;
				var exchRate = (isValidValue(exchValue)) ? normalizeExch(exchValue) : exchValue;

				if (isValidValue(exchRate) && exchRate != 0 && exchRate != 1)
				{
					var invExch = parseFloat((1 / exchRate).toFixed(5));

					exchText += ' ('  + invExch + ' ' + backExchSign + ')';
				}

				setParam(this.expectedState.values,
				{ dest_amount_row : { currSign : currObj.sign }, dest_amount_left : formatCurrency(fDestAmountValue, currObj.id),
			 		exchange_row : { currSign : exchSign }, exch_left : exchRate + ' ' + exchText });
			}
		}
	}

	ExpenseTransactionPage.parent.changeDestCurrency.apply(this, arguments);
};
