var S1;		// balance before transaction
var a;		// amount in currency of transaction
var d;		// charge off/receipt in currency of account
var e;		// exchange rate
var S2;		// balance after transaction

var fS1, fa, fd, fe, fS2;	// parsed float values
var s1valid, s2valid, dvalid, evalid, avalid;

// transfer only
var S1_d;		// balance of destination account before transaction
var S2_d;		// balance of destintation account after transaction

var fS1_d, fS2_d;
var s1dvalid, s2dvalid;

// Main formula
// S2 = S1 - d			for expense/transfer
// S2 = S1 + d			for income
// d = a * e
// S2_d = S1_d + a		for transfer


var submitStarted = false;


// Check current transaction is income
function isIncome()
{
	return (trans_type == 2 || (trans_type == 4 && typeof(debtType) != "undefined" && debtType));
}


// Check current transaction is transfer
function isTransfer()
{
	return (trans_type == 3);
}


// Correct calculated value
function correct(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(val).toFixed(prec));
}


// Correct calculated exchange rate value
function correctExch(val)
{
	return correct(val, 5);
}


// Calculate result balance by initial and charge off/receipt
function f1()
{
	if (isIncome())
		S2 = fS1 + fd;
	else
		S2 = fS1 - fd;

	if (edit_mode)
		S2 += (isIncome()) ? -transaction.charge : transaction.charge;

	S2 = correct(S2);

	fS2 = S2;

	if (isTransfer())
	{
		S2_d = fS1_d + fa;
		S2_d = correct(S2_d);
		fS2_d = S2_d;
	}
}


// Calculate charge off/receipt amount by transaction amount and exchange rate
function f2()
{
	d = fa * fe;

	d = correct(d);

	fd = d;
}


// Calculate charge off/receipt amount by initial and result balance
function f3()
{
	if (isIncome())
		d = fS2 - fS1;
	else
		d = fS1 - fS2;

	d = correct(d);

	fd = d;
}


// Calculate amount amount by initial and result balance of destination account
function f3_d()
{
	a = fS2_d - fS1_d;

	a = correct(a);

	fa = a;
}


// Calculate transaction amount by charge off/receipt and exchange rate
function f4()
{
	a = fd / fe;

	a = correct(a);

	fa = a;

	if (isTransfer())
	{
		S2_d = fS1_d + fa;
		S2_d = correct(S2_d);
		fS2_d = S2_d;
	}
}


// Calculate exchange rate by charge off/receipt and transaction amount
function f5()
{
	e = fd / fa;

	e = correctExch(e);

	fe = e;
}


// Return sign of specified currency
function getCurrencySign(curr_id)
{
	var currSign = '';

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currSign = curr[2];

		return (curr[0] == curr_id);
	});

	return currSign;
}


// Return sign format of specified currency(before or after value)
function getCurrencyFormat(curr_id)
{
	var currFmt = false;

	currency.some(function(curr)
	{
		if (curr[0] == curr_id)
			currFmt = curr[3];

		return (curr[0] == curr_id);
	});

	return currFmt;
}


// Return currency id of specified account
function getCurrencyOfAccount(account_id)
{
	var curr_id = '';

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			curr_id = acc[1];

		return (acc[0] == account_id);
	});

	return curr_id;
}


// Return balance of specified account
function getBalanceOfAccount(account_id)
{
	var balance = 0;

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			balance = acc[3];

		return (acc[0] == account_id);
	});

	return balance;
}


// Return name of specified account
function getNameOfAccount(account_id)
{
	var name = '';

	accounts.some(function(acc)
	{
		if (acc[0] == account_id)
			name = acc[4];

		return (acc[0] == account_id);
	});

	return name;
}


// Set currency sign for amount or charge field
function setSign(isAmount, curr_id)
{
	var signobj = ge((isAmount=== true) ? 'amountsign' : 'chargesign');
	if (signobj)
		signobj.innerHTML = getCurrencySign(curr_id);
}


