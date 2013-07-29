

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


// Common function for toggle switch
function commonSwitch(input_block_id, static_block_id, input_id, showInput)
{
	var inpObj = ge(input_id);
	showInput = showInput | false;

	show(input_block_id, showInput);
	show(static_block_id, !showInput);

	if (showInput && inpObj)
		inpObj.focus();
}


// Show input control or static block for amount value
function amountSwitch(showInput)
{
	commonSwitch('amount_row', 'amount_left', 'amount', showInput);
}


// Show input control or static block for charge value
function chargeSwitch(showInput)
{
	commonSwitch('chargeoff', 'charge_left', 'charge', showInput);
}


// Show input control or static block for result balance value
function resBalanceSwitch(showInput)
{
	commonSwitch('result_balance', 'src_res_balance_left', 'resbal', showInput);
}


// Show input control or static block for result balance value
function resBalanceDestSwitch(showInput)
{
	commonSwitch('result_balance_dest', 'dest_res_balance_left', 'resbal_d', showInput);
}


// Show input control or static block for exchange rate value
function exchRateSwitch(showInput)
{
	commonSwitch('exchange', 'exch_left', 'exchrate', showInput);
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
