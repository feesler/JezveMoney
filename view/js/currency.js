// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Return currency object for specified id
function getCurrency(curr_id)
{
	return idSearch(currency, curr_id);
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var curr, fmtVal;

	curr = getCurrency(curr_id);
	if (!curr)
		return null;

	fmtVal = formatValue(normalize(val).toFixed(2));
	if (curr.format)
		return curr.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + curr.sign;
}
