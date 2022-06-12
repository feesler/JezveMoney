import {
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
    IMPORT_COND_OP_NOT_EQUAL,
} from './ImportCondition.js';
import { ImportConditionList } from './ImportConditionList.js';
import { ImportActionList } from './ImportActionList.js';

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

    /** Convert ImportRule instance to object */
    toPlain() {
        return {
            id: this.id,
            flags: this.flags,
            conditions: this.conditions.map((condition) => ({ ...condition })),
            actions: this.actions.map((action) => ({ ...action })),
        };
    }

    /** Check specified data is meet all conditions of rule */
    meetConditions(data) {
        return this.conditions.every((condition) => condition.meet(data));
    }

    /** Run actions assigned to rule */
    runActions(context) {
        this.actions.forEach((item) => item.execute(context));
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
            if (!condition.validate()) {
                return false;
            }

            // Check full duplicates of condition
            if (this.conditions.hasSameCondition(condition)) {
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
            if (!action.validate()) {
                return false;
            }

            // Check each type of action is used only once
            if (ruleActionTypes.includes(action.action_id)) {
                return false;
            }
            ruleActionTypes.push(action.action_id);

            // In case action type is 'Set account' check action 'Set transaction type'
            // with value 'transferto' or 'transferfrom' is also exist
            if (action.isAccountValue()
                && !this.actions.hasSetTransfer()) {
                return false;
            }

            // Check main account guard condition for 'Set account' action
            if (action.isAccountValue()) {
                const accountId = parseInt(action.value, 10);
                const found = this.conditions.hasAccountGuardCondition(accountId);
                if (!found) {
                    return false;
                }
            }

            // In case action type is 'Set person' check action 'Set transaction type'
            // with value 'debtto' or 'debtfrom' is also exist
            if (action.isPersonValue()
                && !this.actions.hasSetDebt()) {
                return false;
            }
        }

        return true;
    }
}
