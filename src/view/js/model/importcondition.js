'use strict';

/* global timestampFromString, copyObject, isObject, extend, ListItem, List */
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

extend(ImportCondition, ListItem);

/**
 * Return data value for specified field type
 * @param {string} field - field name to check
 */
ImportCondition.getFieldValue = function (fieldId, data) {
    var field = parseInt(fieldId, 10);
    if (!field) {
        throw new Error('Invalid field id: ' + fieldId);
    }
    if (!isObject(data)) {
        throw new Error('Invalid transaction data');
    }

    if (field === IMPORT_COND_FIELD_MAIN_ACCOUNT) {
        return data.mainAccount;
    }
    if (field === IMPORT_COND_FIELD_TPL) {
        return data.template;
    }
    if (field === IMPORT_COND_FIELD_TR_AMOUNT) {
        return data.trAmountVal;
    }
    if (field === IMPORT_COND_FIELD_TR_CURRENCY) {
        return data.trCurrVal;
    }
    if (field === IMPORT_COND_FIELD_ACC_AMOUNT) {
        return data.accAmountVal;
    }
    if (field === IMPORT_COND_FIELD_ACC_CURRENCY) {
        return data.accCurrVal;
    }
    if (field === IMPORT_COND_FIELD_COMMENT) {
        return data.comment;
    }
    if (field === IMPORT_COND_FIELD_DATE) {
        return data.date;
    }

    throw new Error('Invalid field id: ' + field);
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

/** Search field type by id */
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

/** Check field value flag */
ImportCondition.isFieldValueFlag = function (value) {
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

/**
 * Check operator id has field value flag
 * @param {number} data - operator value
 */
ImportCondition.prototype.isFieldValueOperator = function () {
    return ImportCondition.isFieldValueFlag(this.flags);
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
    var left = leftVal;
    var right = (typeof left === 'string') ? rightVal.toString() : rightVal;

    if (this.operator === IMPORT_COND_OP_STRING_INCLUDES) {
        return left.includes(right);
    }
    if (this.operator === IMPORT_COND_OP_EQUAL) {
        return left === right;
    }
    if (this.operator === IMPORT_COND_OP_NOT_EQUAL) {
        return left !== right;
    }
    if (this.operator === IMPORT_COND_OP_LESS) {
        return left < right;
    }
    if (this.operator === IMPORT_COND_OP_GREATER) {
        return left > right;
    }

    throw new Error('Invalid operator');
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

    if (this.isFieldValueOperator()) {
        return ImportCondition.getFieldValue(this.value, data);
    }

    if (ImportCondition.isDateField(this.field_id)) {
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

/**
 * @constructor ImportConditionList class
 * @param {object[]} props - array of import conditions
 */
function ImportConditionList() {
    ImportConditionList.parent.constructor.apply(this, arguments);
}

extend(ImportConditionList, List);

/** Static alias for ImportConditionList constructor */
ImportConditionList.create = function (props) {
    return new ImportConditionList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportConditionList.prototype.createItem = function (obj) {
    return new ImportCondition(obj);
};

/**
 * Return list of conditions for specified rule
 * @param {number} ruleId - rule id
 */
ImportConditionList.prototype.getRuleConditions = function (ruleId) {
    var id = parseInt(ruleId, 10);
    if (!id) {
        throw new Error('Invalid rule id');
    }

    return this.data.filter(function (item) {
        return item.rule_id === id;
    });
};

/**
 * Check list of conditions has condition with same field type
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasSameFieldCondition = function (condition) {
    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid condition');
    }

    return !!this.data.find(function (item) {
        return (
            item !== condition
            && item.field_id === condition.field_id
        );
    });
};

/**
 * Check list of conditions has condition with same field type
 * and equal or greater value than specified condition
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasNotLessCondition = function (condition) {
    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid rule id');
    }

    return !!this.data.find(function (item) {
        return (
            item !== condition
            && item.field_id === condition.field_id
            && !(item.value < condition.value)
        );
    });
};

/**
 * Check list of conditions has condition with same field type
 * and equal or less value than specified condition
 * @param {ImportCondition} condition
 */
ImportConditionList.prototype.hasNotGreaterCondition = function (condition) {
    if (!(condition instanceof ImportCondition)) {
        throw new Error('Invalid rule id');
    }

    return !!this.data.find(function (item) {
        return (
            item !== condition
            && item.field_id === condition.field_id
            && !(item.value > condition.value)
        );
    });
};
