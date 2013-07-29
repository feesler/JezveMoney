

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
	var amount;

	amount = ge('amount');
	if (!amount)
		return;

	showInput = showInput | false;

	if (showInput)
	{
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
		show(amount, false);
	}
}


// Show input control or static block for charge value
function chargeSwitch(showInput)
{
	var charge;

	charge = ge('charge');
	if (!charge)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(charge, true);
		charge.focus();
		resBalanceSwitch(false);
	}
	else
	{
		show(charge, false);
	}
}


// Show input control or static block for result balance value
function resBalanceSwitch(showInput)
{
	var resbal;

	resbal = ge('resbal');
	if (!resbal)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(resbal, true);
		amountSwitch(false);

		show('result_balance', true);
		show('src_res_balance_left', false);

		resbal.focus();
	}
	else
	{
		show(resbal, false);

		show('result_balance', false);
		show('src_res_balance_left', true);
	}
}


// Show input control or static block for result balance value
function resBalanceDestSwitch(showInput)
{
	var resbal;

	resbal = ge('resbal_d');
	if (!resbal)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show(resbal, true);
		amountSwitch(false);

		show('result_balance_dest', true);
		show('dest_res_balance_left', false);

		resbal.focus();
	}
	else
	{
		show(resbal, false);

		show('result_balance_dest', false);
		show('dest_res_balance_left', true);
	}
}


// Show input control or static block for exchange rate value
function exchRateSwitch(showInput)
{
	var exchrate;

	exchrate = ge('exchrate');
	if (!exchrate)
		return;

	showInput = showInput | false;

	if (showInput)
	{
		show('exch_left', false);

		show(exchrate, true);
		exchrate.focus();
	}
	else
	{
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
