import { assert } from 'jezve-test';
import { List } from './List.js';
import {
    IMPORT_COND_OP_NOT_EQUAL,
    IMPORT_COND_OP_EQUAL,
    ImportCondition,
} from './ImportCondition.js';

export class ImportConditionList extends List {
    /** Convert object to ImportCondition */
    createItem(obj) {
        return new ImportCondition(obj);
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
     * Search for condition for specified property with `is` (equal) operator
     * @param {Number} field
     */
    findIsCondition(fieldId) {
        const field = parseInt(fieldId, 10);
        if (!field) {
            throw new Error('Invalid field id');
        }

        return this.find((item) => (
            item.field_id === field
            && item.operator === IMPORT_COND_OP_EQUAL
        ));
    }

    /**
     * Check list of conditions has condition for specified property with `is` (equal) operator
     * @param {Number} field
     */
    hasIsCondition(fieldId) {
        return !!this.findIsCondition(fieldId);
    }

    /**
     * Search for condition for specified property with any operator except `is` (equal)
     * @param {Number} field
     */
    findNotIsCondition(fieldId) {
        const field = parseInt(fieldId, 10);
        if (!field) {
            throw new Error('Invalid field id');
        }

        return this.find((item) => (
            item.field_id === field
            && item.operator !== IMPORT_COND_OP_EQUAL
        ));
    }

    /**
     * Check list of conditions has condition for specified property with
     * any operator except `is` (equal)
     * @param {Number} field
     */
    hasNotIsCondition(fieldId) {
        return !!this.findNotIsCondition(fieldId);
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
