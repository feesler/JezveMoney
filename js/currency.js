// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
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
