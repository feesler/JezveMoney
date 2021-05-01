'use strict';

/* global timestampFromString, copyObject, isObject, extend, ListItem */
/* eslint no-bitwise: "off" */

/** Condition field types */
var IMPORT_COND_FIELD_MAIN_ACCOUNT = 1;
var IMPORT_COND_FIELD_TPL = 2;
var IMPORT_COND_FIELD_TR_AMOUNT = 3;
var IMPORT_COND_FIELD_TR_CURRENCY = 4;
var IMPORT_COND_FIELD_ACC_AMOUNT = 5;
var IMPORT_COND_FIELD_ACC_CURRENCY = 6;
var IMPORT_COND_FIELD_COMMENT = 7;
var IMPORT_COND_FIELD_DATE = 8;
/** Condition operators */
var IMPORT_COND_OP_STRING_INCLUDES = 1;
var IMPORT_COND_OP_EQUAL = 2;
var IMPORT_COND_OP_NOT_EQUAL = 3;
var IMPORT_COND_OP_LESS = 4;
var IMPORT_COND_OP_GREATER = 5;
/** Condition flags */
var IMPORT_COND_OP_FIELD_FLAG = 0x01;

/**
 * @constructor Import condition class
 * @param {object} props - properties of instance
 */
function ImportCondition() {
    ImportCondition.parent.constructor.apply(this, arguments);
}

/** Item field types */
ImportCondition.itemFields = [
    IMPORT_COND_FIELD_MAIN_ACCOUNT,
    IMPORT_COND_FIELD_TPL,
    IMPORT_COND_FIELD_TR_CURRENCY,
    IMPORT_COND_FIELD_ACC_CURRENCY
];

/** Amount field types */
ImportCondition.amountFields = [
    IMPORT_COND_FIELD_TR_AMOUNT,
    IMPORT_COND_FIELD_ACC_AMOUNT
];
/** Currency field types */
ImportCondition.currencyFields = [
    IMPORT_COND_FIELD_TR_CURRENCY,
    IMPORT_COND_FIELD_ACC_CURRENCY
];

/** Item(account, template, currency) operators */
ImportCondition.itemOperators = [
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL
];
/** Numeric(amount and date) operators */
ImportCondition.numOperators = [
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER
];
/** String operators */
ImportCondition.stringOperators = [
    IMPORT_COND_OP_STRING_INCLUDES,
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER
];

/** List of available field types */
ImportCondition.fieldTypes = [
    {
        id: IMPORT_COND_FIELD_MAIN_ACCOUNT,
        title: 'Main account',
        operators: ImportCondition.itemOperators
    },
    {
        id: IMPORT_COND_FIELD_TPL,
        title: 'Template',
        operators: ImportCondition.itemOperators
    },
    {
        id: IMPORT_COND_FIELD_TR_AMOUNT,
        title: 'Transaction amount',
        operators: ImportCondition.numOperators
    },
    {
        id: IMPORT_COND_FIELD_TR_CURRENCY,
        title: 'Transaction currency',
        operators: ImportCondition.itemOperators
    },
    {
        id: IMPORT_COND_FIELD_ACC_AMOUNT,
        title: 'Account amount',
        operators: ImportCondition.numOperators
    },
    {
        id: IMPORT_COND_FIELD_ACC_CURRENCY,
        title: 'Account currency',
        operators: ImportCondition.itemOperators
    },
    {
        id: IMPORT_COND_FIELD_DATE,
        title: 'Date',
        operators: ImportCondition.numOperators
    },
    {
        id: IMPORT_COND_FIELD_COMMENT,
        title: 'Comment',
        operators: ImportCondition.stringOperators
    }
];

