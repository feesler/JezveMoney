'use strict';

/* global extend, List, Currency */

/**
 * @constructor CurrencyList class
 * @param {object[]} props - array of currencies
 */
function CurrencyList() {
    CurrencyList.parent.constructor.apply(this, arguments);
}

extend(CurrencyList, List);

/** Static alias for CurrencyList constructor */
CurrencyList.create = function (props) {
    return new CurrencyList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
CurrencyList.prototype.createItem = function (obj) {
    return new Currency(obj);
};

/**
 * Format value with specified currency
 * @param {number} value - float value to format
 * @param {number} currency_id - identifier of required currency
 */
CurrencyList.prototype.formatCurrency = function (value, currencyId) {
    var item = this.getItem(currencyId);
    if (!item) {
        return null;
    }

    return item.formatValue(value);
};

/**
 * Search for currency with specified name
 * @param {string} name - currency name
 */
CurrencyList.prototype.findByName = function (name) {
    return this.find(function (item) {
        return item.name === name;
    });
};
