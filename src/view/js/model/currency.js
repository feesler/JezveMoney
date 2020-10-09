/** Format specified number value */
function formatValue(val)
{
	return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
}


/**
 * @constructor Currency
 * @param {object} props - properties of currency object
 */
function Currency(props)
{
    if (!isObject(props))
        throw new Error('Invalid Currency props');

    for(var prop in props)
    {
        if (this.isAvailField(prop))
            this[prop] = props[prop];
    }
}


/** Static alias for Currency constructor */
Currency.create = function(props)
{
    return new Currency(props)
};


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
function CurrencyList(props)
{
    if (!Array.isArray(props))
        throw new Error('Invalid currency list props');
    
    this.data = props.map(Currency.create);
}


/** Static alias for CurrencyList constructor */
CurrencyList.create = function(props)
{
    return new CurrencyList(props);
};


/**
 * Return item with specified id
 * @param {number} item_id - identifier of item to find
 */
CurrencyList.prototype.getItem = function(item_id)
{
    if (!item_id)
        return null;

    var res = this.data.find(function(item) {
        return item && item.id == item_id
    });

    return (res) ? res : null;
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
