'use strict';

/* global fixFloat, extend, ListItem, List */

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

/** Convert string to amount value */
ImportTemplate.prototype.amountFix = function (value) {
    var res;

    if (typeof value === 'number') {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }

    res = value.replace(/ /, '');
    return parseFloat(fixFloat(res));
};

/** Convert DD.MM.YYYY string to timestamp */
ImportTemplate.prototype.fixDate = function (str) {
    var res;

    if (typeof str !== 'string') {
        return null;
    }

    res = Date.parse(str.split('.').reverse().join('-'));
    if (Number.isNaN(res)) {
        return null;
    }

    return res;
};

/** Convert date string to timestamp */
ImportTemplate.prototype.timestampFromString = function (str) {
    var tmpDate = str;
    var pos = str.indexOf(' ');
    if (pos !== -1) {
        tmpDate = tmpDate.substr(0, pos);
    }

    return this.fixDate(tmpDate);
};

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
    var value = this.getColumnData(data, this.columns.accountAmount);
    return this.amountFix(value);
};

/** Extract account currency value from data */
ImportTemplate.prototype.getAccountCurrency = function (data) {
    return this.getColumnData(data, this.columns.accountCurrency);
};

/** Extract transaction amount value from data */
ImportTemplate.prototype.getTransactionAmount = function (data) {
    var value = this.getColumnData(data, this.columns.transactionAmount);
    return this.amountFix(value);
};

/** Extract transaction currency value from data */
ImportTemplate.prototype.getTransactionCurrency = function (data) {
    return this.getColumnData(data, this.columns.transactionCurrency);
};

/** Extract date value from data */
ImportTemplate.prototype.getDate = function (data) {
    var value = this.getColumnData(data, this.columns.date);
    return this.timestampFromString(value);
};

/** Extract comment value from data */
ImportTemplate.prototype.getComment = function (data) {
    return this.getColumnData(data, this.columns.comment);
};

/** Apply import template to specified data row */
ImportTemplate.prototype.applyTo = function (data) {
    var res = {
        accAmountVal: this.getAccountAmount(data),
        accCurrVal: this.getAccountCurrency(data),
        trAmountVal: this.getTransactionAmount(data),
        trCurrVal: this.getTransactionCurrency(data),
        date: this.getDate(data),
        comment: this.getComment(data)
    };

    return res;
};

/**
 * @constructor ImportTemplateList class
 * @param {object[]} props - array of import rules
 */
function ImportTemplateList() {
    ImportTemplateList.parent.constructor.apply(this, arguments);
}

extend(ImportTemplateList, List);

/** Static alias for ImportTemplateList constructor */
ImportTemplateList.create = function (props) {
    return new ImportTemplateList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportTemplateList.prototype.createItem = function (obj) {
    return new ImportTemplate(obj);
};