// Spend/Income transaction event handler
function onSubmit(frm)
{
	var srcid, destid, amount, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	amount = ge('amount');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || (!srcid && !destid) || !amount || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Edit transaction submit event handler
function onEditTransSubmit(frm)
{
	var srcid, destid, amount, trdate, submitbtn;

	if (submitStarted)
		return false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	amount = ge('amount');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || (!srcid && !destid) || !amount || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Update exchange rate and result balance values
function updateExchAndRes()
{
	getValues();
	if (isValidValue(d) && isValidValue(a))
	{
		f5();
		f1();
		setValues();
	}
}


// Change account event handler
function onChangeAcc()
{
	var srcid, destid, amount, transcurr, chargeoff, exchange, exchrate, exchrate_l, exchrate_b, charge;
	var sync = false;

	srcid = ge('src_id');
	destid = ge('dest_id');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');
	exchrate_b = ge('exchrate_b');
	charge = ge('charge');
	if ((!srcid && !destid) || !amount || !transcurr  || !chargeoff || !exchange || !exchrate || !exchrate_l || !exchrate_b || !charge)
		return false;

	if (trans_curr == trans_acc_curr)				// currency of transaction is the same as currency of account
		sync = true;

	trans_acc_curr = getCurrencyOfAccount(selectedValue(srcid ? srcid : destid));
	if (sync)
		selectByValue(transcurr, trans_acc_curr);	// update currency of transaction

	trans_curr = selectedValue(transcurr);

	// hide charge and exchange rate if new currencies is the same
	if (trans_curr == trans_acc_curr)
	{
		chargeoff.style.display = 'none';
		exchange.style.display = 'none';
		exchrate.value = 1;
		exchrate_l.innerHTML = '1';
		exchrate_b.firstElementChild.innerHTML = '1';
		charge.value = amount.value;
	}

	updateExchAndRes();

	setSign(false, trans_acc_curr);
	setSign(true, trans_curr);

	if (isIncome())
		setTileAccount('dest_tile', selectedValue(destid));
	else
		setTileAccount('source_tile', selectedValue(srcid));
}


// Show list of currencies
function showCurrList()
{
	var transcurr, ancurrbtn;

	if (isTransfer())
		return;

	curr_block = ge('curr_block');
	ancurrbtn = ge('ancurrbtn');
	if (!curr_block || !ancurrbtn)
		return;

	show(curr_block, true);
	show(ancurrbtn, false);
}


// Check selected currencies is different
function isDiffCurr()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return false;

	return (getCurrencyOfAccount(selectedValue(src)) != getCurrencyOfAccount(selectedValue(dest)));
}


// Transfer transaction submit event handler
function onTransferSubmit(frm)
{
	var amount, charge, exchrate, trdate;
	var submitbtn;

	if (submitStarted)
		return false;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	trdate = ge('date');
	submitbtn = ge('submitbtn');
	if (!frm || !amount || !charge || !exchrate || !trdate || !submitbtn)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	if (isDiffCurr() && (!charge.value || !charge.value.length || !isNum(fixFloat(charge.value))))
	{
		alert('Please input correct charge off.');
		return false;
	}

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	amount.value = fixFloat(amount.value);
	charge.value = fixFloat(charge.value);
	exchrate.value = fixFloat(exchrate.value);

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


//
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var isBefore = getCurrencyFormat(curr_id);
	var sign = getCurrencySign(curr_id);

	if (isBefore)
		return sign + ' ' + formatValue(val);
	else
		return formatValue(val) + ' ' + sign;
}


// Format balance of account value with currency
function formatAccoutBalance(acc_id)
{
	return formatCurrency(getBalanceOfAccount(acc_id), getCurrencyOfAccount(acc_id));
}


// Set source tile to the specified account
function setTileAccount(tile_id, acc_id)
{
	var tileObj, src, balanceEl, nameEl;

	if (!tile_id || !acc_id)
		return;

	tileObj = ge(tile_id);
	if (!tileObj)
		return;

	balanceEl = tileObj.firstElementChild.firstElementChild.firstElementChild;
	balanceEl.innerHTML = formatAccoutBalance(acc_id);

	nameEl = balanceEl.nextElementSibling;
	nameEl.innerHTML = getNameOfAccount(acc_id);
}


// Update controls of transfer transaction form
function updControls()
{
	var src, dest, amount, charge, exchrate, exchrate_l, exchrate_b, chargeoff, exchange, resbal, dstyle, transcurr;

	src = ge('src_id');
	dest = ge('dest_id');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');
	exchrate_b = ge('exchrate_b');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	resbal = ge('resbal');
	if (!src || !dest || !amount || !charge || !exchrate || !exchrate_l || !chargeoff || !exchange || !resbal)
		return;

	exchange.value = '';
	if (isDiffCurr())
	{
		dstyle = '';
		charge.value = '';
		resbal.value = '';
	}
	else
	{
		dstyle = 'none';
		charge.value = amount.value;
		exchrate.value = 1;
		exchrate_l.innerHTML = '1';
		exchrate_b.firstElementChild.innerHTML = '1';
		resbal.value = getBalanceOfAccount(selectedValue(src)) - amount.value;
	}

	chargeoff.style.display = dstyle;
	exchange.style.display = dstyle;

	amountCurr = getCurrencyOfAccount(selectedValue(dest));
	chargeCurr = getCurrencyOfAccount(selectedValue(src));

	if (isTransfer())
	{
		transcurr = ge('transcurr');
		if (transcurr)
			transcurr.value = amountCurr;
	}

	setSign(false, chargeCurr);
	setSign(true, amountCurr);

	setTileAccount('source_tile', selectedValue(src));
	setTileAccount('dest_tile', selectedValue(dest));

	getValues();
	setExchangeComment();
}


// Source account change event handler
function onChangeSource()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');

	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (dest.selectedIndex == 0)
			dest.selectedIndex = accounts.length - 1;
		else
			dest.selectedIndex--;
	}

	updControls();
}