/** List of available condition operator types */
ImportCondition.operatorTypes = [
    { id: IMPORT_COND_OP_STRING_INCLUDES, title: 'Includes' },
    { id: IMPORT_COND_OP_EQUAL, title: 'Equal to' },
    { id: IMPORT_COND_OP_NOT_EQUAL, title: 'Not equal to' },
    { id: IMPORT_COND_OP_LESS, title: 'Less than' },
    { id: IMPORT_COND_OP_GREATER, title: 'Greater than' }
];
/** Field type to data property name map */
ImportCondition.fieldsMap = {};
ImportCondition.fieldsMap[IMPORT_COND_FIELD_MAIN_ACCOUNT] = 'mainAccount';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_TPL] = 'template';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_TR_AMOUNT] = 'transactionAmount';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_TR_CURRENCY] = 'transactionCurrencyId';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_ACC_AMOUNT] = 'accountAmount';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_ACC_CURRENCY] = 'accountCurrencyId';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_DATE] = 'date';
ImportCondition.fieldsMap[IMPORT_COND_FIELD_COMMENT] = 'comment';
/** Operator functions map */
ImportCondition.operatorsMap = {};
ImportCondition.operatorsMap[IMPORT_COND_OP_STRING_INCLUDES] = function (left, right) {
    return left.includes(right);
};
ImportCondition.operatorsMap[IMPORT_COND_OP_EQUAL] = function (left, right) {
    return left === right;
};
ImportCondition.operatorsMap[IMPORT_COND_OP_NOT_EQUAL] = function (left, right) {
    return left !== right;
};
ImportCondition.operatorsMap[IMPORT_COND_OP_LESS] = function (left, right) {
    return left < right;
};
ImportCondition.operatorsMap[IMPORT_COND_OP_GREATER] = function (left, right) {
    return left > right;
};

extend(ImportCondition, ListItem);

/**
 * Return data value for specified field type
 * @param {string} field - field name to check
 */
ImportCondition.getFieldValue = function (fieldId, data) {
    var dataProp;
    var field = parseInt(fieldId, 10);
    if (!field || !(field in ImportCondition.fieldsMap)) {
        throw new Error('Invalid field id: ' + fieldId);
    }
    if (!isObject(data)) {
        throw new Error('Invalid transaction data');
    }

    dataProp = ImportCondition.fieldsMap[field];

    return data[dataProp];
};

/** Check value for specified field type is account, template or currency */
ImportCondition.isItemField = function (value) {
    return ImportCondition.itemFields.includes(parseInt(value, 10));
};

/** Check value for specified field type is account */
ImportCondition.isAccountField = function (value) {
    return parseInt(value, 10) === IMPORT_COND_FIELD_MAIN_ACCOUNT;
};

/** Check value for specified field type is template */
ImportCondition.isTemplateField = function (value) {
    return parseInt(value, 10) === IMPORT_COND_FIELD_TPL;
};

/** Check value for specified field type is currency */
ImportCondition.isCurrencyField = function (value) {
    return ImportCondition.currencyFields.includes(parseInt(value, 10));
};

/** Check value for specified field type is amount */
ImportCondition.isAmountField = function (value) {
    return ImportCondition.amountFields.includes(parseInt(value, 10));
};

/** Check value for specified field type is string */
ImportCondition.isDateField = function (value) {
    return parseInt(value, 10) === IMPORT_COND_FIELD_DATE;
};

/** Check value for specified field type is string */
ImportCondition.isStringField = function (value) {
    return parseInt(value, 10) === IMPORT_COND_FIELD_COMMENT;
};

/** Return array of available field types */
ImportCondition.getFieldTypes = function () {
    var res = copyObject(ImportCondition.fieldTypes);

    return res;
};

/** Search field type by id */
ImportCondition.getFieldTypeById = function (value) {
    var res;
    var id = parseInt(value, 10);
    if (!id) {
        return null;
    }

    res = ImportCondition.fieldTypes.find(function (item) {
        return item.id === id;
    });
    if (!res) {
        return null;
    }

    return copyObject(res);
};

/** Return array of operators available for specified type of field */
ImportCondition.getAvailOperators = function (value) {
    var field = ImportCondition.getFieldTypeById(value);
    if (!field) {
        return null;
    }

    return copyObject(field.operators);
};

/** Return array of operators */
ImportCondition.getOperatorTypes = function () {
    var res = copyObject(ImportCondition.operatorTypes);

    return res;
};

/** Search condition operator by id */
ImportCondition.getOperatorById = function (value) {
    var res;
    var id = parseInt(value, 10);
    if (!id) {
        return null;
    }

    res = ImportCondition.operatorTypes.find(function (item) {
        return item.id === id;
    });
    if (!res) {
        return null;
    }

    return copyObject(res);
};

/** Check specified value is item operator(equal or not equal) */
ImportCondition.isItemOperator = function (value) {
    return ImportCondition.itemOperators.includes(parseInt(value, 10));
};

