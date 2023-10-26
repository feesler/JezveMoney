import { fixFloat } from '@jezvejs/number';
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

        this.conditions = ImportConditionList.create(props?.conditions);
        this.actions = ImportActionList.create(props?.actions);
    }

    /**
     * Check specified field name is available
     * @param {string} field - field name to check
     */
    isAvailField(field) {
        const availFields = [
            'id',
            'collapsed',
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
        const sortedActions = this.actions.defaultSort();

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
            result.message = __('import.rules.noConditions');
            return result;
        }

        const notEqConds = ImportConditionList.create();
        const lessConds = ImportConditionList.create();
        const greaterConds = ImportConditionList.create();

        try {
            this.conditions.forEach((condition, ind) => {
                const validation = condition.validate();
                if (!validation.amount) {
                    throw new ImportConditionValidationError(__('import.rules.invalidAmount'), ind);
                }
                if (!validation.date) {
                    throw new ImportConditionValidationError(__('import.rules.invalidDate'), ind);
                }
                if (!validation.emptyValue) {
                    throw new ImportConditionValidationError(__('import.rules.emptyValue'), ind);
                }
                if (!validation.propValue) {
                    throw new ImportConditionValidationError(__('import.rules.comparePropertyUnavailable'), ind);
                }
                if (!validation.sameProperty) {
                    throw new ImportConditionValidationError(__('import.rules.compareSameError'), ind);
                }

                // Check full duplicates of condition
                if (this.conditions.hasSameCondition(condition)) {
                    throw new ImportConditionValidationError(__('import.rules.duplicateCondition'), ind);
                }

                // Check 'equal' conditions for each field type present only once
                // 'Equal' operator is exclusive: conjunction with any other operator gives
                // the same result, so it is meaningless
                if (condition.operator === IMPORT_COND_OP_EQUAL) {
                    if (this.conditions.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('import.rules.equalConditionError'), ind);
                    }
                }

                if (condition.operator === IMPORT_COND_OP_LESS) {
                    // Check 'less' condition for each field type present only once
                    if (lessConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('import.rules.duplicateLessConditionError'), ind);
                    }
                    // Check value regions of 'greater' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (
                        greaterConds.hasNotLessCondition(condition)
                        || notEqConds.hasNotLessCondition(condition)
                    ) {
                        throw new ImportConditionValidationError(__('import.rules.conditionRangesError'), ind);
                    }

                    lessConds.addItem(condition);
                }

                if (condition.operator === IMPORT_COND_OP_GREATER) {
                    // Check 'greater' condition for each field type present only once
                    if (greaterConds.hasSameFieldCondition(condition)) {
                        throw new ImportConditionValidationError(__('import.rules.duplicateGreaterConditionError'), ind);
                    }
                    // Check value regions of 'less' and 'not equal' conditions is intersected
                    // with value region of current condition
                    if (
                        lessConds.hasNotGreaterCondition(condition)
                        || notEqConds.hasNotGreaterCondition(condition)
                    ) {
                        throw new ImportConditionValidationError(__('import.rules.conditionRangesError'), ind);
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
                        throw new ImportConditionValidationError(__('import.rules.conditionRangesError'), ind);
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
            result.message = __('import.rules.noActions');
            return result;
        }
        try {
            this.actions.forEach((action, ind) => {
                // Check each type of action is used only once
                if (ruleActionTypes.includes(action.action_id)) {
                    throw new ImportActionValidationError(__('import.rules.duplicateAction'), ind);
                }

                ruleActionTypes.push(action.action_id);
                // Amount value
                if (action.isAmountValue() && !this.isValidActionAmount(action.value)) {
                    throw new ImportActionValidationError(__('import.rules.invalidAmount'), ind);
                }

                // Account value
                if (action.isAccountValue() && !this.actions.hasSetTransfer()) {
                    throw new ImportActionValidationError(__('import.rules.transferExpected'), ind);
                }

                // Check main account guard condition for 'Set account' action
                if (action.isAccountValue()) {
                    const accountId = parseInt(action.value, 10);
                    const found = this.conditions.hasAccountGuardCondition(accountId);
                    if (!found) {
                        throw new ImportActionValidationError(__('import.rules.accountGuardConditionError'), ind);
                    }
                }

                // Person value
                if (action.isPersonValue() && !this.actions.hasSetDebt()) {
                    throw new ImportActionValidationError(__('import.rules.debtExpected'), ind);
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