// Destination account change event handler
function onChangeDest()
{
	var src, dest;

	src = ge('src_id');
	dest = ge('dest_id');
	if (!src || !dest)
		return;

	if (src.selectedIndex == dest.selectedIndex)
	{
		if (src.selectedIndex == accounts.length - 1)
			src.selectedIndex = 0;
		else
			src.selectedIndex++;
	}

	updControls();
}


// 
function onInput(obj)
{
	var amount, charge, exchrate;

	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');

	if (!obj || !amount || !charge || !exchrate || !exchrate_l)
		return false;

	if (obj == amount)
	{
		if (!isDiffCurr())
		{
			charge.value = amount.value;
		}
	}
	else if (obj == charge)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && charge.value && isNum(fixFloat(charge.value)))
		{
			exchrate.value = fixFloat(charge.value) / fixFloat(amount.value);
			exchrate_l.innerHTML = exchrate.value;
		}
	}
	else if (obj == exchrate)
	{
		if (amount.value && isNum(fixFloat(amount.value)) && exchrate.value && isNum(fixFloat(exchrate.value)))
		{
			charge.value = fixFloat(exchrate.value) * fixFloat(amount.value);
		}
	}

	return true;
}


// Set exchange rate comment
function setExchangeComment()
{
	var exchcomm, exchrate_b, transcurr, accid, taccid;
	var chargeSign, amountSign;
	var invExch;

	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	if (trans_type == 1 || trans_type == 2)
		transcurr = ge('transcurr');
	accid = ge((trans_type == 2) ? 'dest_id' : (trans_type == 4) ? 'accid' : 'src_id');
	if (isTransfer())
		taccid = ge('dest_id');
	if (!exchcomm || !exchrate_b || !accid || (!transcurr && !taccid))
		return;

	if (fe == 1.0 || fe == 0.0 || e == '')
	{
		chargeSign = getCurrencySign(getCurrencyOfAccount(selectedValue(accid)));
		if (isTransfer())
			amountSign = getCurrencySign(getCurrencyOfAccount(selectedValue(taccid)));
		else
			amountSign = getCurrencySign(selectedValue(transcurr));

		exchcomm.innerHTML = chargeSign + '/' + amountSign;
	}
	else
	{
		if ((transcurr && transcurr.selectedIndex == -1) || (taccid && taccid.selectedIndex == -1) || accid.selectedIndex == -1)
			return;

		chargeSign = getCurrencySign(getCurrencyOfAccount(selectedValue(accid)));
		if (isTransfer())
			amountSign = getCurrencySign(getCurrencyOfAccount(selectedValue(taccid)));
		else
			amountSign = getCurrencySign(selectedValue(transcurr));

		invExch = parseFloat((1 / fe).toFixed(5));

		exchcomm.innerHTML = chargeSign + '/' + amountSign + ' ('  + invExch + ' ' + amountSign + '/' + chargeSign + ')';
	}

	exchrate_b.firstElementChild.innerHTML = fe + ' ' + exchcomm.innerHTML;
}


// Normalize monetary value from string
function normalize(val, prec)
{
	prec = prec || 2;

	return parseFloat(parseFloat(fixFloat(val)).toFixed(prec));
}


// Normalize exchange rate value from string
function normalizeExch(val)
{
	return normalize(val, 5);
}


// Check value is valid
function isValidValue(val)
{
	return (val && val !== '');
}


