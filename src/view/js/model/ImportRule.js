'use strict';

/* global fixFloat, checkDate, extend, ListItem */
/* global ImportConditionList, ImportActionList */
/* global ImportConditionValidationError, ImportActionValidationError */
/* global IMPORT_COND_OP_EQUAL, IMPORT_COND_OP_NOT_EQUAL */
/* global IMPORT_COND_OP_LESS, IMPORT_COND_OP_GREATER */

/**
 * @constructor Import rule class
 * @param {object} props - properties of instance
 */
function ImportRule() {
    ImportRule.parent.constructor.apply(this, arguments);

    this.conditions = new ImportConditionList(this.conditions);
    this.actions = new ImportActionList(this.actions);
}

extend(ImportRule, ListItem);

/**
 * Check specified field name is available
 * @param {string} field - field name to check
 */
ImportRule.prototype.isAvailField = function (field) {
    var availFields = [
        'id',
        'flags',
        'conditions',
        'actions'
    ];

    return typeof field === 'string' && availFields.includes(field);
};

/** Check specified data is meet all conditions of rule */
ImportRule.prototype.meetConditions = function (data) {
    var res = this.conditions.every(function (condition) {
        return condition.meet(data);
    });

    return res;
};

/** Run actions assigned to rule */
ImportRule.prototype.runActions = function (context) {
    this.actions.forEach(function (item) {
        item.execute(context);
    });
};

/** Validate condition amount value */
ImportRule.prototype.isValidConditionAmount = function (value) {
    var amount = parseFloat(fixFloat(value));
    return !Number.isNaN(amount);
};

/** Validate action amount value */
ImportRule.prototype.isValidActionAmount = function (value) {
    var amount = parseFloat(fixFloat(value));
    return (!Number.isNaN(amount) && amount > 0);
};

/** Validate import rule */
ImportRule.prototype.validate = function () {
    var notEqConds;
    var lessConds;
    var greaterConds;
    var ruleActionTypes = [];
    var result = { valid: false };

    // Check conditions
    if (!this.conditions.length) {
        result.message = 'Rule must contain at least one condition';
        return result;
    }

    notEqConds = new ImportConditionList();
    lessConds = new ImportConditionList();
    greaterConds = new ImportConditionList();

    try {
        this.conditions.forEach(function (condition, ind) {
            // Check full duplicates of condition
            if (this.conditions.hasSameCondition(condition)) {
                throw new ImportConditionValidationError('Duplicate condition', ind);
            }

            // Check amount value
            if (condition.isAmountField()
                && !this.isValidConditionAmount(condition.value)) {
                throw new ImportConditionValidationError('Input correct amount', ind);
            }

            // Check date condition
            if (condition.isDateField()
                && !checkDate(condition.value)) {
                throw new ImportConditionValidationError('Input correct date in DD.MM.YYYY format', ind);
            }

            // Check empty condition value is used only for string field
            // with 'equal' and 'not equal' operators
            if (condition.value === ''
                && !(condition.isStringField()
                    && condition.isItemOperator())
            ) {
                throw new ImportConditionValidationError('Input value', ind);
            }

            // Check property is not compared with itself as property value
            if (condition.isPropertyValue()
                && condition.field_id === parseInt(condition.value, 10)) {
                throw new ImportConditionValidationError('Can not compare property with itself', ind);
            }

            // Check 'equal' conditions for each field type present only once
            // 'Equal' operator is exclusive: conjunction with any other operator gives
            // the same result, so it is meaningless
            if (condition.operator === IMPORT_COND_OP_EQUAL) {
                if (this.conditions.hasSameFieldCondition(condition)) {
                    throw new ImportConditionValidationError('\'Equal\' condition can not be combined with other conditions for same property', ind);
                }
            }

            if (condition.operator === IMPORT_COND_OP_LESS) {
                // Check 'less' condition for each field type present only once
                if (lessConds.hasSameFieldCondition(condition)) {
                    throw new ImportConditionValidationError('Duplicate \'less\' condition', ind);
                }
                // Check value regions of 'greater' and 'not equal' conditions is intersected
                // with value region of current condition
                if (greaterConds.hasNotLessCondition(condition)
                    || notEqConds.hasNotLessCondition(condition)) {
                    throw new ImportConditionValidationError('Condition ranges do not overlap', ind);
                }

                lessConds.addItem(condition);
            }

            if (condition.operator === IMPORT_COND_OP_GREATER) {
                // Check 'greater' condition for each field type present only once
                if (greaterConds.hasSameFieldCondition(condition)) {
                    throw new ImportConditionValidationError('Duplicate \'greater\' condition', ind);
                }
                // Check value regions of 'less' and 'not equal' conditions is intersected
                // with value region of current condition
                if (lessConds.hasNotGreaterCondition(condition)
                    || notEqConds.hasNotGreaterCondition(condition)) {
                    throw new ImportConditionValidationError('Condition ranges do not overlap', ind);
                }

                greaterConds.addItem(condition);
            }

            if (condition.operator === IMPORT_COND_OP_NOT_EQUAL) {
                // Check value regions of 'less' and 'greater' conditions es intersected
                // with current value
                if (lessConds.hasNotGreaterCondition(condition)
                    || greaterConds.hasNotLessCondition(condition)) {
                    throw new ImportConditionValidationError('Condition ranges do not overlap', ind);
                }

                notEqConds.addItem(condition);
            }
        }, this);
    } catch (e) {
        if (!(e instanceof ImportConditionValidationError)) {
            throw e;
        }

        result.message = e.message;
        result.conditionIndex = e.conditionIndex;
        return result;
    }

    // Check actions
    if (!this.actions.length) {
        result.message = 'Rule must contain at least one action';
        return result;
    }
    try {
        this.actions.forEach(function (action, ind) {
            // Check each type of action is used only once
            if (ruleActionTypes.includes(action.action_id)) {
                throw new ImportActionValidationError('Duplicate action type', ind);
            }

            ruleActionTypes.push(action.action_id);
            // Amount value
            if (action.isAmountValue()
                && !this.isValidActionAmount(action.value)) {
                throw new ImportActionValidationError('Input correct amount', ind);
            }

            // Account value
            if (action.isAccountValue()
                && !this.actions.hasSetTransfer()) {
                throw new ImportActionValidationError('Transfer transaction type is required', ind);
            }
            // Person value
            if (action.isPersonValue()
                && !this.actions.hasSetDebt()) {
                throw new ImportActionValidationError('Debt transaction type is required', ind);
            }
        }, this);
    } catch (e) {
        if (!(e instanceof ImportActionValidationError)) {
            throw e;
        }

        result.message = e.message;
        result.actionIndex = e.actionIndex;
        return result;
    }

    result.valid = true;

    return result;
};
