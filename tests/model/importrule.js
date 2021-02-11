import { fixFloat, convDate } from '../common.js';
import {
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
    IMPORT_COND_OP_NOT_EQUAL,
} from './importcondition.js';
import { ImportConditionList } from './importconditionlist.js';
import { ImportActionList } from './importactionlist.js';

/** Import rule model */
export class ImportRule {
    constructor(data) {
        if (
            !data
            || !data.conditions
            || !data.actions
        ) {
            throw new Error('Invalid properties');
        }

        this.flags = data.flags;
        if (data.id) {
            this.id = data.id;
        }

        this.conditions = new ImportConditionList(data.conditions);
        this.actions = new ImportActionList(data.actions);
    }

    /** Check specified data is meet all conditions of rule */
    meetConditions(data) {
        return this.conditions.every((condition) => condition.meet(data));
    }

    /** Run actions assigned to rule */
    runActions(context) {
        this.actions.forEach((item) => item.execute(context));
    }

    /** Validate amount value */
    isValidAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
    }

    /** Validate import rule */
    validate() {
        // Check conditions
        if (!this.conditions.length) {
            return false;
        }

        const ruleActionTypes = [];
        const notEqConds = new ImportConditionList();
        const lessConds = new ImportConditionList();
        const greaterConds = new ImportConditionList();

        for (const condition of this.conditions.data) {
            // Check full duplicates of condition
            if (this.conditions.hasSameCondition(condition)) {
                return false;
            }

            // Check amount value
            if (condition.isAmountField()
                && !this.isValidAmount(condition.value)) {
                return false;
            }

            // Check date condition
            if (condition.isDateField()
                && !convDate(condition.value)) {
                return false;
            }

            // Check empty condition value is used only for string field
            // with 'equal' and 'not equal' operators
            if (condition.value === ''
                && !(condition.isStringField()
                    && condition.isItemOperator())
            ) {
                return false;
            }

            // Check property is not compared with itself as property value
            if (condition.isPropertyValue()
                && condition.field_id === parseInt(condition.value, 10)) {
                return false;
            }

            // Check 'equal' conditions for each field type present only once
            // 'Equal' operator is exclusive: conjunction with any other operator gives
            // the same result, so it is meaningless
            if (condition.operator === IMPORT_COND_OP_EQUAL) {
                if (this.conditions.hasSameFieldCondition(condition)) {
                    return false;
                }
            }

            if (condition.operator === IMPORT_COND_OP_LESS) {
                // Check 'less' condition for each field type present only once
                if (lessConds.hasSameFieldCondition(condition)) {
                    return false;
                }
                // Check value regions of 'greater' and 'not equal' conditions is intersected
                // with value region of current condition
                if (greaterConds.hasNotLessCondition(condition)
                    || notEqConds.hasNotLessCondition(condition)) {
                    return false;
                }

                lessConds.addItem(condition);
            }

            if (condition.operator === IMPORT_COND_OP_GREATER) {
                // Check 'greater' condition for each field type present only once
                if (greaterConds.hasSameFieldCondition(condition)) {
                    return false;
                }
                // Check value regions of 'less' and 'not equal' conditions is intersected
                // with value region of current condition
                if (lessConds.hasNotGreaterCondition(condition)
                    || notEqConds.hasNotGreaterCondition(condition)) {
                    return false;
                }

                greaterConds.addItem(condition);
            }

            if (condition.operator === IMPORT_COND_OP_NOT_EQUAL) {
                // Check value regions of 'less' and 'greater' conditions es intersected
                // with current value
                if (lessConds.hasNotGreaterCondition(condition)
                    || greaterConds.hasNotLessCondition(condition)) {
                    return false;
                }

                notEqConds.addItem(condition);
            }
        }

        // Check actions
        if (!this.actions.length) {
            return false;
        }

        for (const action of this.actions.data) {
            // Check each type of action is used only once
            if (ruleActionTypes.includes(action.action_id)) {
                return false;
            }

            ruleActionTypes.push(action.action_id);
            // Amount value
            if (action.isAmountValue()
                && !this.isValidAmount(action.value)) {
                return false;
            }
            // Account value
            if (action.isAccountValue()
                && !this.actions.hasSetTransfer()) {
                return false;
            }
            // Person value
            if (action.isPersonValue()
                && !this.actions.hasSetDebt()) {
                return false;
            }
        }

        return true;
    }
}