// Get values of transaction from input fields
function getValues()
{
	var accid, amount, charge, exchrate, resbal;

	accid = ge((trans_type == 2) ? 'dest_id' : (trans_type == 4) ? 'accid' : 'src_id');
	amount = ge('amount');
	charge = ge('charge');
	exchrate = ge('exchrate');
	resbal = ge('resbal');
	if (!accid || !amount || !charge || !exchrate || !resbal)
		return;

	S1 = getBalanceOfAccount(selectedValue(accid));
	if (isTransfer())
	{
		S1_d = getBalanceOfAccount(selectedValue(ge('dest_id')));		// TODO: fix here
		S2_d = ge('resbal_d').value;
	}
	a = amount.value;
	d = charge.value;
	e = exchrate.value;
	S2 = resbal.value;

	s1valid = isValidValue(S1);
	s2valid = isValidValue(S2);
	if (isTransfer())
	{
		s1dvalid = isValidValue(S1_d);
		s2dvalid = isValidValue(S2_d);
	}
	dvalid = isValidValue(d);
	evalid = isValidValue(e);
	avalid = isValidValue(a);

	fS1 = (s1valid) ? normalize(S1) : S1;
	fS2 = (s2valid) ? normalize(S2) : S2;
	if (isTransfer())
	{
		fS1_d = (s1dvalid) ? normalize(S1_d) : S1_d;
		fS2_d = (s2dvalid) ? normalize(S2_d) : S2_d;
	}
	fd = (dvalid) ? normalize(d) : d;
	fe = (evalid) ? normalizeExch(e) : e;
	fa = (avalid) ? normalize(a) : a;
}


// Set value of input fields
function setValues()
{
	var amount, amount_l, amount_b, charge, charge_l, exchrate, exchrate_l, exchcomm, exchrate_b, resbal, resbal_l;

	amount = ge('amount');
	amount_l = ge('amount_l');
	amount_b = ge('amount_b');
	charge = ge('charge');
	charge_l = ge('charge_l');
	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');
	exchcomm = ge('exchcomm');
	exchrate_b = ge('exchrate_b');
	resbal = ge('resbal');
	resbal_l = ge('resbal_l');
	resbal_b = ge('resbal_b');
	if (!amount || !amount_l || !amount_b || !charge || !charge_l || !exchrate || !exchrate_l || !exchrate_b || !resbal || !resbal_l || !resbal_b)
		return;

	amount.value = a;
	amount_l.innerHTML = a;
	amount_b.firstElementChild.innerHTML = formatCurrency((isValidValue(a) ? a : 0), selectedValue(ge('transcurr')));

	charge.value = d;
	charge_l.innerHTML = d;
	exchrate.value = e;
	exchrate_l.innerHTML = e;
	exchrate_b.firstElementChild.innerHTML = e + ' ' + exchcomm.innerHTML;

	resbal.value = S2;
	resbal_l.innerHTML = S2;
	resbal_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2) ? S2 : S1, getCurrencyOfAccount(selectedValue(ge('src_id'))));

	if (isTransfer())
	{
		var resbal_d_b = ge('resbal_d_b');
		if (!resbal_d_b)
			return;

		resbal_d_b.firstElementChild.innerHTML = formatCurrency(isValidValue(S2_d) ? S2_d : S1_d, getCurrencyOfAccount(selectedValue(ge('dest_id'))));
	}
}


// Amount field input event handler
function onAmountInput()
{
	if (!s1valid)
		return;

	if (evalid)
	{
		f2();		// calculate d
		f1();		// calculate S2
	}
	else if (dvalid)
		f5();		// calculate e

	setExchangeComment();
}


// Charge/receipt field input event handler
function onChargeInput()
{
	if (!s1valid)
		return;

	f1();			// calculate S2
	if (avalid)
		f5();		// calculate e
	else if (evalid)
		f4();		// calculate a

	setExchangeComment();
}


// Exchange rate field input event handler
function onExchangeInput()
{
	if (!s1valid)
		return;

	if (avalid)
	{
		f2();		// calculate d
		f1();		// calculate S2
	}
	else if (dvalid)
		f4();		// calculate a

	setExchangeComment();
}


// Result balance field input event handler
function onResBalanceInput()
{
	if (!s1valid)
		return;

	f3();		// calculate d
	if (evalid)
		f4();				// calculate a
	else if (avalid)
		f5();				// calculate e
}


// Result balance field input event handler
function onResBalanceDestInput()
{
	if (!s1dvalid)
		return;

	f3_d();		// calculate a
	f2();			// calculate d
	f1();			// calculate S1
}


