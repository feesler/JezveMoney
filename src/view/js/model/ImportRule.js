import { fixFloat } from '../app.js';
import { checkDate } from '../lib/common.js';
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

    /** Validate import rule */
    validate() {
        const result = { valid: false };

        // Check conditions
        if (!this.conditions.length) {
            result.message = 'Rule must contain at least one condition';
            return result;
        }

        const notEqConds = new ImportConditionList();
        const lessConds = new ImportConditionList();
        const greaterConds = new ImportConditionList();

        try {
            this.conditions.forEach((condition, ind) => {
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
                        && condition.isItemOperator())) {
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
            result.message = 'Rule must contain at least one action';
            return result;
        }
        try {
            this.actions.forEach((action, ind) => {
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
