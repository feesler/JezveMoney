import { checkDate } from 'jezvejs';
import { fixFloat } from '../utils.js';
import { ListItem } from './ListItem.js';
import {
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
} from './ImportCondition.js';
import { ImportConditionList } from './ImportConditionList.js';
import { ImportActionList } from './ImportActionList.js';
import { ImportConditionValidationError } from '../error/ImportConditionValidationError.js';
import { ImportActionValidationError } from '../error/ImportActionValidationError.js';

/** Validation messages */
const MSG_NO_CONDITIONS = 'Rule must contain at least one condition';
const MSG_DUP_CONDITION = 'Duplicate condition';
const MSG_INCORRECT_AMOUNT = 'Input correct amount';
const MSG_INVALID_DATE = 'Input correct date in DD.MM.YYYY format';
const MSG_NO_EMPTY_VALUE = 'Input value';
const MSG_SAME_PROPERTY_COMPARE = 'Can not compare property with itself';
const MSG_EQUAL_CONDITION = '\'Equal\' condition can not be combined with other conditions for same property';
const MSG_DUP_LESS = 'Duplicate \'less\' condition';
const MSG_NOT_OVEPLAP = 'Condition ranges do not overlap';
const MSG_DUP_GREATER = 'Duplicate \'greater\' condition';
const MSG_NO_ACTIONS = 'Rule must contain at least one action';
const MSG_DUP_ACTION = 'Duplicate action type';
const MSG_SET_ACCOUNT_GUARD = 'Guard condition for main account is required(main account must be different from the selected)';
const MSG_TRANSFER_REQUIRED = 'Transfer transaction type is required';
const MSG_DEBT_REQUIRED = 'Debt transaction type is required';

/**
 * Import rule class
 * @param {object} props - properties of instance
 */
export class ImportRule extends ListItem {
    constructor(...args) {
        super(...args);

        this.conditions = new ImportConditionList(this.conditions);
        this.actions = new ImportActionList(this.actions);
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = [
            'id',
            'flags',
            'conditions',
            'actions',
        ];

        return typeof field === 'string' && availFields.includes(field);
    }

    /** Check specified data is meet all conditions of rule */
    meetConditions(data) {
        return this.conditions.every((condition) => condition.meet(data));
    }

    /** Run actions assigned to rule */
    runActions(context) {
        this.actions.forEach((item) => {
            item.execute(context);
        });
    }

    /** Validate condition amount value */
    isValidConditionAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return !Number.isNaN(amount);
    }

    /** Validate action amount value */
    isValidActionAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
    }

    /** Check import rule is match search filter */
    isMatchFilter(value) {
        return (this.conditions.isMatchFilter(value) || this.actions.isMatchFilter(value));
    }

    /** Validate import rule */
    validate() {
        const result = { valid: false };

        // Check conditions
        if (!this.conditions.length) {
            result.message = MSG_NO_CONDITIONS;
            return result;
        }

        const notEqConds = new ImportConditionList();
        const lessConds = new ImportConditionList();
        const greaterConds = new ImportConditionList();

        try {
            this.conditions.forEach((condition, ind) => {
                // Check full duplicates of condition
                if (this.conditions.hasSameCondition(condition)) {
                    throw new ImportConditionValidationError(MSG_DUP_CONDITION, ind);
                }

                // Check amount value
                if (condition.isAmountField()
                    && !this.isValidConditionAmount(condition.value)) {
                    throw new ImportConditionValidationError(MSG_INCORRECT_AMOUNT, ind);
                }

                // Check date condition
                if (condition.isDateField()
                    && !checkDate(condition.value)) {
                    throw new ImportConditionValidationError(MSG_INVALID_DATE, ind);
                }

                // Check empty condition value is used only for string field
                // with 'equal' and 'not equal' operators
                if (condition.value === ''
                    && !(condition.isStringField()
                        && condition.isItemOperator())) {
                    throw new ImportConditionValidationError(MSG_NO_EMPTY_VALUE, ind);
                }

                // Check property is not compared with itself as property value
                if (condition.isPropertyValue()
                    && condition.field_id === parseInt(condition.value, 10)) {
                    throw new ImportConditionValidationError(MSG_SAME_PROPERTY_COMPARE, ind);
                }

                // Check 'equal' conditions for each field type present only once
                // 'Equal' operator is exclusive: conjunction with any other operator gives
                // the same result, so it is meaningless
                if (condition.operator === IMPORT_COND_OP_EQUAL) {
                    if (this.conditions.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_EQUAL_CONDITION, ind);
                    }
                }

                if (condition.operator === IMPORT_COND_OP_LESS) {
                    // Check 'less' condition for each field type present only once
                    if (lessConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_DUP_LESS, ind);
                    }
                    // Check value regions of 'greater' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (greaterConds.hasNotLessCondition(condition)
                        || notEqConds.hasNotLessCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_NOT_OVEPLAP, ind);
                    }

                    lessConds.addItem(condition);
                }

                if (condition.operator === IMPORT_COND_OP_GREATER) {
                    // Check 'greater' condition for each field type present only once
                    if (greaterConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_DUP_GREATER, ind);
                    }
                    // Check value regions of 'less' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (lessConds.hasNotGreaterCondition(condition)
                        || notEqConds.hasNotGreaterCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_NOT_OVEPLAP, ind);
                    }

                    greaterConds.addItem(condition);
                }

                if (condition.operator === IMPORT_COND_OP_NOT_EQUAL) {
                    // Check value regions of 'less' and 'greater' conditions es intersected
                    // with current value
                    if (lessConds.hasNotGreaterCondition(condition)
                        || greaterConds.hasNotLessCondition(condition)) {
                        throw new ImportConditionValidationError(MSG_NOT_OVEPLAP, ind);
                    }

                    notEqConds.addItem(condition);
                }
            });
        } catch (e) {
            if (!(e instanceof ImportConditionValidationError)) {
                throw e;
            }

            result.message = e.message;
            result.conditionIndex = e.conditionIndex;
            return result;
        }

        // Check actions
        const ruleActionTypes = [];
        if (!this.actions.length) {
            result.message = MSG_NO_ACTIONS;
            return result;
        }
        try {
            this.actions.forEach((action, ind) => {
                // Check each type of action is used only once
                if (ruleActionTypes.includes(action.action_id)) {
                    throw new ImportActionValidationError(MSG_DUP_ACTION, ind);
                }

                ruleActionTypes.push(action.action_id);
                // Amount value
                if (action.isAmountValue()
                    && !this.isValidActionAmount(action.value)) {
                    throw new ImportActionValidationError(MSG_INCORRECT_AMOUNT, ind);
                }

                // Account value
                if (action.isAccountValue()
                    && !this.actions.hasSetTransfer()) {
                    throw new ImportActionValidationError(MSG_TRANSFER_REQUIRED, ind);
                }

                // Check main account guard condition for 'Set account' action
                if (action.isAccountValue()) {
                    const accountId = parseInt(action.value, 10);
                    const found = this.conditions.hasAccountGuardCondition(accountId);
                    if (!found) {
                        throw new ImportActionValidationError(MSG_SET_ACCOUNT_GUARD, ind);
                    }
                }

                // Person value
                if (action.isPersonValue()
                    && !this.actions.hasSetDebt()) {
                    throw new ImportActionValidationError(MSG_DEBT_REQUIRED, ind);
                }
            });
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
    }
}