/** Check specified value is numeric operator */
ImportCondition.isNumOperator = function (value) {
    return ImportCondition.numOperators.includes(parseInt(value, 10));
};

/** Check specified value is string operator */
ImportCondition.isStringOperator = function (value) {
    return ImportCondition.stringOperators.includes(parseInt(value, 10));
};

/** Check field value flag */
ImportCondition.isPropertyValueFlag = function (value) {
    var res = parseInt(value, 10);
    if (Number.isNaN(res)) {
        throw new Error('Invalid flags value');
    }

    return (res & IMPORT_COND_OP_FIELD_FLAG) === IMPORT_COND_OP_FIELD_FLAG;
};

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportCondition.prototype.isAvailField = function (field) {
    var availFields = [
        'id',
        'rule_id',
        'field_id',
        'operator',
        'flags',
        'value'
    ];

    return typeof field === 'string' && availFields.includes(field);
};

/** Check field type of condition is item */
ImportCondition.prototype.isItemField = function () {
    return ImportCondition.isItemField(this.field_id);
};

/** Check field type of condition is account */
ImportCondition.prototype.isAccountField = function () {
    return ImportCondition.isAccountField(this.field_id);
};

/** Check field type of condition is template */
ImportCondition.prototype.isTemplateField = function () {
    return ImportCondition.isTemplateField(this.field_id);
};

/** Check field type of condition is currency */
ImportCondition.prototype.isCurrencyField = function () {
    return ImportCondition.isCurrencyField(this.field_id);
};

/** Check field type of condition is amount */
ImportCondition.prototype.isAmountField = function () {
    return ImportCondition.isAmountField(this.field_id);
};

/** Check field type of condition is date */
ImportCondition.prototype.isDateField = function () {
    return ImportCondition.isDateField(this.field_id);
};

/** Check field type of condition is string */
ImportCondition.prototype.isStringField = function () {
    return ImportCondition.isStringField(this.field_id);
};

/** Check condition use item operator */
ImportCondition.prototype.isItemOperator = function () {
    return ImportCondition.isItemOperator(this.operator);
};

/** Check condition use numeric operator */
ImportCondition.prototype.isNumOperator = function () {
    return ImportCondition.isNumOperator(this.operator);
};

/** Check condition use string operator */
ImportCondition.prototype.isStringOperator = function () {
    return ImportCondition.isStringOperator(this.operator);
};

/** Check condition use property as value */
ImportCondition.prototype.isPropertyValue = function () {
    return ImportCondition.isPropertyValueFlag(this.flags);
};

/** Return array of operators available for current type of field */
ImportCondition.prototype.getAvailOperators = function () {
    return ImportCondition.getAvailOperators(this.field_id);
};

/**
 * Apply operator to specified data and return result
 * @param {number} leftVal - value on the left to operator
 * @param {number} rightVal - value on the right to operator
 */
ImportCondition.prototype.applyOperator = function (leftVal, rightVal) {
    var operatorFunc;
    var left = leftVal;
    var right = (typeof left === 'string') ? rightVal.toString() : rightVal;

    if (!(this.operator in ImportCondition.operatorsMap)) {
        throw new Error('Invalid operator');
    }

    operatorFunc = ImportCondition.operatorsMap[this.operator];
    return operatorFunc(left, right);
};

/**
 * Return data value for field type of condition
 * @param {string} field - field name to check
 */
ImportCondition.prototype.getFieldValue = function (data) {
    return ImportCondition.getFieldValue(this.field_id, data);
};

/**
 * Check specified data is meet condition of condition
 * @param {string} field - field name to check
 */
ImportCondition.prototype.getConditionValue = function (data) {
    if (!isObject(data)) {
        throw new Error('Invalid transaction data');
    }

    if (this.isPropertyValue()) {
        return ImportCondition.getFieldValue(this.value, data);
    }
    if (this.isItemField()) {
        return parseInt(this.value, 10);
    }
    if (this.isAmountField()) {
        return parseFloat(this.value);
    }
    if (this.isDateField()) {
        return timestampFromString(this.value);
    }

    return this.value;
};

/** Check specified data is meet condition */
ImportCondition.prototype.meet = function (data) {
    var fieldValue = this.getFieldValue(data);
    var conditionValue = this.getConditionValue(data);

    return this.applyOperator(fieldValue, conditionValue);
};
