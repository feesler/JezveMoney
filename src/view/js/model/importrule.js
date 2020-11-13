'use strict';

/* global extend, ListItem, List, ImportAction */
/* eslint no-bitwise: "off" */

/** Rule field types */
var IMPORT_RULE_FIELD_MAIN_ACCOUNT = 1;
var IMPORT_RULE_FIELD_TPL = 2;
var IMPORT_RULE_FIELD_TR_AMOUNT = 3;
var IMPORT_RULE_FIELD_TR_CURRENCY = 4;
var IMPORT_RULE_FIELD_ACC_AMOUNT = 5;
var IMPORT_RULE_FIELD_ACC_CURRENCY = 6;
var IMPORT_RULE_FIELD_COMMENT = 7;
var IMPORT_RULE_FIELD_DATE = 8;
/** Rule operators */
var IMPORT_RULE_OP_STRING_INCLUDES = 1;
var IMPORT_RULE_OP_EQUAL = 2;
var IMPORT_RULE_OP_NOT_EQUAL = 3;
var IMPORT_RULE_OP_LESS = 4;
var IMPORT_RULE_OP_GREATER = 5;
/** Rule flags */
var IMPORT_RULE_OP_FIELD_FLAG = 0x8000;

/**
 * @constructor Import rule class
 * @param {object} props - properties of instance
 */
function ImportRule() {
    ImportRule.parent.constructor.apply(this, arguments);

    this.actions = this.actions.map(function (item) {
        return new ImportAction(item);
    });
}

extend(ImportRule, ListItem);

/**
 * Return data value for specified field type
 * @param {string} field - field name to check
 */
ImportRule.getFieldValue = function (fieldId, data) {
    var field = parseInt(fieldId, 10);
    if (!field) {
        throw new Error('Invalid field id: ' + fieldId);
    }
    if (!isObject(data)) {
        throw new Error('Invalid transaction data');
    }

    if (field === IMPORT_RULE_FIELD_MAIN_ACCOUNT) {
        throw new Error('Main account field not implemented yet');
    }
    if (field === IMPORT_RULE_FIELD_TPL) {
        throw new Error('Template field not implemented yet');
    }
    if (field === IMPORT_RULE_FIELD_TR_AMOUNT) {
        return data.trAmountVal;
    }
    if (field === IMPORT_RULE_FIELD_TR_CURRENCY) {
        return data.trCurrVal;
    }
    if (field === IMPORT_RULE_FIELD_ACC_AMOUNT) {
        return data.accAmountVal;
    }
    if (field === IMPORT_RULE_FIELD_ACC_CURRENCY) {
        return data.accCurrVal;
    }
    if (field === IMPORT_RULE_FIELD_COMMENT) {
        return data.descr;
    }
    if (field === IMPORT_RULE_FIELD_DATE) {
        return data.date;
    }

    throw new Error('Invalid field id: ' + field);
};

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportRule.prototype.isAvailField = function (field) {
    var availFields = ['id', 'parent_id', 'field_id', 'operator', 'value', 'actions'];

    return typeof field === 'string' && availFields.includes(field);
};

/**
 * Check operator id has field value flag
 * @param {number} data - operator value
 */
ImportRule.prototype.isFieldValueOperator = function () {
    var res = parseInt(this.operator, 10);
    if (!res) {
        throw new Error('Invalid operator value');
    }

    return (res & IMPORT_RULE_OP_FIELD_FLAG) == IMPORT_RULE_OP_FIELD_FLAG;
};

/**
 * Return operator id without flags
 * @param {number} data - identifier of operator
 */
ImportRule.prototype.getOperator = function () {
    var res = parseInt(this.operator, 10);
    if (!res) {
        throw new Error('Invalid operator value');
    }

    return (res & ~IMPORT_RULE_OP_FIELD_FLAG);
};

/**
 * Apply operator to specified data and return result
 * @param {number} leftVal - value on the left to operator
 * @param {number} rightVal - value on the right to operator
 */
