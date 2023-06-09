import { fixFloat } from 'jezvejs';
import { __ } from '../utils/utils.js';
import { ListItem } from './ListItem.js';
import {
    IMPORT_COND_OP_EQUAL,
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_LESS,
    IMPORT_COND_OP_GREATER,
} from './ImportCondition.js';
import { ImportConditionList } from './ImportConditionList.js';
import { ImportActionList } from './ImportActionList.js';
import { ImportConditionValidationError } from './Error/ImportConditionValidationError.js';
import { ImportActionValidationError } from './Error/ImportActionValidationError.js';

/**
 * Import rule class
 * @param {object} props - properties of instance
 */
export class ImportRule extends ListItem {
    constructor(props) {
        super(props);

        this.conditions = new ImportConditionList(props?.conditions);
        this.actions = new ImportActionList(props?.actions);
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
        const sortedActions = this.actions.sort();

        return sortedActions.reduce((ctx, action) => action.execute(ctx), context);
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
            result.message = __('ERR_RULE_NO_CONDITIONS');
            return result;
        }

        const notEqConds = new ImportConditionList();
        const lessConds = new ImportConditionList();
        const greaterConds = new ImportConditionList();

        try {
            this.conditions.forEach((condition, ind) => {
                const validation = condition.validate();
                if (!validation.amount) {
                    throw new ImportConditionValidationError(__('ERR_RULE_INVALID_AMOUNT'), ind);
                }
                if (!validation.date) {
                    throw new ImportConditionValidationError(__('ERR_RULE_INVALID_DATE'), ind);
                }
                if (!validation.emptyValue) {
                    throw new ImportConditionValidationError(__('ERR_RULE_EMPTY_VALUE'), ind);
                }
                if (!validation.propValue) {
                    throw new ImportConditionValidationError(__('ERR_RULE_COMPARE_PROPERTY'), ind);
                }
                if (!validation.sameProperty) {
                    throw new ImportConditionValidationError(__('ERR_RULE_COMPARE_SAME'), ind);
                }

                // Check full duplicates of condition
                if (this.conditions.hasSameCondition(condition)) {
                    throw new ImportConditionValidationError(__('ERR_RULE_DUP_CONDITION'), ind);
                }

                // Check 'equal' conditions for each field type present only once
                // 'Equal' operator is exclusive: conjunction with any other operator gives
                // the same result, so it is meaningless
                if (condition.operator === IMPORT_COND_OP_EQUAL) {
                    if (this.conditions.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('ERR_RULE_EQUAL'), ind);
                    }
                }

                if (condition.operator === IMPORT_COND_OP_LESS) {
                    // Check 'less' condition for each field type present only once
                    if (lessConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('ERR_RULE_DUP_LESS'), ind);
                    }
                    // Check value regions of 'greater' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (
                        greaterConds.hasNotLessCondition(condition)
                        || notEqConds.hasNotLessCondition(condition)
                    ) {
                        throw new ImportConditionValidationError(__('ERR_RULE_NOT_OVEPLAP'), ind);
                    }

                    lessConds.addItem(condition);
                }

                if (condition.operator === IMPORT_COND_OP_GREATER) {
                    // Check 'greater' condition for each field type present only once
                    if (greaterConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('ERR_RULE_DUP_GREATER'), ind);
                    }
                    // Check value regions of 'less' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (
                        lessConds.hasNotGreaterCondition(condition)
                        || notEqConds.hasNotGreaterCondition(condition)
                    ) {
                        throw new ImportConditionValidationError(__('ERR_RULE_NOT_OVEPLAP'), ind);
                    }

                    greaterConds.addItem(condition);
                }

                if (condition.operator === IMPORT_COND_OP_NOT_EQUAL) {
                    // Check value regions of 'less' and 'greater' conditions es intersected
                    // with current value
                    if (
                        lessConds.hasNotGreaterCondition(condition)
                        || greaterConds.hasNotLessCondition(condition)
                    ) {
                        throw new ImportConditionValidationError(__('ERR_RULE_NOT_OVEPLAP'), ind);
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
            result.message = __('ERR_RULE_NO_ACTIONS');
            return result;
        }
        try {
            this.actions.forEach((action, ind) => {
                // Check each type of action is used only once
                if (ruleActionTypes.includes(action.action_id)) {
                    throw new ImportActionValidationError(__('ERR_RULE_DUP_ACTION'), ind);
                }

                ruleActionTypes.push(action.action_id);
                // Amount value
                if (action.isAmountValue() && !this.isValidActionAmount(action.value)) {
                    throw new ImportActionValidationError(__('ERR_RULE_INVALID_AMOUNT'), ind);
                }

                // Account value
                if (action.isAccountValue() && !this.actions.hasSetTransfer()) {
                    throw new ImportActionValidationError(__('ERR_RULE_TRANSFER'), ind);
                }

                // Check main account guard condition for 'Set account' action
                if (action.isAccountValue()) {
                    const accountId = parseInt(action.value, 10);
                    const found = this.conditions.hasAccountGuardCondition(accountId);
                    if (!found) {
                        throw new ImportActionValidationError(__('ERR_RULE_ACCOUNT_GUARD'), ind);
                    }
                }

                // Person value
                if (action.isPersonValue() && !this.actions.hasSetDebt()) {
                    throw new ImportActionValidationError(__('ERR_RULE_DEBT'), ind);
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
