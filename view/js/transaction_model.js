function TransactionModel(trans_type, srcCurr, destCurr)
{
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

	var changedCallback = [];


	// Calculate result balance of source by initial balance and source amount
	function f1()
	{
		if (!expense() && !transfer() && !debt())
			return;

		S2 = fS1 - fsa;

		fS2 = S2 = correct(S2);

		s2valid = isValidValue(S2);

		notifyChanged('src_resbal', fS2);
	}


	// Calculate result balance of destination by initial balance and destination amount
	function f1_d()
	{
		if (!income() && !transfer() && !debt())
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

		if (isDiffCurr())
		{
			if (davalid)
			{
				if (income() || transfer() || (debt() && !debtType))
					f1_d();			// calculate S2_d
			}
			if (savalid)
			{
				if (expense() || transfer() || (debt() && debtType))
					f1();				// calculate S2
			}

			if (davalid)
				f5();		// calculate e
		}
		else
		{
			f2();		// calculate da
			if (income())
			{
				f1_d();			// calculate S2_d
			}
			else if (transfer() || debt())
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

		if (!isDiffCurr())
		{
			f4();		// calculate sa
		}

		if (income() || transfer() || (debt() && debtType))
			f1_d();		// calculate S2_d
		if (expense() || transfer() || (debt() && !debtType))
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


	// Result balance field input event handler
	function onResBalanceUpdate(value)
	{
		if (!s1valid && !s1dvalid)
			return;

		if (debt())
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
	
		if (transfer() || income())
		{
			f3_d();		// calculate sa
			f2();			// calculate da
			f1();			// calculate S2
		}
		else if (debt())
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
		else if (item == 'src_resbal')
			onResBalanceUpdate(value);
		else if (item == 'dest_resbal')
			onResBalanceDestUpdate(value);
	}


	function isDiffCurr()
	{
		return (src_curr != dest_curr);
	}


	function expense()
	{
		return (type == 1);
	}


	function income()
	{
		return (type == 2);
	}


	function transfer()
	{
		return (type == 3);
	}


	function debt()
	{
		return (type == 4);
	}

	return {
		isExpense : function(){ return expense(); },
		isIncome : function(){ return income(); },
		isTransfer : function(){ return transfer(); },
		isDebt : function(){ return debt(); },

		srcCurr : function(){ return src_curr; },
		destCurr : function(){ return dest_curr; },

		// Check source and destination currencies is different
		isDiff : function()
		{
			return isDiffCurr();
		},


		subscribe : function(item, callback)
		{
			changedCallback[item] = callback;
		},


		// Set value without update notification
		set : function(item, value)
		{
			setValue(item, value);
		},


		// Set value with update notification
		update : function(item, value)
		{
			updateValue(item, value);
		},
	};
}
