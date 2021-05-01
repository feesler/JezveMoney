'use strict';

/* global extend, ListItem, normalize */

/** Format specified number value */
function formatValue(val) {
    return val.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
}

/**
 * @constructor Currency
 * @param {object} props - properties of currency object
 */
function Currency() {
    Currency.parent.constructor.apply(this, arguments);
}

extend(Currency, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
Currency.prototype.isAvailField = function (field) {
    var availFields = ['id', 'name', 'sign', 'flags'];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Format specified value using rules of currency
 * @param {*} value - float value to format
 */
Currency.prototype.formatValue = function (value) {
    var fmtVal;
    var nval;

    nval = normalize(value);
    if (Math.floor(nval) !== nval) {
        nval = nval.toFixed(2);
    }

    fmtVal = formatValue(nval);
    if (this.flags) {
        return this.sign + ' ' + fmtVal;
    }

    return fmtVal + ' ' + this.sign;
};
