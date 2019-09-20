// Format specified value
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


// Currency object constructor
function Currency(props)
{
	this.id = props.id;
	this.format = props.format;
	this.sign = props.sign;
	this.name = props.name;
}


// Format specified value using rules of currency
Currency.prototype.formatValue = function(val)
{
	var nval = normalize(val);

	if (Math.floor(nval) != nval)
		nval = nval.toFixed(2);

	var fmtVal = formatValue(nval);

	if (this.format)
		return this.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + this.sign;
};


// Return currency object for specified id
function getCurrency(curr_id)
{
	var currObj = idSearch(currency, curr_id);
	if (!currObj)
		return null;

	return new Currency(currObj);
}


// Format value with rules of specified currency
function formatCurrency(val, curr_id)
{
	var curr, nval, fmtVal;

	curr = getCurrency(curr_id);
	if (!curr)
		return null;

	nval = normalize(val);
	if (Math.floor(nval) == nval)
		fmtVal = formatValue(nval);
	else
		fmtVal = formatValue(nval.toFixed(2));
	if (curr.format)
		return curr.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + curr.sign;
}
