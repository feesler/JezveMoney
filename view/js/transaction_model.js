function TransactionModel(trans_type, srcCurr, destCurr, person, dType, lastAcc, noAcc)
{
	var self = this;
// Main formula
// S2 = S1 - sa			source account
// da = sa * e
// S2_d = S1_d + da		destination account

	var S1;			// balance before transaction
	var sa;			// source amount
	var da;			// destination amount
	var e;			// exchange rate
	var S2;			// balance after transaction
	var S1_d;		// balance of destination account before transaction
	var S2_d;		// balance of destintation account after transaction

	var fS1, fsa, fda, fe, fS2, fS1_d, fS2_d;	// parsed float values
	var s1valid = false, s2valid = false, davalid = false, evalid = false, savalid = false, s1dvalid = false, s2dvalid = false;

	var type = trans_type;
	var src_curr = srcCurr;
	var dest_curr = destCurr;

	var src_id, dest_id;

	var person_id = person;
	var debtType = dType, lastAcc_id = lastAcc, noAccount = noAcc;

	var changedCallback = [];


	// Calculate result balance of source by initial balance and source amount
	function f1()
	{
		if (!self.isExpense() && !self.isTransfer() && !self.isDebt())
			return;

		S2 = fS1 - fsa;

		fS2 = S2 = correct(S2);

		s2valid = isValidValue(S2);

		notifyChanged('src_resbal', fS2);
	}


	// Calculate result balance of destination by initial balance and destination amount
	function f1_d()
	{
		if (!self.isIncome() && !self.isTransfer() && !self.isDebt())
			return;

		S2_d = fS1_d + fda;

		fS2_d = S2_d = correct(S2_d);

		s2dvalid = isValidValue(S2_d);

		notifyChanged('dest_resbal', fS2_d);
	}


	// Calculate destination amount by source amount and exchange rate
	function f2()
	{
		fda = da = correct(fsa * fe);

		davalid = isValidValue(da);

		notifyChanged('dest_amount', fda);
	}


	// Calculate source amount by initial and result balance
	function f3()
	{
		sa = fS1 - fS2;

		sa = correct(sa);

		fsa = sa;

		savalid = isValidValue(sa);

		notifyChanged('src_amount', fsa);
	}


	// Calculate destination amount by initial and result balance
	function f3_d()
	{
		fda = da = correct(fS2_d - fS1_d);

		davalid = isValidValue(da);

		notifyChanged('dest_amount', fda);
	}


	// Calculate source amount by destination amount and exchange rate
	function f4()
	{
		fsa = sa = correct(fda / fe);

		savalid = isValidValue(sa);

		notifyChanged('src_amount', fsa);
	}


	// Calculate exchange rate by destination and source amount
	function f5()
	{
		if (fsa == 0)
			fe = e = (fda == 0) ? 1 : 0;
		else
			fe = e = correctExch(fda / fsa);

		evalid = isValidValue(e);

		notifyChanged('exchrate', fe);
	}


	// Source amount field input event handler
	function onSrcAmountUpdate(value)
	{
		if (!s1valid && !s1dvalid)
			return;

		if (self.isDiff())
		{
			if (davalid)
			{
				if (self.isIncome() || self.isTransfer() || (self.isDebt() && !debtType))
					f1_d();			// calculate S2_d
			}
			if (savalid)
			{
				if (self.isExpense() || self.isTransfer() || (self.isDebt() && debtType))
					f1();				// calculate S2
			}

			if (davalid)
				f5();		// calculate e
		}
		else
		{
			f2();		// calculate da
			if (self.isIncome())
			{
				f1_d();			// calculate S2_d
			}
			else if (self.isTransfer() || self.isDebt())
			{
				f1_d();			// calculate S2_d
				f1();				// calculate S2
			}
			else
				f1();				// calculate S2
		}
	}


	// Destination amount field input event handler
	function onDestAmountUpdate(value)
	{
		if (!s1valid && !s1dvalid)
			return;

		if (!self.isDiff())
		{
			f4();		// calculate sa
		}

		if (self.isIncome() || self.isTransfer() || (self.isDebt() && debtType))
			f1_d();		// calculate S2_d
		if (self.isExpense() || self.isTransfer() || (self.isDebt() && !debtType))
			f1();			// calculate S2

		if (savalid)
			f5();		// calculate e
	}


	// Exchange rate field input event handler
	function onExchangeUpdate(value)
	{
		if (!s1valid && !s1dvalid)
			return;

		if (savalid)
		{
			f2();		// calculate da
			f1();		// calculate S2
		}
		else if (davalid)
			f4();		// calculate sa
	}


	//
	function onInitBalanceUpdate(value)
	{
		if (savalid)
		{
			f1();		// calculate S2
		}
		else
		{
			setValue('src_resbal', fS1);
			notifyChanged('src_resbal', fS1);
		}
	}


	//
	function onInitBalanceDestUpdate(value)
	{
		if (savalid)
		{
			f1_d();		// calculate S2_d
		}
		else
		{
			setValue('dest_resbal', fS1_d);
			notifyChanged('dest_resbal', fS1_d);
		}
	}


	// Result balance field input event handler
	function onResBalanceUpdate(value)
	{
		if (!s1valid && !s1dvalid)
			return;

		if (self.isDebt())
		{
			if (debtType)
			{
				f3();			// calculate da
				f4();			// calculate sa and S2_d
			}
			else
			{
				f3_d();		// calculate sa
				f2();			// calculate da
				f1();			// calculate S2
			}
		}
		else
		{
			f3();					// calculate da
			if (evalid)
				f4();				// calculate sa
			else if (savalid)
				f5();				// calculate e
		}
	}


	// Result balance field input event handler
	function onResBalanceDestUpdate(value)
	{
		if (!s1dvalid)
			return;
	
		if (self.isTransfer() || self.isIncome())
		{
			f3_d();		// calculate sa
			f2();			// calculate da
			f1();			// calculate S2
		}
		else if (self.isDebt())
		{
			if (debtType)
			{
				f3_d();		// calculate sa
				f2();			// calculate da
				f1();			// calculate S2
			}
			else
			{
				f3();			// calculate da
				f4();			// calculate sa and S2_d
			}
		}
	}


	function onSrcAccUpdate(value)
	{
		var acc = getAccount(value);

		if (!acc)
			return;

		updateValue('src_curr', acc[1]);
		notifyChanged('src_curr', acc[1]);

		updateValue('src_initbal', acc[3]);
		notifyChanged('src_initbal', acc[3]);
	}


	function onDestAccUpdate(value)
	{
		var acc = getAccount(value);

		if (!acc)
			return;

		updateValue('dest_curr', acc[1]);
		notifyChanged('dest_curr', acc[1]);

		updateValue('dest_initbal', acc[3]);
		notifyChanged('dest_initbal', acc[3]);
	}


	function onSrcCurrUpdate(value)
	{
		if (!self.isDiff())
		{
			fe = e = 1;
			evalid = true;
			notifyChanged('exchrate', fsa);

			if (savalid)
			{
				f2();				// calculate da
				f1_d();			// calculate S2_d
			}
		}
	}


	function onDestCurrUpdate(value)
	{
		if (!self.isDiff())
		{
			fe = e = 1;
			evalid = true;
			notifyChanged('exchrate', fsa);

			if (davalid)
			{
				f4();				// calculate sa
				f1();				// calculate S2
			}
		}
	}


	function onPersonUpdate(value)
	{
		var balance = getCurPersonBalance((debtType) ? src_curr : dest_curr);

		if (debtType)
			updateValue('src_initbal', balance);
		else
			updateValue('dest_initbal', balance);
	}


	function onNoAccUpdate(value)
	{
	}


	function onDebtTypeUpdate(value)
	{
		var tmp;

		// Swap source and destination
		tmp = src_id, src_id = dest_id, dest_id = tmp;

		tmp = fS1;
		setValue('src_initbal', fS1_d);
		setValue('dest_initbal', tmp);

		tmp = fS2;
		setValue('src_resbal', fS2_d);
		setValue('dest_resbal', tmp);

		if (savalid)
		{
			f2();				// calculate da
			f1_d();			// calculate S2_d
		}
		else
		{
			setValue('src_resbal', fS1);
			notifyChanged('src_resbal', fS1);
		}

		if (davalid)
		{
			f4();				// calculate sa
			f1();				// calculate S2
		}
		else
		{
			setValue('dest_resbal', fS1_d);
			notifyChanged('dest_resbal', fS1_d);
		}
	}


	function onLastAccUpdate(value)
	{
	}


	function notifyChanged(item, value)
	{
		var callback = changedCallback[item];

		if (isFunction(callback))
			callback(value);
	}


	function setValue(item, value)
	{
		if (item == 'src_amount')
		{
			sa = value;
			savalid = isValidValue(sa);
			fsa = (savalid) ? normalize(sa) : sa;
		}
		else if (item == 'dest_amount')
		{
			da = value;
			davalid = isValidValue(da);
			fda = (davalid) ? normalize(da) : da;
		}
		else if (item == 'exchrate')
		{
			e = value;
			evalid = isValidValue(e);
			fe = (evalid) ? normalizeExch(e) : e;
		}
		else if (item == 'src_initbal')
		{
			S1 = value;
			s1valid = isValidValue(S1);
			fS1 = (s1valid) ? normalize(S1) : S1;
		}
		else if (item == 'dest_initbal')
		{
			S1_d = value;
			s1dvalid = isValidValue(S1_d);
			fS1_d = (s1dvalid) ? normalize(S1_d) : S1_d;
		}
		else if (item == 'src_resbal')
		{
			S2 = value;
			s2valid = isValidValue(S2);
			fS2 = (s2valid) ? normalize(S2) : S2;
		}
		else if (item == 'dest_resbal')
		{
			S2_d = value;
			s2dvalid = isValidValue(S2_d);
			fS2_d = (s2dvalid) ? normalize(S2_d) : S2_d;
		}
		else if (item == 'src_id')
		{
			src_id = parseInt(value);
		}
		else if (item == 'dest_id')
		{
			dest_id = parseInt(value);
		}
		else if (item == 'src_curr')
		{
			src_curr = parseInt(value);
		}
		else if (item == 'dest_curr')
		{
			dest_curr = parseInt(value);
		}
		else if (item == 'person_id')
		{
			person_id = parseInt(value);
		}
		else if (item == 'debt_type')
		{
			debtType = !!value;
		}
		else if (item == 'no_account')
		{
			noAccount = !!value;
		}
		else if (item == 'last_acc')
		{
			lastAcc_id = parseInt(value);
		}
	}


	function updateValue(item, value)
	{
		setValue(item, value);

		if (item == 'src_amount')
			onSrcAmountUpdate(value);
		else if (item == 'dest_amount')
			onDestAmountUpdate(value);
		else if (item == 'exchrate')
			onExchangeUpdate(value);
		else if (item == 'src_initbal')
			onInitBalanceUpdate(value);
		else if (item == 'dest_initbal')
			onInitBalanceDestUpdate(value);
		else if (item == 'src_resbal')
			onResBalanceUpdate(value);
		else if (item == 'dest_resbal')
			onResBalanceDestUpdate(value);
		else if (item == 'src_id')
			onSrcAccUpdate(value);
		else if (item == 'dest_id')
			onDestAccUpdate(value);
		else if (item == 'src_curr')
			onSrcCurrUpdate(value);
		else if (item == 'dest_curr')
			onDestCurrUpdate(value);
		else if (item == 'person_id')
			onPersonUpdate(value);
		else if (item == 'no_account')
			onNoAccUpdate(value);
		else if (item == 'debt_type')
			onDebtTypeUpdate(value);
		else if (item == 'last_acc')
			onLastAccUpdate(value);
	}


	// Public methods

	this.isExpense = function()
	{
		return (type == 1);
	}


	this.isIncome = function()
	{
		return (type == 2);
	}


	this.isTransfer = function()
	{
		return (type == 3);
	}


	this.isDebt = function()
	{
		return (type == 4);
	}


	this.srcAcc = function()
	{
		return src_id;
	}


	this.destAcc = function()
	{
		return dest_id;
	}


	this.srcCurr = function()
	{
		return src_curr;
	}


	this.destCurr = function()
	{
		return dest_curr;
	}


	this.exchRate = function()
	{
		return fe;
	}


	this.resBal = function()
	{
		return fS2;
	}


	this.resBalDest = function()
	{
		return fS2_d;
	}


	this.debtType = function()
	{
		return debtType;
	}


	this.noAccount = function()
	{
		return noAccount;
	}


	this.lastAcc_id = function()
	{
		return lastAcc_id;
	}


	// Check source and destination currencies is different
	this.isDiff = function()
	{
			return (src_curr != dest_curr);
	}


	this.subscribe = function(item, callback)
	{
		changedCallback[item] = callback;
	},


	// Set value without update notification
	this.set = function(item, value)
	{
		setValue(item, value);
	},


	// Set value with update notification
	this.update = function(item, value)
	{
		updateValue(item, value);
	}
}
