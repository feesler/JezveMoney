import { assert } from 'jezve-test';
import { List } from './List.js';
import {
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_EQUAL,
    ImportCondition,
} from './ImportCondition.js';

export class ImportConditionList extends List {
    setData(data) {
        this.data = data.map((item) => new ImportCondition(item));
    }

    /**
     * Return list of conditions for specified rule
     * @param {number} ruleId - rule id
     */
    getRuleConditions(ruleId) {
        const id = parseInt(ruleId, 10);
        assert(id, 'Invalid rule id');

        return this.filter((item) => item.rule_id === id);
    }

    /** Check list of conditions match search query */
    isMatchFilter(value) {
        return this.some((condition) => condition.isMatchFilter(value));
    }

    /**
     * Check list of conditions has condition with same properties
     * @param {ImportCondition} condition
     */
    hasSameCondition(condition) {
        assert.instanceOf(condition, ImportCondition, 'Invalid condition');

        return !!this.find((item) => (
            item !== condition
            && item.field_id === condition.field_id
            && item.operator === condition.operator
            && item.value === condition.value
            && item.flags === condition.flags
        ));
    }

    /**
     * Check list of conditions has condition with same field type
     * @param {ImportCondition} condition
     */
    hasSameFieldCondition(condition) {
        assert.instanceOf(condition, ImportCondition, 'Invalid condition');

        return !!this.find((item) => (
            item !== condition
            && item.flags === condition.flags
            && item.field_id === condition.field_id
        ));
    }

    /**
     * Check list of conditions has condition with same field type
     * and equal or greater value than specified condition
     * @param {ImportCondition} condition
     */
    hasNotLessCondition(condition) {
        assert.instanceOf(condition, ImportCondition, 'Invalid rule id');

        if (condition.isPropertyValue()) {
            return false;
        }

        const value = condition.getConditionValue({});
        return !!this.find((item) => (
            item !== condition
            && !item.isPropertyValue()
            && item.field_id === condition.field_id
            && !(item.getConditionValue({}) < value)
        ));
    }

    /**
     * Check list of conditions has condition with same field type
     * and equal or less value than specified condition
     * @param {ImportCondition} condition
     */
    hasNotGreaterCondition(condition) {
        assert.instanceOf(condition, ImportCondition, 'Invalid rule id');

        if (condition.isPropertyValue()) {
            return false;
        }

        const value = condition.getConditionValue({});
        return !!this.find((item) => (
            item !== condition
            && !item.isPropertyValue()
            && item.field_id === condition.field_id
            && !(item.getConditionValue({}) > value)
        ));
    }

    /**
     * Check list of conditions has guard condition for Main account:
     * Main account not equal accountId or Main account equal not accountId
     * @param {ImportCondition} condition
     */
    hasAccountGuardCondition(accountId) {
        assert(accountId, 'Invalid account id');

        return this.find((condition) => (
            condition.isAccountField()
            && (
                (
                    condition.operator === IMPORT_COND_OP_NOT_EQUAL
                    && parseInt(condition.value, 10) === accountId
                ) || (
                    condition.operator === IMPORT_COND_OP_EQUAL
                    && parseInt(condition.value, 10) !== accountId
                )
            )
        ));
    }
}