// Field input event handler
function onFInput(obj)
{
	getValues();

	if (obj.id == 'amount')
		onAmountInput();
	else if (obj.id == 'charge')
		onChargeInput();
	else if (obj.id == 'exchrate')
		onExchangeInput();
	else if (obj.id == 'resbal')
		onResBalanceInput();
	else if (obj.id == 'resbal_d' && isTransfer())
		onResBalanceDestInput();

	setValues();

	return true;
}


// Currency of transaction change event handler
function onChangeTransCurr()
{
	var accid, amount, transcurr, chargeoff, exchange, exchrate, exchrate_l, exchrate_b, charge;
	var amountCurr, chargeCurr;

	accid = ge((trans_type == 2) ? 'dest_id' : (trans_type == 4) ? 'accid' : 'src_id');
	amount = ge('amount');
	transcurr = ge('transcurr');
	chargeoff = ge('chargeoff');
	exchange = ge('exchange');
	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');
	charge = ge('charge');
	if (!accid || !amount || !transcurr || !chargeoff || !exchange || !exchrate || !exchrate_l || !charge)
		return;
	if (transcurr.selectedIndex == -1 || accid.selectedIndex == -1)
		return

	amountCurr = selectedValue(transcurr);
	chargeCurr = getCurrencyOfAccount(selectedValue(accid));

	if (amountCurr == chargeCurr)
	{
		chargeoff.style.display = 'none';
		exchange.style.display = 'none';
		exchrate.value = 1;
		exchrate_l.innerHTML = '1';
		exchrate_b.firstElementChild.innerHTML = '1';
		charge.value = amount.value;

		updateExchAndRes();
	}
	else
	{
		chargeoff.style.display = '';
		exchange.style.display = '';
	}

	trans_curr = amountCurr;

	setSign(false, chargeCurr);
	setSign(true, amountCurr);

	getValues();
	setExchangeComment();
}


// Debt operation type change event handler
function onChangeDebtOp()
{
	var acclbl, debtgive, debttake;

	acclbl = ge('acclbl');
	debtgive = ge('debtgive');
	debttake = ge('debttake');
	if (!acclbl || !debtgive || !debttake)
		return;

	debtType = debtgive.checked;

	acclbl.innerHTML = (debtType) ? 'Destination account' : 'Source account';

	updateExchAndRes();
}


// Show controls to add new person
function togglePerson()
{
	var personname, personid, personsel, personbtn;

	personname = ge('personname');
	personid = ge('personid');
	personsel = ge('personsel');
	personbtn = ge('personbtn');
	if (!personbtn || !personname || !personid || !personsel)
		return;

	if (personname.type == 'hidden')		// select mode
	{
		personbtn.value = 'select';

		personid.value = 0;
		personname.type = 'text';
		personname.value = '';

		show(personname, true);
		show(personsel, false);
	}
	else if (personname.type == 'text')		// new person mode
	{
		personbtn.value = 'new';

		personname.value = selectedText(personsel);
		personid.value = personsel.selectedIndex;

		show(personname, false);
		show(personsel, true);

		personname.type = 'hidden';
	}
}


// Person select event handler
function onPersonSel(obj)
{
	var personname, personid;

	personname = ge('personname');
	personid = ge('personid');
	if (!personname || !personid)
		return;
	if (!obj || typeof(obj.selectedIndex) == "undefined" || obj.selectedIndex == -1)
		return;

	personname.value = selectedText(obj);
	personid.value = selectedValue(obj);
}


// New debt form submit event handler
function onDebtSubmit(frm)
{
	var accid, amount, trdate, personname;
	var submitbtn;

	if (submitStarted)
		return false;

	personname = ge('personname');
	submitbtn = ge('submitbtn');
	if (!frm || !personname || !submitbtn)
		return false;

	if (!personname.value || personname.value.length < 1)
	{
		if (personname.type == 'hidden')
			alert('Please select person.');
		else
			alert('Please type name of person.');
		return false;
	}

	accid = ge('accid');
	amount = ge('amount');
	trdate = ge('date');
	if (!frm || !accid || !amount || !trdate)
		return false;

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	if (!amount.value || !amount.value.length || !isNum(fixFloat(amount.value)))
	{
		alert('Please input correct amount.');
		return false;
	}

	amount.value = fixFloat(amount.value);

	if (!checkDate(trdate.value))
	{
		alert('Please input correct date.');
		return false;
	}

	submitStarted = true;
	enable(submitbtn, false);

	return true;
}


