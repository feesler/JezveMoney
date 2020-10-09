/** Format specified number value */
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


/**
 * @constructor Currency
 * @param {object} props - properties of currency object
 */
function Currency()
{
	Currency.parent.constructor.apply(this, arguments);
}

extend(Currency, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Currency.prototype.isAvailField = function(field)
{
    var availFields = ['id', 'name', 'sign', 'flags'];

    return typeof field === 'string' && availFields.includes(field);
};


/**
 * Format specified value using rules of currency
 * @param {*} value - float value to format
 */
Currency.prototype.formatValue = function(value)
{
	var nval = normalize(value);

	if (Math.floor(nval) != nval)
		nval = nval.toFixed(2);

	var fmtVal = formatValue(nval);

	if (this.flags)
		return this.sign + ' ' + fmtVal;
	else
		return fmtVal + ' ' + this.sign;
};


/**
 * @constructor CurrencyList class
 * @param {object[]} props - array of currencies
 */
function CurrencyList()
{
	CurrencyList.parent.constructor.apply(this, arguments);
}

extend(CurrencyList, List);

/** Static alias for CurrencyList constructor */
CurrencyList.create = function(props)
{
    return new CurrencyList(props);
};


/**
 * Create list item from specified object
 * @param {Object} obj 
 */
CurrencyList.prototype.createItem = function(obj)
{
    return new Currency(obj);
};


/**
 * Format value with specified currency
 * @param {number} value - float value to format
 * @param {number} currency_id - identifier of required currency
 */
CurrencyList.prototype.formatCurrency = function(value, currency_id)
{
	var item = this.getItem(currency_id);
	if (!item)
		return null;

	return item.formatValue(value);
};
