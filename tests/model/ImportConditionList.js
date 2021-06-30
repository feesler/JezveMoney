import { List } from './List.js';
import { ImportCondition } from './ImportCondition.js';

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
        if (!id) {
            throw new Error('Invalid rule id');
        }

        return this.filter((item) => item.rule_id === id);
    }

    /**
     * Check list of conditions has condition with same properties
     * @param {ImportCondition} condition
     */
    hasSameCondition(condition) {
        if (!(condition instanceof ImportCondition)) {
            throw new Error('Invalid condition');
        }

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
        if (!(condition instanceof ImportCondition)) {
            throw new Error('Invalid condition');
        }

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
        if (!(condition instanceof ImportCondition)) {
            throw new Error('Invalid rule id');
        }

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
        if (!(condition instanceof ImportCondition)) {
            throw new Error('Invalid rule id');
        }

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
}