ImportRule.prototype.applyOperator = function (leftVal, rightVal) {
    var operator = this.getOperator();
    var left = leftVal;
    var right = (typeof left === 'string') ? rightVal.toString() : rightVal;

    if (operator === IMPORT_RULE_OP_STRING_INCLUDES) {
        return left.includes(right);
    }
    if (operator === IMPORT_RULE_OP_EQUAL) {
        return left === right;
    }
    if (operator === IMPORT_RULE_OP_NOT_EQUAL) {
        return left !== right;
    }
    if (operator === IMPORT_RULE_OP_LESS) {
        return left < right;
    }
    if (operator === IMPORT_RULE_OP_GREATER) {
        return left > right;
    }

    throw new Error('Invalid operator');
};

/**
 * Return data value for field type of rule
 * @param {string} field - field name to check
 */
ImportRule.prototype.getFieldValue = function (data) {
    return ImportRule.getFieldValue(this.field_id, data);
};

/**
 * Check specified data is meet condition of rule
 * @param {string} field - field name to check
 */
ImportRule.prototype.getConditionValue = function (data) {
    if (!isObject(data)) {
        throw new Error('Invalid transaction data');
    }

    if (this.isFieldValueOperator()) {
        return ImportRule.getFieldValue(this.value, data);
    }

    return this.value;
};

/**
 * Check specified data is meet condition of rule
 */
ImportRule.prototype.meetCondition = function (data) {
    var fieldValue = this.getFieldValue(data);
    var conditionValue = this.getConditionValue(data);

    return this.applyOperator(fieldValue, conditionValue);
};

/**
 * Run actions assigned to rule
 */
ImportRule.prototype.runActions = function (data, rowObj, context) {
    if (!Array.isArray(this.actions)) {
        return;
    }

    this.actions.forEach(function (item) {
        item.execute(data, rowObj, context);
    });
};

/**
 * @constructor ImportRuleList class
 * @param {object[]} props - array of import rules
 */
function ImportRuleList() {
    ImportRuleList.parent.constructor.apply(this, arguments);
}

extend(ImportRuleList, List);

/** Static alias for CurrencyList constructor */
ImportRuleList.create = function (props) {
    return new ImportRuleList(props);
};

/**
 * Create list item from specified object
 * @param {Object} obj
 */
ImportRuleList.prototype.createItem = function (obj) {
    return new ImportRule(obj);
};

/**
 * Return array of top level import rules
 */
ImportRuleList.prototype.getRootRules = function () {
    var res = this.data.filter(function (item) {
        return item && item.parent_id === 0;
    });

    return res;
};

/**
 * Return array of top level import rules
 */
ImportRuleList.prototype.getChildRules = function (ruleId) {
    var parentId = parseInt(ruleId, 10);
    if (!parentId) {
        throw new Error('Invalid rule id: ' + ruleId);
    }

    var res = this.data.filter(function (item) {
        return item && item.parent_id === parentId;
    });

    return res;
};

/**
 * Apply list of import rules to specified transaction data
 * @param {Object} data - imported transaction data
 * @param {Object} rowObj - transaction row object
 */
ImportRuleList.prototype.applyRules = function (rules, data, rowObj, context) {
    var rulesData = (Array.isArray(rules)) ? rules : [rules];

    rulesData.forEach(function (rule) {
        var childRules;

        if (!rule.meetCondition(data)) {
            return;
        }

        rule.runActions(data, rowObj, context);
        childRules = this.getChildRules(rule.id);

        this.applyRules(childRules, data, rowObj, context);
    }, this);
};


/**
 * Apply list of import rules to specified transaction data
 * @param {Object} data - imported transaction data
 * @param {Object} rowObj - transaction row object
 * @param {Object} context - import view
 */
ImportRuleList.prototype.applyTo = function (data, rowObj, context) {
    var rules = this.getRootRules();
    this.applyRules(rules, data, rowObj, context);
};
