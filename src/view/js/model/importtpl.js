'use strict';

/* global extend, ListItem, List */

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
    var availFields = [
        'id',
        'name',
        'type_id',
        'accountAmountColumn',
        'accountCurrColumn',
        'transactionAmountColumn',
        'transactionCurrColumn',
        'dateColumn',
        'commentColumn'
    ];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Search for column with specified index in the template
 * Return information object if column found else null is returned
 * @param {number} index - column index in raw data
 */
ImportTemplate.prototype.getColumnByIndex = function (index) {
    var tplColumns = {
        accountAmountColumn: { title: 'Account amount' },
        accountCurrColumn: { title: 'Account currency' },
        transactionAmountColumn: { title: 'Transaction amount' },
        transactionCurrColumn: { title: 'Transaction currency' },
        dateColumn: { title: 'Date' },
        commentColumn: { title: 'Comment' }
    };

    var res = Object.keys(tplColumns).find(function (columnName) {
        return this[columnName] === index;
    }, this);

    return (res) ? tplColumns[res] : null;
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