// Show comment field
function showComment()
{
	var comm_btn, comment_block, comm;

	comm_btn = ge('comm_btn');
	comment_block = ge('comment_block');
	comm = ge('comm');
	if (!comm_btn || !comment_block || !comm)
		return;

	show(comm_btn, false);
	show(comment_block, true);
	comm.focus();
}


// Show input control or static block for amount value
function amountSwitch(showInput)
{
	var amount, amount_l;

	amount = ge('amount');
	amount_l = ge('amount_l');
	if (!amount_l)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(amount_l.parentNode, false);
		amount_l.parentNode.parentNode.className = '';
		show(amount, true);

		show('src_amount_left', false);
		show('amount_row', true);

		amount.focus();
		resBalanceSwitch(false);
	}
	else
	{
		show('amount_row', false);
		show('src_amount_left', true);

		show(amount_l.parentNode, true);
		amount_l.parentNode.parentNode.className = 'dashed_static';

		show(amount, false);
	}
}


// Show input control or static block for charge value
function chargeSwitch(showInput)
{
	var charge, charge_l;

	charge = ge('charge');
	charge_l = ge('charge_l');
	if (!charge_l)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(charge_l.parentNode, false);
		charge_l.parentNode.parentNode.className = '';
		show(charge, true);
		charge.focus();
		resBalanceSwitch(false);
	}
	else
	{
		show(charge_l.parentNode, true);
		charge_l.parentNode.parentNode.className = 'dashed_static';

		show(charge, false);
	}
}


// Show input control or static block for result balance value
function resBalanceSwitch(showInput)
{
	var resbal, resbal_l;

	resbal = ge('resbal');
	resbal_l = ge('resbal_l');
	if (!resbal_l)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(resbal_l.parentNode, false);

		resbal_l.parentNode.parentNode.className = '';
		show(resbal, true);
		amountSwitch(false);

		show('result_balance', true);
		show('src_res_balance_left', false);

		resbal.focus();
	}
	else
	{
		show(resbal_l.parentNode, true);
		resbal_l.parentNode.parentNode.className = 'dashed_static';

		show(resbal, false);

		show('result_balance', false);
		show('src_res_balance_left', true);
	}
}


// Show input control or static block for result balance value
function resBalanceDestSwitch(showInput)
{
	var resbal, resbal_l;

	resbal = ge('resbal_d');
	resbal_l = ge('resbal_d_l');
	if (!resbal_l)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(resbal_l.parentNode, false);

		resbal_l.parentNode.parentNode.className = '';
		show(resbal, true);
		amountSwitch(false);

		show('result_balance_dest', true);
		show('dest_res_balance_left', false);

		resbal.focus();
	}
	else
	{
		show(resbal_l.parentNode, true);
		resbal_l.parentNode.parentNode.className = 'dashed_static';

		show(resbal, false);

		show('result_balance_dest', false);
		show('dest_res_balance_left', true);
	}
}


// Show input control or static block for exchange rate value
function exchRateSwitch(showInput)
{
	var exchrate, exchrate_l;

	exchrate = ge('exchrate');
	exchrate_l = ge('exchrate_l');
	if (!exchrate_l)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(exchrate_l.parentNode, false);
		exchrate_l.parentNode.parentNode.className = '';

		show('exch_left', false);

		show(exchrate, true);
		exchrate.focus();
	}
	else
	{
		show(exchrate_l.parentNode, true);
		exchrate_l.parentNode.parentNode.className = 'dashed_static';

		show('exch_left', true);

		show(exchrate, false);
	}
}


// Amount static click event handler
function onAmountSelect()
{
	amountSwitch(true);
	exchRateSwitch(false);
}


// Charge static click event handler
function onChargeSelect()
{
	chargeSwitch(true);
	exchRateSwitch(false);
}


// Result balance static click event handler
function onResBalanceSelect()
{
	resBalanceSwitch(true);
	resBalanceDestSwitch(false);
	exchRateSwitch(false);
}


// Result balance static click event handler
function onResBalanceDestSelect()
{
	resBalanceSwitch(false);
	resBalanceDestSwitch(true);
	exchRateSwitch(false);
}


// Exchange rate static click event handler
function onExchRateSelect()
{
	amountSwitch(true);
	exchRateSwitch(true);
	chargeSwitch(false);
	resBalanceSwitch(false);
}

