// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Return currency object for specified id
function getCurrency(curr_id)
{
	var currObj = null;

	if (curr_id != 0 && currency)
	{
		currency.some(function(curr)
		{
			var cond = (curr.id == curr_id);

			if (cond)
				currObj = curr;

			return cond;
		});
	}

	return currObj;
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var curr = getCurrency(curr_id);

	if (!curr)
		return null;

	if (curr.format)
		return curr.sign + ' ' + formatValue(val);
	else
		return formatValue(val) + ' ' + curr.sign;
}
