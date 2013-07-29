

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

	show('amount_row', showInput);			// show entire row instead of input
	show('amount_left', !showInput);

	if (showInput)
		amount.focus();
}


// Show input control or static block for charge value
function chargeSwitch(showInput)
{
	var charge;

	charge = ge('charge');
	if (!charge)
		return;

	showInput = showInput | false;

	show('chargeoff', showInput);
	show('charge_left', !showInput);

	if (showInput)
		charge.focus();
}


// Show input control or static block for result balance value
function resBalanceSwitch(showInput)
{
	var resbal;

	resbal = ge('resbal');
	if (!resbal)
		return;

	showInput = showInput | false;

	show('result_balance', showInput);
	show('src_res_balance_left', !showInput);

	if (showInput)
		resbal.focus();
}


// Show input control or static block for result balance value
function resBalanceDestSwitch(showInput)
{
	var resbal;

	resbal = ge('resbal_d');
	if (!resbal)
		return;

	showInput = showInput | false;

	show('result_balance_dest', showInput);
	show('dest_res_balance_left', !showInput);

	if (showInput)
		resbal.focus();
}


// Show input control or static block for exchange rate value
function exchRateSwitch(showInput)
{
	var exchrate;

	exchrate = ge('exchrate');
	if (!exchrate)
		return;

	showInput = showInput | false;

	show('exchange', showInput);
	show('exch_left', !showInput);

	if (showInput)
		exchrate.focus();
}


// Amount static click event handler
function onAmountSelect()
{
	amountSwitch(true);
	resBalanceSwitch(false);
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
	amountSwitch(false);
}


// Result balance static click event handler
function onResBalanceDestSelect()
{
	resBalanceSwitch(false);
	resBalanceDestSwitch(true);
	amountSwitch(false);
}


// Exchange rate static click event handler
function onExchRateSelect()
{
	exchRateSwitch(true);
	chargeSwitch(false);
}


// Hide both charge and exchange rate controls
function hideChargeAndExchange()
{
	show('chargeoff', false);
	show('charge_left',  false);

	show('exchange', false);
	show('exch_left', false);
}
