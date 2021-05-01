'use strict';

/* global amountFix, timestampFromString, extend, ListItem */

/**
 * @constructor Import template class
 * @param {object} props - properties of instance
 */
function ImportTemplate() {
    ImportTemplate.parent.constructor.apply(this, arguments);
}

extend(ImportTemplate, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportTemplate.prototype.isAvailField = function (field) {
    var availFields = ['id', 'name', 'type_id', 'columns'];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Search for column with specified index in the template
 * Return information object if column found else null is returned
 * @param {number} index - column index in raw data
 */
ImportTemplate.prototype.getColumnsByIndex = function (index) {
    var tplColumns = {
        accountAmount: { title: 'Account amount' },
        accountCurrency: { title: 'Account currency' },
        transactionAmount: { title: 'Transaction amount' },
        transactionCurrency: { title: 'Transaction currency' },
        date: { title: 'Date' },
        comment: { title: 'Comment' }
    };

    var res = Object.keys(tplColumns).filter(function (columnName) {
        return this.columns[columnName] === index;
    }, this);

    return res.map(function (columnName) {
        return tplColumns[columnName];
    });
};

/**
 * Return column data by specified index
 * @param {Array} data - row data array
 * @param {number} index - column index, starting from 1
 */
ImportTemplate.prototype.getColumnData = function (data, index) {
    var col;

    if (!Array.isArray(data)) {
        throw new Error('Invalid row data');
    }

    col = parseInt(index, 10);
    if (Number.isNaN(col) || col < 1 || col > data.length) {
        throw new Error('Invalid column ' + index + '. Total columns: ' + data.length);
    }

    return data[col - 1];
};

/** Obtain specified property from data */
ImportTemplate.prototype.getProperty = function (name, data, safe) {
    var propGetterMap = {
        accountAmount: this.getAccountAmount,
        accountCurrency: this.getAccountCurrency,
        transactionAmount: this.getTransactionAmount,
        transactionCurrency: this.getTransactionCurrency,
        date: this.getDate,
        comment: this.getComment
    };

    try {
        if (!(name in propGetterMap)) {
            throw new Error('Invalid property');
        }

        return propGetterMap[name].call(this, data);
    } catch (e) {
        if (safe) {
            return null;
        }

        throw e;
    }
};

/** Extract account amount value from data */
ImportTemplate.prototype.getAccountAmount = function (data) {
    var value;

    if (!('accountAmount' in this.columns)) {
        return null;
    }

    value = this.getColumnData(data, this.columns.accountAmount);
    return amountFix(value);
};

/** Extract account currency value from data */
ImportTemplate.prototype.getAccountCurrency = function (data) {
    if (!('accountCurrency' in this.columns)) {
        return null;
    }

    return this.getColumnData(data, this.columns.accountCurrency);
};

/** Extract transaction amount value from data */
ImportTemplate.prototype.getTransactionAmount = function (data) {
    var value;

    if (!('transactionAmount' in this.columns)) {
        return null;
    }

    value = this.getColumnData(data, this.columns.transactionAmount);
    return amountFix(value);
};

/** Extract transaction currency value from data */
ImportTemplate.prototype.getTransactionCurrency = function (data) {
    if (!('transactionCurrency' in this.columns)) {
        return null;
    }

    return this.getColumnData(data, this.columns.transactionCurrency);
};

/** Extract date value from data */
ImportTemplate.prototype.getDate = function (data) {
    var value;

    if (!('date' in this.columns)) {
        return null;
    }

    value = this.getColumnData(data, this.columns.date);
    return timestampFromString(value);
};

/** Extract comment value from data */
ImportTemplate.prototype.getComment = function (data) {
    if (!('comment' in this.columns)) {
        return null;
    }

    return this.getColumnData(data, this.columns.comment);
};

/** Apply import template to specified data row */
ImportTemplate.prototype.applyTo = function (data, currencyModel) {
    var currency;
    var res = {
        accountAmount: this.getAccountAmount(data),
        accountCurrency: this.getAccountCurrency(data),
        transactionAmount: this.getTransactionAmount(data),
        transactionCurrency: this.getTransactionCurrency(data),
        date: this.getDate(data),
        comment: this.getComment(data),
        template: this.id
    };

    currency = currencyModel.findByName(res.accountCurrency);
    res.accountCurrencyId = (currency) ? currency.id : null;

    currency = currencyModel.findByName(res.transactionCurrency);
    res.transactionCurrencyId = (currency) ? currency.id : null;

    return res;
};
